declare module '@mediapipe/tasks-vision' {
  export const FilesetResolver: {
    forVisionTasks(wasmPath: string): Promise<unknown>;
  };
  export const HolisticLandmarker: {
    createFromOptions(vision: unknown, options: unknown): Promise<{
      detectForVideo(video: HTMLVideoElement, timestamp: number): Promise<{
        landmarks?: unknown[][];
        faceLandmarks?: unknown[][];
        leftHandLandmarks?: unknown[][];
        rightHandLandmarks?: unknown[][];
      }>;
      close(): void;
    }>;
  };
  export const PoseLandmarker: {
    createFromOptions(vision: unknown, options: unknown): Promise<unknown>;
  };
}
