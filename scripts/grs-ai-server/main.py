"""
GRS AI Python Server — localhost:8765
Provides team-level analysis that runs offline.

Engines (installed via requirements.txt):
  - OpenPifPaf  : multi-person pose estimation
  - YOLOv8      : object detection (Ultralytics)
  - ByteTrack   : player tracking across frames (via Supervision)
  - Supervision : zone counting, heatmaps, line crossing

Start:
  pip install -r requirements.txt
  python main.py
  OR: uvicorn main:app --host 0.0.0.0 --port 8765 --reload
"""

from __future__ import annotations
import json, os, tempfile
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GRS AI Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://grassrootssports.live",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Engine availability check ─────────────────────────────────────────────────

def _available_engines() -> list[str]:
    engines = []
    try:
        import openpifpaf  # noqa: F401
        engines.append("openpifpaf")
    except ImportError:
        pass
    try:
        import supervision  # noqa: F401
        engines.append("supervision")
    except ImportError:
        pass
    try:
        from ultralytics import YOLO  # noqa: F401
        engines.append("yolov8")
    except ImportError:
        pass
    try:
        import torch  # noqa: F401
        engines.append("torch")
    except ImportError:
        pass
    return engines


@app.get("/health")
def health():
    return {"status": "ok", "engines": _available_engines()}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _save_upload(upload: UploadFile) -> str:
    """Save uploaded video to a temp file, return path."""
    suffix = os.path.splitext(upload.filename or ".mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        content = upload.file.read()
        f.write(content)
        return f.name


# ── /analyse ──────────────────────────────────────────────────────────────────

@app.post("/analyse")
async def analyse(video: UploadFile, task: str = Form("pose")):
    """
    task: "pose"      → OpenPifPaf multi-person skeleton
          "track"     → YOLOv8 + ByteTrack player tracking
          "set_piece" → YOLOv8 ball + players + zones + heatmap
    """
    path = _save_upload(video)
    try:
        if task == "track":
            result = _track_players(path)
        elif task == "set_piece":
            result = _analyse_set_piece(path)
        else:
            result = _analyse_pose(path)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
    return result


# ── OpenPifPaf multi-person pose ──────────────────────────────────────────────

def _analyse_pose(video_path: str) -> dict:
    try:
        import openpifpaf
        import cv2
        import numpy as np
        from PIL import Image

        predictor = openpifpaf.Predictor(checkpoint="shufflenetv2k30")
        cap = cv2.VideoCapture(video_path)
        players: list[dict] = []
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % 5 != 0:  # sample every 5th frame
                frame_idx += 1
                continue

            h, w = frame.shape[:2]
            pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            predictions, _, _ = predictor.numpy_image(np.array(pil_img))

            for i, pred in enumerate(predictions):
                kps = [
                    {"x": float(kp[0] / w), "y": float(kp[1] / h), "score": float(kp[2])}
                    for kp in pred.data
                ]
                bbox_raw = pred.bbox()
                players.append({
                    "id":        i,
                    "frame":     frame_idx,
                    "keypoints": kps,
                    "bbox": {
                        "x": float(bbox_raw[0] / w),
                        "y": float(bbox_raw[1] / h),
                        "w": float(bbox_raw[2] / w),
                        "h": float(bbox_raw[3] / h),
                    },
                })
            frame_idx += 1

        cap.release()
        return {
            "players":         players,
            "ballPositions":   [],
            "framesProcessed": frame_idx // 5,
        }
    except Exception as exc:
        return {"players": [], "ballPositions": [], "framesProcessed": 0, "error": str(exc)}


# ── ByteTrack player tracking ─────────────────────────────────────────────────

def _track_players(video_path: str) -> dict:
    try:
        from ultralytics import YOLO
        import supervision as sv
        import cv2
        import numpy as np

        model   = YOLO("yolov8n.pt")   # auto-downloads on first use
        tracker = sv.ByteTrack()
        cap     = cv2.VideoCapture(video_path)
        w_total = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h_total = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        heatmap: np.ndarray = np.zeros((10, 10), dtype=np.float32)
        tracks_data: dict[int, list] = {}
        zone_counts = {"left_third": 0, "middle_third": 0, "right_third": 0}
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % 3 != 0:
                frame_idx += 1
                continue

            results = model(frame, classes=[0], verbose=False)[0]  # persons only
            dets    = sv.Detections.from_ultralytics(results)
            dets    = tracker.update_with_detections(dets)

            for tid, bbox in zip(dets.tracker_id or [], dets.xyxy):
                if tid is None:
                    continue
                cx = float((bbox[0] + bbox[2]) / 2 / w_total)
                cy = float((bbox[1] + bbox[3]) / 2 / h_total)

                tracks_data.setdefault(int(tid), []).append(
                    {"x": cx, "y": cy, "frame": frame_idx}
                )

                gx = min(int(cx * 10), 9)
                gy = min(int(cy * 10), 9)
                heatmap[gy, gx] += 1

                if cx < 0.33:
                    zone_counts["left_third"] += 1
                elif cx < 0.67:
                    zone_counts["middle_third"] += 1
                else:
                    zone_counts["right_third"] += 1

            frame_idx += 1

        cap.release()

        total = max(sum(zone_counts.values()), 1)
        return {
            "tracks":        [{"id": k, "frames": v} for k, v in tracks_data.items()],
            "zoneOccupancy": {k: round(v / total, 3) for k, v in zone_counts.items()},
            "heatmap":       heatmap.tolist(),
        }
    except Exception as exc:
        return {"tracks": [], "zoneOccupancy": {}, "heatmap": [], "error": str(exc)}


# ── Set piece analysis (ball + players + zones + heatmap) ─────────────────────

_PITCH_ZONES: dict[str, tuple[float, float, float, float]] = {
    "six_yard_box":  (0.35, 0.0,  0.65, 0.12),
    "penalty_area":  (0.15, 0.0,  0.85, 0.28),
    "left_wing":     (0.0,  0.0,  0.15, 1.0),
    "right_wing":    (0.85, 0.0,  1.0,  1.0),
    "midfield":      (0.15, 0.4,  0.85, 0.6),
}

def _analyse_set_piece(video_path: str) -> dict:
    try:
        from ultralytics import YOLO
        import supervision as sv
        import cv2
        import numpy as np

        model   = YOLO("yolov8n.pt")
        tracker = sv.ByteTrack()
        cap     = cv2.VideoCapture(video_path)
        w_total = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h_total = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        heatmap: np.ndarray   = np.zeros((10, 10), dtype=np.float32)
        tracks_data: dict[int, list] = {}
        ball_positions: list[dict]   = []
        zone_counts: dict[str, int]  = {k: 0 for k in _PITCH_ZONES}
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % 2 != 0:
                frame_idx += 1
                continue

            results = model(frame, classes=[0, 32], verbose=False)[0]  # person + ball
            dets    = sv.Detections.from_ultralytics(results)

            ball_mask   = dets.class_id == 32
            person_mask = dets.class_id == 0

            if ball_mask.any():
                bb = dets.xyxy[ball_mask][0]
                ball_positions.append({
                    "x":     float((bb[0] + bb[2]) / 2 / w_total),
                    "y":     float((bb[1] + bb[3]) / 2 / h_total),
                    "frame": frame_idx,
                })

            person_dets = dets[person_mask]
            tracked     = tracker.update_with_detections(person_dets)

            for tid, bbox in zip(tracked.tracker_id or [], tracked.xyxy):
                if tid is None:
                    continue
                cx = float((bbox[0] + bbox[2]) / 2 / w_total)
                cy = float((bbox[1] + bbox[3]) / 2 / h_total)

                tracks_data.setdefault(int(tid), []).append(
                    {"x": cx, "y": cy, "frame": frame_idx}
                )

                gx = min(int(cx * 10), 9)
                gy = min(int(cy * 10), 9)
                heatmap[gy, gx] += 1

                for zone_name, (x0, y0, x1, y1) in _PITCH_ZONES.items():
                    if x0 <= cx <= x1 and y0 <= cy <= y1:
                        zone_counts[zone_name] += 1

            frame_idx += 1

        cap.release()

        total = max(sum(zone_counts.values()), 1)
        return {
            "tracks":        [{"id": k, "frames": v} for k, v in tracks_data.items()],
            "zoneOccupancy": {k: round(v / total, 3) for k, v in zone_counts.items()},
            "heatmap":       heatmap.tolist(),
            "ballPositions": ball_positions,
        }
    except Exception as exc:
        return {
            "tracks":        [],
            "zoneOccupancy": {},
            "heatmap":       [],
            "ballPositions": [],
            "error":         str(exc),
        }


# ── /zones — custom polygon zone counting ────────────────────────────────────

@app.post("/zones")
async def zones_endpoint(video: UploadFile, zones_json: str = Form("[]")):
    """
    zones_json: JSON array of { name: str, polygon: [{x, y}, …] } — all coords normalised 0–1.
    Returns: { counts: { zone_name: int } }
    """
    path           = _save_upload(video)
    custom_zones   = json.loads(zones_json)
    try:
        result = _count_custom_zones(path, custom_zones)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
    return result


def _count_custom_zones(video_path: str, zones: list[dict]) -> dict:
    if not zones:
        return {"counts": {}}
    try:
        from ultralytics import YOLO
        import supervision as sv
        import cv2
        import numpy as np

        model   = YOLO("yolov8n.pt")
        cap     = cv2.VideoCapture(video_path)
        w_total = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h_total = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        sv_zones = [
            sv.PolygonZone(
                polygon=np.array(
                    [[int(p["x"] * w_total), int(p["y"] * h_total)] for p in z["polygon"]]
                )
            )
            for z in zones
        ]
        names       = [z["name"] for z in zones]
        zone_counts = {n: 0 for n in names}
        frame_idx   = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % 5 != 0:
                frame_idx += 1
                continue

            results = model(frame, classes=[0], verbose=False)[0]
            dets    = sv.Detections.from_ultralytics(results)

            for zone_obj, name in zip(sv_zones, names):
                in_zone = zone_obj.trigger(dets)
                zone_counts[name] += int(in_zone.sum())

            frame_idx += 1

        cap.release()
        return {"counts": zone_counts}
    except Exception as exc:
        return {"counts": {}, "error": str(exc)}


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8765,
        reload=True,
        log_level="info",
    )
