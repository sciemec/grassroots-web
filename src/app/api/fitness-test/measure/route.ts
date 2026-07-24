import { NextRequest } from "next/server";

export const maxDuration = 120;
export const runtime = "nodejs";

export interface MeasureResult {
  measured_value: number;
  unit: string;
  confidence: "high" | "medium" | "low";
  notes: string;
}

// ── Gemini Files API helpers ──────────────────────────────────────────────────

async function uploadToGemini(
  videoBytes: ArrayBuffer,
  mimeType: string,
  googleKey: string
): Promise<{ uri: string; name: string }> {
  // Initiate resumable upload
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${googleKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(videoBytes.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: "fitness-test-clip" } }),
    }
  );
  if (!initRes.ok) {
    const t = await initRes.text();
    throw new Error(`Gemini upload init failed: ${initRes.status} — ${t.slice(0, 200)}`);
  }
  const uploadUrl = initRes.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("No upload URL from Gemini Files API");

  // Upload bytes
  const upRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
      "Content-Type": mimeType,
    },
    body: videoBytes,
  });
  if (!upRes.ok) {
    const t = await upRes.text();
    throw new Error(`Gemini upload failed: ${upRes.status} — ${t.slice(0, 200)}`);
  }
  const data = (await upRes.json()) as { file?: { uri?: string; name?: string } };
  const uri = data.file?.uri;
  const name = data.file?.name;
  if (!uri || !name) throw new Error("Gemini upload response missing uri/name");
  return { uri, name };
}

