"""
GrassRoots Sports — AI Tracking Service v2
YOLOv8x + supervision ByteTracker player tracking microservice.

Upgrades over v1:
  - YOLOv8x model (5x more accurate than nano)
  - Ball tracking (COCO class 32 — sports ball)
  - Ball-proximity possession (accurate, not heuristic)
  - Speed per player in km/h (top speed + avg speed)
  - Named player support — pass squad JSON in POST body

POST /track      — accepts video + optional squad JSON, returns full tracking data
POST /track-ball — Ball Tracking Mode: ball sampled at 5 fps, events detected
GET  /health     — liveness check
"""

from __future__ import annotations

import json
import os
import tempfile
import time
from collections import defaultdict
from typing import Any, Optional

import httpx

import cv2
import numpy as np
import supervision as sv
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sklearn.cluster import KMeans
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="GrassRoots AI Tracker", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://grassrootssports.live",
        "https://www.grassrootssports.live",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: YOLO | None = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO("yolov8x.pt")  # upgraded from nano — 5x more accurate
    return _model


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PITCH_LENGTH_M = 105.0
PITCH_WIDTH_M = 68.0
HEATMAP_COLS = 20
HEATMAP_ROWS = 13
SAMPLE_FPS = 1
PERSON_CLASS_ID = 0
BALL_CLASS_ID = 32  # COCO sports ball class
MAX_INTERP_GAP = 5  # seconds — gaps longer than this are not interpolated (ball out of play)

# Ball Tracking Mode constants
BALL_TRACK_FPS = 5           # ball-only sampling rate (frames per second) in Ball Tracking Mode
KICK_MIN_SPEED_KMH = 20.0   # minimum ball speed (km/h) to register as a kick
DEFLECT_COS_THRESHOLD = 0.5  # cosine similarity below this = direction change (deflection/pass)
STOPPED_SPEED_KMH = 3.0     # ball speed below this threshold = ball stopped / under control

TRACKER_CONFIG = sv.ByteTrackerArgs(
    track_activation_threshold=0.25,
    lost_track_buffer=50,
    minimum_matching_threshold=0.8,
    frame_rate=SAMPLE_FPS,
    minimum_consecutive_frames=3,
)


# ---------------------------------------------------------------------------
# Jersey color extraction + team classification
# ---------------------------------------------------------------------------

def extract_jersey_color(frame: np.ndarray, box: np.ndarray) -> np.ndarray:
    x1, y1, x2, y2 = map(int, box)
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(frame.shape[1], x2)
    y2 = min(frame.shape[0], y2)

    if x2 <= x1 or y2 <= y1:
        return np.array([0.0, 0.0, 0.0])

    mid_y = y1 + (y2 - y1) // 2
    crop = frame[y1:mid_y, x1:x2]

    if crop.size == 0:
        return np.array([0.0, 0.0, 0.0])

    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    pixels = hsv.reshape(-1, 3).astype(np.float32)

    if len(pixels) < 10:
        return pixels.mean(axis=0)

    km = KMeans(n_clusters=1, n_init=3, random_state=42)
    km.fit(pixels)
    return km.cluster_centers_[0]


def classify_teams(
    tracker_ids: np.ndarray,
    boxes: np.ndarray,
    frame: np.ndarray,
    color_memory: dict[int, np.ndarray],
) -> dict[int, str]:
    for tid, box in zip(tracker_ids, boxes):
        color = extract_jersey_color(frame, box)
        if tid not in color_memory:
            color_memory[tid] = color
        else:
            color_memory[tid] = 0.8 * color_memory[tid] + 0.2 * color

    if len(color_memory) < 3:
        return {tid: "home" for tid in tracker_ids}

    ids = list(color_memory.keys())
    colors = np.array(list(color_memory.values()), dtype=np.float32)

    k = min(3, len(ids))
    km = KMeans(n_clusters=k, n_init=5, random_state=42)
    labels = km.fit_predict(colors)

    from collections import Counter
    counts = Counter(labels)
    sorted_clusters = sorted(counts.keys(), key=lambda c: counts[c], reverse=True)

    cluster_to_team: dict[int, str] = {}
    if len(sorted_clusters) >= 3:
        cluster_to_team[sorted_clusters[0]] = "home"
        cluster_to_team[sorted_clusters[1]] = "away"
        cluster_to_team[sorted_clusters[2]] = "referee"
    elif len(sorted_clusters) == 2:
        cluster_to_team[sorted_clusters[0]] = "home"
        cluster_to_team[sorted_clusters[1]] = "away"
    else:
        cluster_to_team[sorted_clusters[0]] = "home"

    id_to_team: dict[int, str] = {}
    for tid, label in zip(ids, labels):
        id_to_team[tid] = cluster_to_team.get(label, "home")

    return {tid: id_to_team.get(tid, "home") for tid in tracker_ids}


