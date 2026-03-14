"use client";

/** File System Access API hook for picking local video files */
export function useFileSystem() {
  const isSupported = typeof window !== "undefined" && "showOpenFilePicker" in window;

  /** Open a file picker for video files. Returns the selected File or null. */
  const pickVideoFile = async (): Promise<File | null> => {
    if (!isSupported) return null;
    try {
      const [handle] = await (window as unknown as { showOpenFilePicker: (opts: object) => Promise<FileSystemFileHandle[]> })
        .showOpenFilePicker({
          types: [
            {
              description: "Video files",
              accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
            },
          ],
          multiple: false,
        });
      return handle.getFile();
    } catch {
      // User cancelled or browser denied — not an error
      return null;
    }
  };

  /** Open a file picker for multiple video files */
  const pickMultipleVideoFiles = async (): Promise<File[]> => {
    if (!isSupported) return [];
    try {
      const handles = await (window as unknown as { showOpenFilePicker: (opts: object) => Promise<FileSystemFileHandle[]> })
        .showOpenFilePicker({
          types: [
            {
              description: "Video files",
              accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
            },
          ],
          multiple: true,
        });
      return Promise.all(handles.map((h) => h.getFile()));
    } catch {
      return [];
    }
  };

  return { isSupported, pickVideoFile, pickMultipleVideoFiles };
}