async function waitForFileActive(name: string, googleKey: string): Promise<void> {
  for (let i = 0; i < 24; i++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${name}?key=${googleKey}`
    );
    if (!res.ok) throw new Error(`File state check failed: ${res.status}`);
    const data = (await res.json()) as { state?: string };
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED") throw new Error("Gemini file processing failed");
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Video did not become ready within 2 minutes");
}

// ── Test-specific prompts ─────────────────────────────────────────────────────

const PROMPTS: Record<string, string> = {
  jump: `You are a sports science measurement system analysing a vertical jump test video.

The athlete performs a standing vertical jump (countermovement jump or squat jump).
Your task: estimate the jump HEIGHT in centimetres based on the athlete's flight time or hip displacement.

Method:
- Look for the moment both feet leave the ground and when they return.
- Use the athlete's body height as a scale reference if visible.
- Flight time method: h = ½ × g × (t/2)² where g = 9.81 m/s²
- If using body proportions: estimate hip displacement as a fraction of standing height.

Return ONLY valid JSON, no markdown:
{
  "measured_value": <integer cm, typically 15-80>,
  "unit": "cm",
  "confidence": "<high|medium|low>",
  "notes": "<one sentence: what you observed and how you estimated>"
}

If the jump is not clearly visible, return confidence "low" with measured_value 0 and explain in notes.`,

  sprint: `You are a sports science measurement system analysing a 20-metre sprint test video.

The athlete sprints from a standing start over 20 metres.
Your task: estimate the sprint TIME in seconds.

Method:
- Look for a clearly visible start line or start signal and a finish marker (cone, line, or end of marked distance).
- Count frames if possible, or estimate based on stride count and typical stride rates for grassroots athletes.
- Grassroots reference: Under-13: 3.8–5.5s, Under-17: 3.0–4.5s, Adult: 2.8–4.2s.
- If a distance marker is visible, use the athlete's speed across a known segment.

Return ONLY valid JSON, no markdown:
{
  "measured_value": <decimal seconds to 2dp, typically 2.80-6.00>,
  "unit": "seconds",
  "confidence": "<high|medium|low>",
  "notes": "<one sentence: what you observed and how you estimated>"
}

If the sprint distance or timing cues are not clear, return confidence "low" with measured_value 0 and explain in notes.`,

  juggling: `You are a sports science measurement system counting ball juggling touches in a video.

The athlete juggles a football (soccer ball) using feet, knees, and/or thighs.
Your task: count the total number of successful ball touches (juggles) before the ball hits the ground or the clip ends.

Rules:
- Each time the ball is struck upward = 1 touch.
- A bounce off the ground resets the count (or counts as end if continuous juggling test).
- Count ALL touches in the clip including partial touches that kept the ball airborne.

Return ONLY valid JSON, no markdown:
{
  "measured_value": <integer count of touches>,
  "unit": "touches",
  "confidence": "<high|medium|low>",
  "notes": "<one sentence: e.g. 'Counted 12 clean foot touches and 3 knee touches'>"
}

If the ball is not visible or the clip quality is too poor to count, return confidence "low" with measured_value 0.`,

  reaction: `You are a sports science measurement system analysing a Scanning & Reactive Shuttle test video.

Setup: The athlete stands at a CENTER cone. A LEFT cone is 5m to their left and a RIGHT cone is 5m to their right.
A coach stands 5m ahead of the athlete holding a RED and a BLUE marker.
The camera is placed DIRECTLY BEHIND the athlete at chest height — you will see the athlete's back, the coach ahead, and both side cones.

Your task: measure the REACTION TIME in seconds — from the moment the coach raises a coloured marker to the moment the athlete's foot crosses past the called cone.

Method:
- Find the exact frame when the coach's arm raises the marker visibly upward.
- Find the exact frame when the athlete's leading foot passes the target side cone.
- Count frames between these two events. Use the video frame rate (typically 30fps, 60fps, or 120fps slow-mo).
- If slow-motion: divide the frame count by the actual fps to get real seconds.
- Typical elite range: 1.5–2.5s. Grassroots range: 2.5–4.5s.
- If multiple trials are visible, measure each separately and return the AVERAGE.

Return ONLY valid JSON, no markdown:
{
  "measured_value": <decimal seconds to 2dp, e.g. 2.74>,
  "unit": "seconds",
  "confidence": "<high|medium|low>",
  "notes": "<one sentence: what you observed, frame count or method used, and whether it is a single trial or average>"
}

If the marker raise or cone crossing is not clearly visible, return confidence "low" with measured_value 0 and explain in notes.`,

  agility: `You are a sports science measurement system analysing a 5-10-5 Pro Agility Shuttle test video.

Setup: Three cones in a straight line — Cone A (left end), Cone B (centre, where the athlete starts), Cone C (right end). Each gap is 5m. Total run: 20m with two direction changes.
The camera is placed 8–10m DIRECTLY ACROSS from Cone B, perpendicular to the cone line. All three cones must be visible.

Run pattern: athlete starts at Cone B → sprints to Cone C (5m) → cuts back past Cone A (10m) → sprints back past Cone B (5m, finish).

Your task: measure the TOTAL TIME in seconds from first movement at Cone B to when the athlete crosses back past Cone B at the finish.

Method:
- Find the first frame where the athlete's feet leave their starting stance (movement initiation at Cone B).
- Find the frame where the athlete's body crosses the Cone B line at the finish (they run PAST Cone B to complete the drill).
- Count frames between these two events. Use the video frame rate (30fps standard, 120fps slow-mo, 240fps ultra slow-mo).
- If slow-motion: the frame count ÷ actual fps = real elapsed seconds.
- Typical grassroots range: 4.5–7.0s. Elite youth: 4.0–4.8s.
- If two attempts are visible, measure each and return the BEST (fastest) time.

Return ONLY valid JSON, no markdown:
{
  "measured_value": <decimal seconds to 2dp, e.g. 5.23>,
  "unit": "seconds",
  "confidence": "<high|medium|low>",
  "notes": "<one sentence: frame count used, fps detected, whether single or best-of-two>"
}

If the start or finish at Cone B is not clearly visible in frame, return confidence "low" with measured_value 0 and explain in notes.`,
};

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const googleKey =
      process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const testType = (formData.get("testType") as string | null)?.toLowerCase();
    const videoFile = formData.get("video") as File | null;

    if (!testType || !PROMPTS[testType]) {
      return Response.json(
        { error: "testType must be one of: jump, sprint, juggling, reaction, agility" },
        { status: 400 }
      );
    }
    if (!videoFile) {
      return Response.json({ error: "video file is required" }, { status: 400 });
    }

    const mimeType = videoFile.type || "video/mp4";
    const videoBytes = await videoFile.arrayBuffer();

    // Upload to Gemini Files API
    const { uri, name } = await uploadToGemini(videoBytes, mimeType, googleKey);
    await waitForFileActive(name, googleKey);

    // Call Gemini 2.5 Flash
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPTS[testType] },
                { file_data: { mime_type: mimeType, file_uri: uri } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return Response.json(
        { error: `Gemini error: ${geminiRes.status}`, detail: errText.slice(0, 300) },
        { status: 502 }
      );
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Parse JSON from response
    let result: MeasureResult | null = null;
    try {
      result = JSON.parse(rawText) as MeasureResult;
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]) as MeasureResult;
        } catch { /* fall through */ }
      }
    }

    if (!result || typeof result.measured_value !== "number") {
      return Response.json(
        { error: "Could not parse measurement from video", raw: rawText.slice(0, 300) },
        { status: 502 }
      );
    }

    return Response.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
