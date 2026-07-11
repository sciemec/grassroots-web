export async function POST() {
  return Response.json(
    { error: "Push notifications not configured" },
    { status: 503 }
  );
}
