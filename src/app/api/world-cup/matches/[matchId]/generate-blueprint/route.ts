import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export const maxDuration = 60;

const DRILLS_BY_WEAKNESS: Record<string, { name: string; setup: string; reps: string; coachingPoint: string }[]> = {
  regain: [
    { name: 'Press Trigger Rondos', setup: '8v2 in 12m circle, defenders press on back-pass signal', reps: '3 x 4 min', coachingPoint: 'Press together on the trigger — not individually' },
    { name: 'Counter-Press Shadow', setup: '6v6 on half-pitch, immediate press within 5s of losing ball', reps: '4 x 5 min', coachingPoint: 'Nearest 3 players press; rest hold shape' },
  ],
  build: [
    { name: 'Third-Man Combination', setup: '4 poles in 20x15m grid; A passes to B, B plays C, C drives', reps: '15 reps each side', coachingPoint: 'Move before the ball arrives — create the angle early' },
    { name: 'Switch + Receive Under Pressure', setup: '2 defenders guard central channel; wide player switches play', reps: '3 x 6 min', coachingPoint: 'First touch must open your body to the next pass' },
  ],
  finish: [
    { name: '1v1 GK Finishing', setup: 'Service from wide; striker receives 25m out, 1v1 with keeper', reps: '10 reps each striker', coachingPoint: 'Decide early — slot low or chip. No hesitation.' },
    { name: 'Combination into Shot', setup: 'Wall pass + overlap into crossing zone; 2 strikers attack cross', reps: '3 x 8 min', coachingPoint: 'Near-post movement pulls the defender; back post arrives late' },
  ],
};

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check purchase status
  try {
    const checkRes = await fetch(
      `${apiUrl}/world-cup/blueprints/check?match_id=${params.matchId}`,
      { headers: { Authorization: authHeader } }
    );
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (!checkData.purchased) {
        return NextResponse.json({ error: 'Purchase required' }, { status: 402 });
      }
    }
    // If the check endpoint 404s (not yet deployed), fall through and generate anyway
  } catch {
    // Backend not available — allow generation (dev mode)
  }

  // Fetch tactical report for this match
  let weakPhases: string[] = ['regain', 'build', 'finish'];
  let matchName = 'Match';
  try {
    const reportRes = await fetch(
      `${apiUrl}/world-cup/matches/${params.matchId}/tactical-report`,
      { headers: { Authorization: authHeader } }
    );
    if (reportRes.ok) {
      const reportData = await reportRes.json();
      matchName = reportData.matchName ?? matchName;
      if (reportData.phases) {
        // Sort phases by successRate ascending to find weakest first
        weakPhases = (['regain', 'build', 'finish'] as const)
          .sort((a, b) => (reportData.phases[a]?.successRate ?? 50) - (reportData.phases[b]?.successRate ?? 50));
      }
    }
  } catch {
    // Use default weak phases
  }

  // Build the 5-day microcycle drill list
  const selectedDrills = weakPhases.flatMap(phase => DRILLS_BY_WEAKNESS[phase] ?? []).slice(0, 5);
  while (selectedDrills.length < 5) {
    selectedDrills.push(DRILLS_BY_WEAKNESS.build[0]);
  }

  const dayThemes = [
    'Regaining Possession',
    'Building Through the Lines',
    'Creating & Finishing',
    'Set Pieces & Transitions',
    'Full Match Application',
  ];

  // Generate PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 14;

  // Page 1 — cover
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 55, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GRS COACHING BLUEPRINT', margin, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('5-Day Training Microcycle', margin, 28);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(matchName, margin, 38);
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255, 0.7);
  doc.text('GrassRoots Sports · grassrootssports.live', margin, 49);

  // Phase summary box
  let y = 68;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 92, 42);
  doc.text('Tactical Weaknesses Addressed', margin, y);
  y += 7;
  weakPhases.forEach((phase, i) => {
    const label = phase === 'regain' ? 'Regaining Possession' : phase === 'build' ? 'Building the Attack' : 'Finishing';
    doc.setFillColor(240, 247, 242);
    doc.roundedRect(margin, y, W - margin * 2, 9, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`${i + 1}. ${label}`, margin + 4, y + 6);
    y += 12;
  });

  // Page 2 — 5-day plan table
  doc.addPage();
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('5-Day Training Plan', margin, 9.5);

  y = 22;
  dayThemes.forEach((theme, i) => {
    doc.setFillColor(26, 92, 42);
    doc.roundedRect(margin, y, W - margin * 2, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Day ${i + 1} — ${theme}`, margin + 3, y + 4.8);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    const drill = selectedDrills[i];
    if (drill) {
      doc.text(`• ${drill.name} · ${drill.reps}`, margin + 3, y);
      y += 5;
      doc.text(`  Setup: ${drill.setup}`, margin + 3, y);
      y += 5;
    }
    y += 4;
  });

  // Page 3 — drill cards
  doc.addPage();
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Drill Cards', margin, 9.5);

  let drillY = 22;
  selectedDrills.forEach((drill, i) => {
    if (drillY > H - 55) { doc.addPage(); drillY = 14; }
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, drillY, W - margin * 2, 40, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 92, 42);
    doc.text(`DRILL ${i + 1}: ${drill.name}`, margin + 4, drillY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`Setup: ${drill.setup}`, margin + 4, drillY + 16);
    doc.text(`Reps: ${drill.reps}`, margin + 4, drillY + 23);
    doc.text(`Coaching Point: ${drill.coachingPoint}`, margin + 4, drillY + 30);
    drillY += 44;
  });

  // Footer
  doc.setFillColor(26, 92, 42);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("GrassRoots Sports · grassrootssports.live · Zimbabwe's First AI Sports Platform", W / 2, H - 6, { align: 'center' });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="GRS-Blueprint-${params.matchId}.pdf"`,
    },
  });
}
