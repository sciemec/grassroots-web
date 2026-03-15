export function extractApiError(
  e: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const data = (
    e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
  )?.response?.data;
  console.error("[API error]", e);
  return data?.errors
    ? Object.values(data.errors).flat().join(". ")
    : (data?.message ?? fallback);
}
