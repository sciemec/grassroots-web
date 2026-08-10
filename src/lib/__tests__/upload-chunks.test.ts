/**
 * Unit tests for assertValidChunkSize — Google resumable upload chunk granularity guard.
 *
 * Google requires non-final chunks to be exact multiples of 8,388,608 bytes (8 MiB).
 * Final chunks may be any size.
 *
 * Run: npx jest src/lib/__tests__/upload-chunks.test.ts
 */

import { assertValidChunkSize } from "../upload-chunks";

const GRANULARITY = 8_388_608; // 8 MiB

describe("assertValidChunkSize", () => {
  // ── Invalid non-final chunk sizes ─────────────────────────────────────────

  test("throws for 25 MB (former LARGE_CHUNK_BYTES — the original bug)", () => {
    const bytes = 25 * 1024 * 1024; // 26,214,400 — not a multiple
    expect(() => assertValidChunkSize(bytes, false)).toThrow(
      /not a multiple of 8388608/i,
    );
  });

  test("throws for 5 MB", () => {
    const bytes = 5 * 1024 * 1024; // 5,242,880
    expect(() => assertValidChunkSize(bytes, false)).toThrow(
      /not a multiple of 8388608/i,
    );
  });

  test("throws for 10 MB", () => {
    const bytes = 10 * 1024 * 1024; // 10,485,760
    expect(() => assertValidChunkSize(bytes, false)).toThrow(
      /not a multiple of 8388608/i,
    );
  });

  test("throws for 4 MB (former 2G chunk size — also invalid)", () => {
    const bytes = 4 * 1024 * 1024; // 4,194,304
    expect(() => assertValidChunkSize(bytes, false)).toThrow(
      /not a multiple of 8388608/i,
    );
  });

  test("throws for 1 byte", () => {
    expect(() => assertValidChunkSize(1, false)).toThrow(
      /not a multiple of 8388608/i,
    );
  });

  test("throws for 0 bytes (non-final)", () => {
    expect(() => assertValidChunkSize(0, false)).toThrow(
      /not a multiple of 8388608/i,
    );
  });

  // ── Valid non-final chunk sizes ────────────────────────────────────────────

  test("passes for 8 MB (1 × granularity — mobile default)", () => {
    expect(() => assertValidChunkSize(GRANULARITY, false)).not.toThrow();
  });

  test("passes for 16 MB (2 × granularity)", () => {
    expect(() => assertValidChunkSize(2 * GRANULARITY, false)).not.toThrow();
  });

  test("passes for 24 MB (3 × granularity — new desktop LARGE_CHUNK_BYTES)", () => {
    expect(() => assertValidChunkSize(3 * GRANULARITY, false)).not.toThrow();
  });

  test("passes for 32 MB (4 × granularity)", () => {
    expect(() => assertValidChunkSize(4 * GRANULARITY, false)).not.toThrow();
  });

  // ── Final chunk: any size is allowed ──────────────────────────────────────

  test("passes for a small final chunk (e.g. 1,234 bytes)", () => {
    expect(() => assertValidChunkSize(1_234, true)).not.toThrow();
  });

  test("passes for a 25 MB final chunk (Google accepts any size for the last chunk)", () => {
    const bytes = 25 * 1024 * 1024;
    expect(() => assertValidChunkSize(bytes, true)).not.toThrow();
  });

  test("passes for a 1-byte final chunk", () => {
    expect(() => assertValidChunkSize(1, true)).not.toThrow();
  });

  test("passes for a 0-byte final chunk", () => {
    expect(() => assertValidChunkSize(0, true)).not.toThrow();
  });

  // ── Error message quality ──────────────────────────────────────────────────

  test("error message includes the bad byte count", () => {
    const badSize = 26_214_400; // 25 MB
    let message = "";
    try {
      assertValidChunkSize(badSize, false);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("26214400");
  });

  test("error message includes valid example sizes", () => {
    let message = "";
    try {
      assertValidChunkSize(5 * 1024 * 1024, false);
    } catch (e) {
      message = (e as Error).message;
    }
    // Should mention 8 MB (one valid example)
    expect(message).toContain(String(GRANULARITY));
  });
});
