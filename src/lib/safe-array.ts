/**
 * safeArray — safely extract an array from a Laravel API response.
 *
 * Laravel can return data in three shapes:
 *   1. Direct array:          res.data = [...]
 *   2. Paginated:             res.data = { data: [...], total, per_page, ... }
 *   3. Wrapped:               res.data = { data: { data: [...], ... } }
 *
 * The naive pattern `res.data?.data ?? res.data ?? []` is unsafe because when
 * res.data is a truthy pagination object and res.data.data is null/undefined,
 * the expression evaluates to the object itself — causing `.map()` / `.filter()`
 * to throw "t.map is not a function".
 *
 * Usage:
 *   import { safeArray } from "@/lib/safe-array";
 *   setSessions(safeArray(res.data));
 */
export function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data !== null && typeof data === "object") {
    const inner = (data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}
