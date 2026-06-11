
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Read your uploaded JSON files
    const drillFiles = [
      "session_programmes.json",
      "press_and_cover_to_defend.json",
      "marking_and_intercepting_to_defend_session_programme.json"
    ];
    
    const allDrills = [];
    
    for (const file of drillFiles) {
      const filePath = path.join(process.cwd(), "uploads", file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);
      
      // Transform your JSON structure into our Drill interface
      const drills = data.sessions || data.drills || [];
      allDrills.push(...drills.map((drill: any) => ({
        id: drill.id || Math.random().toString(),
        title: drill.name || drill.title,
        category: drill.category || drill.type,
        difficulty: drill.level || "intermediate",
        coachingPoints: drill.coachingPoints || drill.keyPoints || [],
        duration: drill.duration || 45
      })));
    }
    
    return NextResponse.json(allDrills);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load drills" }, { status: 500 });
  }
}