# ---------------------------------------------------------------------------
# Pitch coordinate normalisation
# ---------------------------------------------------------------------------

def detect_pitch_bounds(frame: np.ndarray) -> tuple[int, int, int, int]:
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_green = np.array([30, 40, 40])
    upper_green = np.array([90, 255, 255])
    mask = cv2.inRange(hsv, lower_green, upper_green)
    kernel = np.ones((15, 15), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    coords = cv2.findNonZero(mask)
    if coords is None or len(coords) < 1000:
        h, w = frame.shape[:2]
        return 0, 0, w, h
    x, y, w, h = cv2.boundingRect(coords)
    return x, y, x + w, y + h


def pixel_to_pitch(
    px: float,
    py: float,
    pitch_bounds: tuple[int, int, int, int],
) -> tuple[float, float]:
    x_min, y_min, x_max, y_max = pitch_bounds
    pw = max(x_max - x_min, 1)
    ph = max(y_max - y_min, 1)
    x_norm = max(0.0, min(1.0, (px - x_min) / pw))
    y_norm = max(0.0, min(1.0, (py - y_min) / ph))
    return x_norm, y_norm


# ---------------------------------------------------------------------------
# Heatmap + distance + speed
# ---------------------------------------------------------------------------

def build_heatmap(positions: list[tuple[float, float]]) -> list[list[int]]:
    grid = [[0] * HEATMAP_COLS for _ in range(HEATMAP_ROWS)]
    for x_norm, y_norm in positions:
        col = min(int(x_norm * HEATMAP_COLS), HEATMAP_COLS - 1)
        row = min(int(y_norm * HEATMAP_ROWS), HEATMAP_ROWS - 1)
        grid[row][col] += 1
    return grid


def calculate_distance_m(positions: list[tuple[float, float]]) -> float:
    if len(positions) < 2:
        return 0.0
    total = 0.0
    for i in range(1, len(positions)):
        dx = (positions[i][0] - positions[i - 1][0]) * PITCH_LENGTH_M
        dy = (positions[i][1] - positions[i - 1][1]) * PITCH_WIDTH_M
        total += (dx**2 + dy**2) ** 0.5
    return round(total, 1)


def calculate_speeds(positions: list[tuple[float, float]]) -> list[float]:
    """
    Speed in km/h per step. SAMPLE_FPS=1 so each step = 1 second.
    speed_kmh = distance_m * 3.6
    """
    speeds: list[float] = []
    for i in range(1, len(positions)):
        dx = (positions[i][0] - positions[i - 1][0]) * PITCH_LENGTH_M
        dy = (positions[i][1] - positions[i - 1][1]) * PITCH_WIDTH_M
        dist_m = (dx**2 + dy**2) ** 0.5
        speeds.append(round(dist_m * 3.6, 1))
    return speeds


# ---------------------------------------------------------------------------
# Ball position interpolation (post-processing — no model changes)
# ---------------------------------------------------------------------------

def interpolate_ball_positions(
    detected: list[dict[str, Any]],
    max_gap: int = MAX_INTERP_GAP,
) -> list[dict[str, Any]]:
    """
    Fill gaps between detected ball positions using linear interpolation.

    max_gap: maximum gap (in units of the position 'second' key) to fill.
      - In standard 1 fps mode: max_gap=5 means 5 seconds.
      - In Ball Tracking Mode (5 fps): pass max_gap=BALL_TRACK_FPS*MAX_INTERP_GAP (25 frames).
    Longer gaps indicate the ball was genuinely out of frame (throw-in, set-piece
    delay, ball out of play) and are left as-is.

    Detected positions carry no extra flag; interpolated positions carry
    interpolated=True so consumers can distinguish them.
    """
    if len(detected) < 2:
        return detected

    sorted_det = sorted(detected, key=lambda d: d["second"])
    by_second: set[int] = {d["second"] for d in sorted_det}

    result: list[dict[str, Any]] = list(sorted_det)

    for i in range(len(sorted_det) - 1):
        s1 = sorted_det[i]["second"]
        x1 = sorted_det[i]["x"]
        y1 = sorted_det[i]["y"]
        s2 = sorted_det[i + 1]["second"]
        x2 = sorted_det[i + 1]["x"]
        y2 = sorted_det[i + 1]["y"]

        gap = s2 - s1
        if gap <= 1 or gap > max_gap:
            continue  # no gap to fill, or gap too wide to trust

        for s in range(s1 + 1, s2):
            if s in by_second:
                continue  # already have a detection at this second
            t = (s - s1) / (s2 - s1)
            result.append({
                "second": s,
                "x": round(x1 + t * (x2 - x1), 3),
                "y": round(y1 + t * (y2 - y1), 3),
                "interpolated": True,
            })

    result.sort(key=lambda d: d["second"])
    return result


# ---------------------------------------------------------------------------
# Ball event detection helpers (Ball Tracking Mode)
# ---------------------------------------------------------------------------

def compute_ball_speed(
    pos1: dict[str, Any],
    pos2: dict[str, Any],
    dt_seconds: float,
) -> float:
    """Ball speed in km/h between two normalised pitch positions."""
    if dt_seconds <= 0:
        return 0.0
    dx = (pos2["x"] - pos1["x"]) * PITCH_LENGTH_M
    dy = (pos2["y"] - pos1["y"]) * PITCH_WIDTH_M
    dist_m = (dx**2 + dy**2) ** 0.5
    return round(dist_m / dt_seconds * 3.6, 1)


def detect_ball_events(
    ball_positions: list[dict[str, Any]],
    dt: float,
) -> list[dict[str, Any]]:
    """
    Analyse a ball position sequence and return detected events.

    dt: seconds between consecutive positions (= ball_sample_every / original_fps).

    Events detected:
      "kick"        — speed jumps from near-zero to > KICK_MIN_SPEED_KMH
      "deflection"  — direction change (cos < DEFLECT_COS_THRESHOLD) while ball
                      is moving faster than KICK_MIN_SPEED_KMH
      "stopped"     — speed drops below STOPPED_SPEED_KMH after being above
                      KICK_MIN_SPEED_KMH (ball under control / dead ball)

    Interpolated positions are included in velocity analysis — linear interpolation
    creates straight-line paths and does not produce artificial direction changes,
    so the presence of interpolated positions is safe for event detection.
    """
    if len(ball_positions) < 2:
        return []

    # Pre-compute speed for every consecutive pair
    speeds: list[float] = [
        compute_ball_speed(ball_positions[i - 1], ball_positions[i], dt)
        for i in range(1, len(ball_positions))
    ]

    events: list[dict[str, Any]] = []
    prev_fast = False

    for i, speed in enumerate(speeds):
        pos = ball_positions[i + 1]
        is_fast = speed > KICK_MIN_SPEED_KMH
        is_stopped = speed < STOPPED_SPEED_KMH

        # Kick: transition from stopped/slow to fast
        if is_fast and not prev_fast:
            events.append({
                "type": "kick",
                "frame": pos.get("second", i + 1),
                "time_s": pos.get("time_s", round((i + 1) * dt, 2)),
                "x": pos["x"],
                "y": pos["y"],
                "speed_kmh": speed,
            })

        # Deflection: fast ball changes direction significantly
        elif is_fast and prev_fast and i >= 1:
            p0 = ball_positions[i - 1]
            p1 = ball_positions[i]
            p2 = ball_positions[i + 1]
            v1 = np.array([(p1["x"] - p0["x"]) * PITCH_LENGTH_M,
                            (p1["y"] - p0["y"]) * PITCH_WIDTH_M], dtype=float)
            v2 = np.array([(p2["x"] - p1["x"]) * PITCH_LENGTH_M,
                            (p2["y"] - p1["y"]) * PITCH_WIDTH_M], dtype=float)
            n1 = float(np.linalg.norm(v1))
            n2 = float(np.linalg.norm(v2))
            if n1 > 1e-9 and n2 > 1e-9:
                cos_sim = float(np.dot(v1, v2) / (n1 * n2))
                if cos_sim < DEFLECT_COS_THRESHOLD:
                    events.append({
                        "type": "deflection",
                        "frame": pos.get("second", i + 1),
                        "time_s": pos.get("time_s", round((i + 1) * dt, 2)),
                        "x": pos["x"],
                        "y": pos["y"],
                        "speed_kmh": speed,
                        "direction_cos": round(cos_sim, 3),
                    })

        # Stopped: fast ball drops to near-zero — ball under control or dead
        if is_stopped and prev_fast:
            events.append({
                "type": "stopped",
                "frame": pos.get("second", i + 1),
                "time_s": pos.get("time_s", round((i + 1) * dt, 2)),
                "x": pos["x"],
                "y": pos["y"],
                "speed_kmh": speed,
            })

        prev_fast = is_fast

    return events


# ---------------------------------------------------------------------------
# Main tracking endpoint
# ---------------------------------------------------------------------------

@app.post("/track")
async def track_video(
    file: UploadFile = File(...),
    squad: Optional[str] = Form(None),
) -> dict[str, Any]:
    """
    Accept a match video and return per-player tracking data.

    squad (optional Form field): JSON string mapping tracker IDs to player names.
    Example: '{"1": "Musona K.", "7": "Billiat K."}'

    Analyst can also name players in the web app after tracking completes —
    the web app sends a save request with the name mapping.
    """
    if file.content_type and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    squad_map: dict[str, str] = {}
    if squad:
        try:
            squad_map = json.loads(squad)
        except json.JSONDecodeError:
            pass

    suffix = os.path.splitext(file.filename or "match.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        return _run_tracking(tmp_path, squad_map)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _run_tracking(video_path: str, squad_map: dict[str, str]) -> dict[str, Any]:
    model = get_model()
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise HTTPException(status_code=422, detail="Cannot open video file")

    original_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    sample_every = max(1, int(round(original_fps / SAMPLE_FPS)))

    tracker = sv.ByteTracker(
        track_activation_threshold=TRACKER_CONFIG.track_activation_threshold,
        lost_track_buffer=TRACKER_CONFIG.lost_track_buffer,
        minimum_matching_threshold=TRACKER_CONFIG.minimum_matching_threshold,
        frame_rate=SAMPLE_FPS,
        minimum_consecutive_frames=TRACKER_CONFIG.minimum_consecutive_frames,
    )

    player_positions: dict[int, list[tuple[float, float]]] = defaultdict(list)
    player_teams: dict[int, str] = {}
    player_seconds: dict[int, list[int]] = defaultdict(list)
    color_memory: dict[int, np.ndarray] = {}

    # Ball tracking
    ball_positions: list[dict[str, Any]] = []
    last_ball_pos: tuple[float, float] | None = None

    # Possession — ball proximity preferred, central-third fallback
    possession_frames: dict[str, int] = {"home": 0, "away": 0}

    pitch_bounds: tuple[int, int, int, int] | None = None
    frame_idx = 0
    second = 0
    frames_processed = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_every == 0:
            # Stabilise pitch bounds from first 10 sampled frames
            if frames_processed < 10:
                bounds = detect_pitch_bounds(frame)
                if pitch_bounds is None:
                    pitch_bounds = bounds
                else:
                    pitch_bounds = tuple(
                        int(0.7 * a + 0.3 * b)
                        for a, b in zip(pitch_bounds, bounds)
                    )  # type: ignore[assignment]

            if pitch_bounds is None:
                pitch_bounds = (0, 0, width, height)

            # Detect players (class 0) AND ball (class 32) in one pass
            results = model(
                frame,
                classes=[PERSON_CLASS_ID, BALL_CLASS_ID],
                verbose=False,
            )[0]

            detections_all = sv.Detections.from_ultralytics(results)

            # Split by class_id
            if detections_all.class_id is not None and len(detections_all) > 0:
                player_mask = detections_all.class_id == PERSON_CLASS_ID
                ball_mask = detections_all.class_id == BALL_CLASS_ID
                player_detections = detections_all[player_mask]
                ball_detections = detections_all[ball_mask]
            else:
                player_detections = detections_all
                ball_detections = sv.Detections.empty()

            # Track players
            player_detections = tracker.update_with_detections(player_detections)

            # Ball — highest confidence detection this frame
            ball_pos_this_frame: tuple[float, float] | None = None
            if len(ball_detections) > 0:
                best_idx = (
                    int(np.argmax(ball_detections.confidence))
                    if ball_detections.confidence is not None
                    else 0
                )
                bx1, by1, bx2, by2 = ball_detections.xyxy[best_idx]
                bx = (bx1 + bx2) / 2.0
                by = (by1 + by2) / 2.0
                bx_norm, by_norm = pixel_to_pitch(bx, by, pitch_bounds)
                ball_pos_this_frame = (bx_norm, by_norm)
                last_ball_pos = ball_pos_this_frame
                ball_positions.append({
                    "second": second,
                    "x": round(bx_norm, 3),
                    "y": round(by_norm, 3),
                })

            # Process player detections
            if len(player_detections) > 0 and player_detections.tracker_id is not None:
                tracker_ids = player_detections.tracker_id
                boxes = player_detections.xyxy

                team_map = classify_teams(tracker_ids, boxes, frame, color_memory)

                for tid, box in zip(tracker_ids, boxes):
                    px = (box[0] + box[2]) / 2.0
                    py = box[3]
                    x_norm, y_norm = pixel_to_pitch(px, py, pitch_bounds)
                    player_positions[int(tid)].append((x_norm, y_norm))
                    player_seconds[int(tid)].append(second)
                    player_teams[int(tid)] = team_map.get(int(tid), "home")

                # Possession: ball proximity (accurate) or central-third fallback
                ball_ref = ball_pos_this_frame or last_ball_pos
                if ball_ref is not None:
                    min_dist = float("inf")
                    closest_team = "home"
                    for tid, box in zip(tracker_ids, boxes):
                        px = (box[0] + box[2]) / 2.0
                        py = box[3]
                        x_norm, y_norm = pixel_to_pitch(px, py, pitch_bounds)
                        dist = (
                            (x_norm - ball_ref[0]) ** 2 +
                            (y_norm - ball_ref[1]) ** 2
                        ) ** 0.5
                        if dist < min_dist:
                            min_dist = dist
                            closest_team = team_map.get(int(tid), "home")
                    if closest_team in ("home", "away"):
                        possession_frames[closest_team] += 1
                else:
                    home_count = sum(
                        1 for tid in tracker_ids
                        if team_map.get(int(tid)) == "home"
                    )
                    away_count = sum(
                        1 for tid in tracker_ids
                        if team_map.get(int(tid)) == "away"
                    )
                    if home_count >= away_count:
                        possession_frames["home"] += 1
                    else:
                        possession_frames["away"] += 1

            second += 1
            frames_processed += 1

        frame_idx += 1

    cap.release()

    # Post-processing: interpolate ball positions to smooth gaps ≤ MAX_INTERP_GAP seconds
    raw_ball_count = len(ball_positions)
    if len(ball_positions) >= 2:
        ball_positions = interpolate_ball_positions(ball_positions)
    interpolated_count = len(ball_positions) - raw_ball_count

    # Build per-player output with speed data
    players_out: list[dict[str, Any]] = []
    for tid, positions in player_positions.items():
        if len(positions) < 3:
            continue

        seconds_list = player_seconds[tid]
        avg_x = round(sum(p[0] for p in positions) / len(positions), 3)
        avg_y = round(sum(p[1] for p in positions) / len(positions), 3)
        distance = calculate_distance_m(positions)
        heatmap = build_heatmap(positions)
        speeds = calculate_speeds(positions)

        top_speed = round(max(speeds), 1) if speeds else 0.0
        avg_speed = round(sum(speeds) / len(speeds), 1) if speeds else 0.0

        players_out.append({
            "id": tid,
            "name": squad_map.get(str(tid), ""),
            "team": player_teams.get(tid, "home"),
            "positions": [
                {"second": s, "x": round(x, 3), "y": round(y, 3)}
                for s, (x, y) in zip(seconds_list, positions)
            ],
            "distance_m": distance,
            "avg_x": avg_x,
            "avg_y": avg_y,
            "heatmap": heatmap,
            "top_speed_kmh": top_speed,
            "avg_speed_kmh": avg_speed,
        })

    total_poss = possession_frames["home"] + possession_frames["away"]
    if total_poss > 0:
        poss_home = round(possession_frames["home"] / total_poss * 100)
        poss_away = 100 - poss_home
    else:
        poss_home, poss_away = 50, 50

    return {
        "players": players_out,
        "ball": ball_positions,
        "stats": {
            "possession_home": poss_home,
            "possession_away": poss_away,
            "duration_seconds": second,
            "frames_processed": frames_processed,
            "ball_detected_frames": raw_ball_count,
            "ball_interpolated_frames": interpolated_count,
        },
        "video": {
            "width": width,
            "height": height,
            "fps": round(original_fps, 2),
            "total_frames": total_frames,
        },
    }


# ---------------------------------------------------------------------------
# Ball Tracking Mode endpoint (5 fps ball + 1 fps players)
# ---------------------------------------------------------------------------

@app.post("/track-ball")
async def track_ball(
    file: UploadFile = File(...),
    squad: Optional[str] = Form(None),
) -> dict[str, Any]:
    """
    Ball Tracking Mode — samples ball at BALL_TRACK_FPS (5 fps) for event
    detection (kick / deflection / stopped). Players tracked at SAMPLE_FPS (1 fps).
    Designed for short clips (< 3 minutes).

    Returns standard tracking output plus 'ball_events' list.
    """
    if file.content_type and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    squad_map: dict[str, str] = {}
    if squad:
        try:
            squad_map = json.loads(squad)
        except json.JSONDecodeError:
            pass

    suffix = os.path.splitext(file.filename or "match.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        return _run_ball_tracking(tmp_path, squad_map)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _run_ball_tracking(video_path: str, squad_map: dict[str, str]) -> dict[str, Any]:
    """
    Ball Tracking Mode core loop.

    At frames where ball and player sampling coincide, a single combined
    detection call handles both classes. At ball-only frames, a fast
    single-class [BALL_CLASS_ID] call is used.
    """
    model = get_model()
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise HTTPException(status_code=422, detail="Cannot open video file")

    original_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    ball_sample_every = max(1, int(round(original_fps / BALL_TRACK_FPS)))
    player_sample_every = max(1, int(round(original_fps / SAMPLE_FPS)))

    # Actual time between consecutive ball positions
    dt = ball_sample_every / original_fps

    tracker = sv.ByteTracker(
        track_activation_threshold=TRACKER_CONFIG.track_activation_threshold,
        lost_track_buffer=TRACKER_CONFIG.lost_track_buffer,
        minimum_matching_threshold=TRACKER_CONFIG.minimum_matching_threshold,
        frame_rate=SAMPLE_FPS,
        minimum_consecutive_frames=TRACKER_CONFIG.minimum_consecutive_frames,
    )

    player_positions: dict[int, list[tuple[float, float]]] = defaultdict(list)
    player_teams: dict[int, str] = {}
    player_seconds: dict[int, list[int]] = defaultdict(list)
    color_memory: dict[int, np.ndarray] = {}

    ball_positions: list[dict[str, Any]] = []
    last_ball_pos: tuple[float, float] | None = None
    possession_frames: dict[str, int] = {"home": 0, "away": 0}

    pitch_bounds: tuple[int, int, int, int] | None = None
    frame_idx = 0
    player_second = 0
    ball_frame_idx = 0
    player_frames_processed = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        is_ball_frame = (frame_idx % ball_sample_every == 0)
        is_player_frame = (frame_idx % player_sample_every == 0)

        if not is_ball_frame and not is_player_frame:
            frame_idx += 1
            continue

        # Stabilise pitch bounds from first 10 player-sampled frames
        if is_player_frame and player_frames_processed < 10:
            bounds = detect_pitch_bounds(frame)
            if pitch_bounds is None:
                pitch_bounds = bounds
            else:
                pitch_bounds = tuple(
                    int(0.7 * a + 0.3 * b)
                    for a, b in zip(pitch_bounds, bounds)
                )  # type: ignore[assignment]

        if pitch_bounds is None:
            pitch_bounds = (0, 0, width, height)

        ball_detections: sv.Detections = sv.Detections.empty()
        player_detections_raw: sv.Detections | None = None

        if is_ball_frame and is_player_frame:
            # Single combined call — detect both classes at once
            results = model(
                frame,
                classes=[PERSON_CLASS_ID, BALL_CLASS_ID],
                verbose=False,
            )[0]
            detections_all = sv.Detections.from_ultralytics(results)
            if detections_all.class_id is not None and len(detections_all) > 0:
                player_detections_raw = detections_all[detections_all.class_id == PERSON_CLASS_ID]
                ball_detections = detections_all[detections_all.class_id == BALL_CLASS_ID]
            else:
                player_detections_raw = detections_all

        elif is_ball_frame:
            # Ball-only frame — fast single-class call
            results = model(frame, classes=[BALL_CLASS_ID], verbose=False)[0]
            ball_detections = sv.Detections.from_ultralytics(results)

        else:
            # Player-only frame (ball_sample_every < player_sample_every would be unusual
            # but handled for completeness)
            results = model(frame, classes=[PERSON_CLASS_ID], verbose=False)[0]
            player_detections_raw = sv.Detections.from_ultralytics(results)

        # Process ball
        if is_ball_frame:
            ball_pos_this_frame: tuple[float, float] | None = None
            if len(ball_detections) > 0:
                best_idx = (
                    int(np.argmax(ball_detections.confidence))
                    if ball_detections.confidence is not None
                    else 0
                )
                bx1, by1, bx2, by2 = ball_detections.xyxy[best_idx]
                bx = (bx1 + bx2) / 2.0
                by = (by1 + by2) / 2.0
                bx_norm, by_norm = pixel_to_pitch(bx, by, pitch_bounds)
                ball_pos_this_frame = (bx_norm, by_norm)
                last_ball_pos = ball_pos_this_frame
                ball_positions.append({
                    "second": ball_frame_idx,
                    "time_s": round(ball_frame_idx * dt, 2),
                    "x": round(bx_norm, 3),
                    "y": round(by_norm, 3),
                })
            ball_frame_idx += 1

        # Process players
        if is_player_frame and player_detections_raw is not None:
            player_detections = tracker.update_with_detections(player_detections_raw)

            if len(player_detections) > 0 and player_detections.tracker_id is not None:
                tracker_ids = player_detections.tracker_id
                boxes = player_detections.xyxy
                team_map = classify_teams(tracker_ids, boxes, frame, color_memory)

                for tid, box in zip(tracker_ids, boxes):
                    px = (box[0] + box[2]) / 2.0
                    py = box[3]
                    x_norm, y_norm = pixel_to_pitch(px, py, pitch_bounds)
                    player_positions[int(tid)].append((x_norm, y_norm))
                    player_seconds[int(tid)].append(player_second)
                    player_teams[int(tid)] = team_map.get(int(tid), "home")

                ball_ref = (ball_pos_this_frame if is_ball_frame else None) or last_ball_pos
                if ball_ref is not None:
                    min_dist = float("inf")
                    closest_team = "home"
                    for tid, box in zip(tracker_ids, boxes):
                        px = (box[0] + box[2]) / 2.0
                        py = box[3]
                        x_norm, y_norm = pixel_to_pitch(px, py, pitch_bounds)
                        dist = ((x_norm - ball_ref[0])**2 + (y_norm - ball_ref[1])**2) ** 0.5
                        if dist < min_dist:
                            min_dist = dist
                            closest_team = team_map.get(int(tid), "home")
                    if closest_team in ("home", "away"):
                        possession_frames[closest_team] += 1
                else:
                    home_count = sum(1 for tid in tracker_ids if team_map.get(int(tid)) == "home")
                    away_count = sum(1 for tid in tracker_ids if team_map.get(int(tid)) == "away")
                    possession_frames["home" if home_count >= away_count else "away"] += 1

            player_second += 1
            player_frames_processed += 1

        frame_idx += 1

    cap.release()

    # Interpolate ball positions — gap measured in ball frame units (5 fps)
    interp_gap_frames = BALL_TRACK_FPS * MAX_INTERP_GAP  # 5 fps × 5 s = 25 frames
    raw_ball_count = len(ball_positions)
    if len(ball_positions) >= 2:
        ball_positions = interpolate_ball_positions(ball_positions, max_gap=interp_gap_frames)
    interpolated_count = len(ball_positions) - raw_ball_count

    # Ensure interpolated positions carry time_s
    for pos in ball_positions:
        if "time_s" not in pos:
            pos["time_s"] = round(pos["second"] * dt, 2)

    # Detect ball events from full position sequence
    ball_events = detect_ball_events(ball_positions, dt)

    # Build per-player output
    players_out: list[dict[str, Any]] = []
    for tid, positions in player_positions.items():
        if len(positions) < 3:
            continue

        seconds_list = player_seconds[tid]
        avg_x = round(sum(p[0] for p in positions) / len(positions), 3)
        avg_y = round(sum(p[1] for p in positions) / len(positions), 3)
        distance = calculate_distance_m(positions)
        heatmap = build_heatmap(positions)
        speeds = calculate_speeds(positions)
        top_speed = round(max(speeds), 1) if speeds else 0.0
        avg_speed = round(sum(speeds) / len(speeds), 1) if speeds else 0.0

        players_out.append({
            "id": tid,
            "name": squad_map.get(str(tid), ""),
            "team": player_teams.get(tid, "home"),
            "positions": [
                {"second": s, "x": round(x, 3), "y": round(y, 3)}
                for s, (x, y) in zip(seconds_list, positions)
            ],
            "distance_m": distance,
            "avg_x": avg_x,
            "avg_y": avg_y,
            "heatmap": heatmap,
            "top_speed_kmh": top_speed,
            "avg_speed_kmh": avg_speed,
        })

    total_poss = possession_frames["home"] + possession_frames["away"]
    poss_home = round(possession_frames["home"] / total_poss * 100) if total_poss > 0 else 50
    poss_away = 100 - poss_home

    return {
        "players": players_out,
        "ball": ball_positions,
        "ball_events": ball_events,
        "stats": {
            "possession_home": poss_home,
            "possession_away": poss_away,
            "duration_seconds": player_second,
            "frames_processed": player_frames_processed,
            "ball_detected_frames": raw_ball_count,
            "ball_interpolated_frames": interpolated_count,
            "ball_events_detected": len(ball_events),
            "ball_sample_fps": BALL_TRACK_FPS,
        },
        "video": {
            "width": width,
            "height": height,
            "fps": round(original_fps, 2),
            "total_frames": total_frames,
        },
    }


# ---------------------------------------------------------------------------
# Gemini upload proxy (browser → Python → Google, bypasses CORS)
# ---------------------------------------------------------------------------

@app.post("/gemini-upload")
async def gemini_upload(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Accept a video from the browser and upload it to Gemini File API server-to-server.
    The browser cannot PUT directly to Google due to CORS. This endpoint proxies it.
    Returns { fileUri, fileName, mimeType, state } for use with generateContent.
    """
    google_key = os.environ.get("GOOGLE_AI_API_KEY")
    if not google_key:
        raise HTTPException(status_code=500, detail="GOOGLE_AI_API_KEY not configured on AI service")

    content = await file.read()
    mime_type = file.content_type or "video/mp4"
    content_length = len(content)

    timeout = httpx.Timeout(connect=30.0, read=600.0, write=600.0, pool=10.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        # Step 1: Initiate resumable upload session (tiny metadata request)
        init_res = await client.post(
            f"https://generativelanguage.googleapis.com/upload/v1beta/files?key={google_key}",
            headers={
                "X-Goog-Upload-Protocol": "resumable",
                "X-Goog-Upload-Command": "start",
                "X-Goog-Upload-Header-Content-Length": str(content_length),
                "X-Goog-Upload-Header-Content-Type": mime_type,
                "Content-Type": "application/json",
            },
            json={"file": {"display_name": f"match-{int(time.time())}"}},
        )

        if init_res.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to initiate Gemini upload: {init_res.text[:300]}",
            )

        upload_url = init_res.headers.get("X-Goog-Upload-URL")
        if not upload_url:
            raise HTTPException(status_code=502, detail="Google did not return upload URL")

        # Step 2: Upload video bytes to Google (server-to-server — no CORS restriction)
        upload_res = await client.put(
            upload_url,
            headers={
                "Content-Length": str(content_length),
                "X-Goog-Upload-Offset": "0",
                "X-Goog-Upload-Command": "upload, finalize",
            },
            content=content,
        )

        if upload_res.status_code not in (200, 201):
            raise HTTPException(
                status_code=502,
                detail=f"Failed to upload to Gemini: {upload_res.text[:300]}",
            )

        file_info = upload_res.json().get("file", {})
        return {
            "fileUri":  file_info.get("uri", ""),
            "fileName": file_info.get("name", ""),
            "mimeType": file_info.get("mimeType", mime_type),
            "state":    file_info.get("state", "ACTIVE"),
        }


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "grassroots-ai-tracker", "model": "yolov8x"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=1)
