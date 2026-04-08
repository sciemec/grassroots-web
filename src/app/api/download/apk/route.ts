import { NextResponse } from "next/server";

// APK download tracker + redirect
// Set NEXT_PUBLIC_APK_URL in Vercel to your R2 or Google Drive direct-download link.
// Google Drive format: https://drive.google.com/uc?export=download&id=YOUR_FILE_ID
// R2 format:           https://pub-xxxx.r2.dev/grassroots-sports.apk

const APK_URL =
  process.env.NEXT_PUBLIC_APK_URL ||
  "https://drive.google.com/uc?export=download&id=REPLACE_WITH_YOUR_FILE_ID";

export async function GET() {
  // TODO: log download count to DB when backend endpoint exists
  // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/downloads/apk`, { method: "POST" }).catch(() => {});

  return NextResponse.redirect(APK_URL, { status: 302 });
}
