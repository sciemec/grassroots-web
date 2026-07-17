// src/lib/engines/yolov8-engine.ts
// YOLOv8-det via ONNX Runtime Web — ball tracking + multi-player counting.
// Requires /public/models/yolov8n.onnx (export with: yolo export model=yolov8n.pt format=onnx)
// Client-side only. Gracefully returns [] if model file is absent.

const MODEL_PATH       = '/models/yolov8n.onnx';
const CONF_THRESHOLD   = 0.45;
const NMS_IOU_THRESHOLD = 0.45;
const INPUT_SIZE       = 640;

// COCO class ids we care about
const CLS_PERSON = 0;
const CLS_BALL   = 32;

export interface YoloDetection {
  class:      number;
  label:      'person' | 'ball' | 'other';
  confidence: number;
  // Bounding box — all values normalised 0–1 (top-left origin)
  bbox: { x: number; y: number; w: number; h: number };
}

// ── Singleton ONNX session ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _session: any    = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _loading: Promise<any> | null = null;
let _modelMissing = false;

async function getSession() {
  if (_modelMissing) return null;
  if (_session)      return _session;
  if (_loading)      return _loading;

  _loading = (async () => {
    try {
      const ort = await import('onnxruntime-web');
      // Use CDN WASM so no bundler config is needed
      ort.env.wasm.wasmPaths =
        'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';

      const sess = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ['webgl', 'wasm'],
      });
      _session = sess;
      return sess;
    } catch {
      _modelMissing = true; // model file not found — skip silently
      return null;
    }
  })();

  return _loading;
}

// ── Preprocessing ─────────────────────────────────────────────────────────────
// Canvas → Float32 [1, 3, 640, 640] CHW tensor, normalised to [0, 1]
function preprocessCanvas(canvas: HTMLCanvasElement): Float32Array {
  const off = document.createElement('canvas');
  off.width  = INPUT_SIZE;
  off.height = INPUT_SIZE;
  off.getContext('2d')!.drawImage(canvas, 0, 0, INPUT_SIZE, INPUT_SIZE);

  const { data } = off.getContext('2d')!.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const n = INPUT_SIZE * INPUT_SIZE;
  const t = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    t[i]         = data[i * 4]     / 255; // R
    t[n + i]     = data[i * 4 + 1] / 255; // G
    t[2 * n + i] = data[i * 4 + 2] / 255; // B
  }
  return t;
}

// ── Non-Maximum Suppression ───────────────────────────────────────────────────
type Box = [number, number, number, number]; // x, y, w, h

function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  const inter = ix * iy;
  const union = a[2] * a[3] + b[2] * b[3] - inter;
  return union > 0 ? inter / union : 0;
}

function nms(boxes: Box[], scores: number[], threshold: number): number[] {
  const order = scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s).map(({ i }) => i);
  const keep  = new Set<number>();
  const used  = new Set<number>();

  for (const i of order) {
    if (used.has(i)) continue;
    keep.add(i);
    for (const j of order) {
      if (!used.has(j) && j !== i && iou(boxes[i], boxes[j]) > threshold) used.add(j);
    }
  }
  return [...keep];
}

// ── Public detection function ─────────────────────────────────────────────────
export async function detectObjects(
  canvas: HTMLCanvasElement,
): Promise<YoloDetection[]> {
  const session = await getSession();
  if (!session) return [];

  try {
    const ort     = await import('onnxruntime-web');
    const input   = preprocessCanvas(canvas);
    const tensor  = new ort.Tensor('float32', input, [1, 3, INPUT_SIZE, INPUT_SIZE]);
    const results = await session.run({ images: tensor });

    // YOLOv8 output name is 'output0', shape [1, 84, 8400]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out  = (results['output0'] as any);
    if (!out) return [];

    const raw       = out.data as Float32Array;
    const nAnchors  = 8400;
    const nClasses  = 80;

    const boxes:   Box[]    = [];
    const scores:  number[] = [];
    const clsIds:  number[] = [];

    for (let a = 0; a < nAnchors; a++) {
      // Layout: [cx, cy, w, h, cls0_score … cls79_score] × 8400
      const cx = raw[0 * nAnchors + a] / INPUT_SIZE;
      const cy = raw[1 * nAnchors + a] / INPUT_SIZE;
      const bw = raw[2 * nAnchors + a] / INPUT_SIZE;
      const bh = raw[3 * nAnchors + a] / INPUT_SIZE;

      let maxScore = 0, maxCls = -1;
      for (let c = 0; c < nClasses; c++) {
        const s = raw[(4 + c) * nAnchors + a];
        if (s > maxScore) { maxScore = s; maxCls = c; }
      }

      if (maxScore < CONF_THRESHOLD) continue;
      if (maxCls !== CLS_PERSON && maxCls !== CLS_BALL) continue;

      boxes.push([cx - bw / 2, cy - bh / 2, bw, bh]);
      scores.push(maxScore);
      clsIds.push(maxCls);
    }

    return nms(boxes, scores, NMS_IOU_THRESHOLD).map((i) => ({
      class:      clsIds[i],
      label:      clsIds[i] === CLS_PERSON ? 'person' : clsIds[i] === CLS_BALL ? 'ball' : 'other',
      confidence: scores[i],
      bbox: { x: boxes[i][0], y: boxes[i][1], w: boxes[i][2], h: boxes[i][3] },
    }));
  } catch {
    return [];
  }
}

/** True once the ONNX session has loaded successfully */
export async function isYoloAvailable(): Promise<boolean> {
  const sess = await getSession();
  return sess !== null;
}
