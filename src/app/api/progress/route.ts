
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROGRESS_FILE = path.join(process.cwd(), "player-progress.json");

// Helper to read/write progress
function getProgressStore() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({}));
  }
  const data = fs.readFileSync(PROGRESS_FILE, "utf-8");
  return JSON.parse(data);
}

function saveProgressStore(store: any) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(store, null, 2));
}

export async function GET(req: NextRequest) {
  try {
    const email = req.headers.get("x-user-email") || "default_user";
    const store = getProgressStore();
    
    return NextResponse.json({
      drills: store[email]?.drills || [],
      position: store[email]?.position || "striker",
      totalCompleted: store[email]?.drills?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = req.headers.get("x-user-email") || "default_user";
    const body = await req.json();
    const { drills, position } = body;
    
    const store = getProgressStore();
    store[email] = {
      drills: drills,
      position: position,
      lastUpdated: new Date().toISOString()
    };
    saveProgressStore(store);
    
    return NextResponse.json({ success: true, totalCompleted: drills.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}