import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // In production, fetch lessons for this module from database
  const lessons = [
    {
      id: 'lesson-1',
      moduleId: params.id,
      title: 'Introduction: Transition Football',
      duration: '10 min',
      content: 'Learn the fundamentals of transition play.',
      keyPoints: ['Key point 1', 'Key point 2'],
      quizQuestions: [],
      order: 1,
    },
    // ... more lessons
  ];

  return NextResponse.json({ lessons });
}