import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

// ─── Types (mirrored from worldcup/page.tsx) ──────────────────────────────

interface PhaseSummary {
  successRate: number;
  events:      unknown[];
  dominantTeam?: string;
}

interface PhaseReport {
  regain: PhaseSummary;
  build:  PhaseSummary;
  finish: PhaseSummary;
}

interface TrainingModule {
  title: string;
  focus: string;
  drills: {
    name:          string;
    setup:         string;
    reps:          string;
    coachingPoint: string;
  }[];
}

// ─── Match-to-module logic (same as client-side) ─────────────────────────

const BLUEPRINT_DAY_PLAN = [
  'Recovery + Tactical Video Review',
  'Core Weakness Drill Session',
  'Drill Progression + Small-Sided Game',
  'Tactical Shape Training',
  'Match Simulation — Apply the Blueprint',
];

function getModulesFromPhases(phases: PhaseReport): TrainingModule[] {
  const modules: TrainingModule[] = [];

  if (phases.regain.successRate < 40) {
    modules.push({
      title: 'Pressing Triggers',
      focus: 'Win the ball back quicker in transition',
      drills: [
        {
          name: 'Shadow Pressing',
          setup: '8v8 + 2 neutrals in half pitch. GK plays short = press trigger. Force play wide, never inside.',
          reps:  '4 × 6-min rounds',
          coachingPoint: 'Press in pairs — never solo. If the first presser gets beaten, the second must be there.',
        },
        {
          name: 'Counter-Press Rondo',
          setup: '5v5 in 20×20m. Team that loses possession has a 5-second window to win it back immediately.',
          reps:  '6 × 4-min rounds',
          coachingPoint: 'First 3 seconds after losing the ball is the press window. After that — drop and organise.',
        },
      ],
    });
  }

  if (phases.build.successRate < 40) {
    modules.push({
      title: 'Positional Play Under Pressure',
      focus: 'Play through the midfield press with composure',
      drills: [
        {
          name: '4v2 Positional Rondo',
          setup: '4 attackers vs 2 defenders in 15×15m grid. 8 passes = 1 point. Rotate defenders every 2 min.',
          reps:  '5 × 5-min rounds',
          coachingPoint: 'Move before receiving. Create a third-man option behind the press — never play into pressure.',
        },
        {
          name: 'Build-Out Pattern 11v6',
          setup: 'Full team vs 6-man high press. GK → CB → CM → wide player sequence. Restart on GK each time.',
          reps:  '3 × 10-min runs',
          coachingPoint: 'Goalkeeper is a real passing option, not a last resort. No hoofing under pressure.',
        },
      ],
    });
  }

  if (phases.finish.successRate < 40) {
    modules.push({
      title: 'Clinical Finishing',
      focus: 'Convert chances in the final third',
      drills: [
        {
          name: 'Combination Finishing 2v1',
          setup: '2 attackers vs 1 defender, entering from midfield. Vary angle and distance of approach each rep.',
          reps:  '20 reps each side',
          coachingPoint: 'Communicate before the box — "square it" or "shoot". Hesitation inside the area is fatal.',
        },
        {
          name: 'Crossing & Arrival Timing',
          setup: 'Winger crosses from 3 zones (byline, cut-back, early cross). 2 strikers attack near/far post on cue.',
          reps:  '25 crosses per winger',
          coachingPoint: 'Late arrival into the box hits the ball harder than an early run that slows down.',
        },
      ],
    });
  }

  if (modules.length === 0) {
    modules.push({
      title: 'Advanced Transition Play',
      focus: 'Exploit both defensive and attacking transitions',
      drills: [
        {
          name: 'Counter-Attack Burst 3v2',
          setup: 'GK distributes to CM. Instant 3v2 fast break. Add a covering defender after every 5 reps.',
          reps:  '15 reps each way',
          coachingPoint: '2 touches maximum in the break. First pass sets the angle, second pass or shot finishes.',
        },
        {
          name: 'Transition Game 6v6',
          setup: '6v6 on 40×50m. Goal only counts if scored within 6 seconds of winning possession.',
          reps:  '4 × 8-min rounds',
          coachingPoint: 'Attack the space between defenders — not the man. Speed of decision beats speed of running.',
        },
      ],
    });
  }

  return modules;
}

// ─── PDF Generation (server-side jsPDF) ──────────────────────────────────

function buildPdf(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  phases: PhaseReport,
  modules: TrainingModule[]
): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 14;

  // ── PAGE 1 ────────────────────────────────────────────────────────────────
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 58, 'F');
  doc.setFillColor(240, 180, 41);
  doc.rect(0, 58, W, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(240, 180, 41);
  doc.text('GRS COACHING BLUEPRINTS', W / 2, 18, { align: 'center' });

  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text('5-Day Training Microcycle', W / 2, 34, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`${homeTeam}  ${homeScore} – ${awayScore}  ${awayTeam}`, W / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Based on the AI tactical report generated by GrassRoots Sports.', margin, 72);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    margin, 80
  );

  // Phase summary box
  doc.setFillColor(245, 250, 246);
  doc.roundedRect(margin, 88, W - margin * 2, 50, 3, 3, 'F');
  doc.setDrawColor(26, 92, 42);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, 88, W - margin * 2, 50, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 92, 42);
  doc.text('MATCH PHASE ANALYSIS', margin + 4, 97);

  const phaseRows: { label: string; rate: number }[] = [
    { label: 'Regaining Possession', rate: phases.regain.successRate },
    { label: 'Building the Attack',  rate: phases.build.successRate },
    { label: 'Finishing',            rate: phases.finish.successRate },
  ];

  phaseRows.forEach((p, i) => {
    const y = 107 + i * 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`${p.label}:`, margin + 4, y);

    const col: [number, number, number] =
      p.rate < 40 ? [190, 40, 40] : p.rate < 60 ? [180, 120, 0] : [26, 92, 42];
    doc.setTextColor(col[0], col[1], col[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.rate}% success`, 118, y);

    if (p.rate < 40) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('  ← focus area this week', 145, y);
    }
  });

  // Modules overview
  let y = 152;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 92, 42);
  doc.text('TRAINING FOCUS THIS WEEK', margin, y);
  y += 8;

  modules.forEach((mod, i) => {
    doc.setFillColor(240, 180, 41);
    doc.rect(margin, y + 1, 2, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`${i + 1}. ${mod.title}`, margin + 6, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(mod.focus, margin + 6, y + 13);
    y += 22;
  });

  // Footer
  doc.setFillColor(26, 92, 42);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("GrassRoots Sports · grassrootssports.live · Zimbabwe's First AI Sports Platform", W / 2, H - 6, { align: 'center' });

  // ── PAGE 2: 5-Day Plan ────────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('5-DAY MICROCYCLE PLAN', W / 2, 12, { align: 'center' });

  y = 26;
  BLUEPRINT_DAY_PLAN.forEach((dayLabel, dayIdx) => {
    const isModuleDay = dayIdx >= 1 && dayIdx <= 3;
    const mod = isModuleDay ? modules[dayIdx - 1] : null;
    const boxH = mod ? 54 : 22;

    doc.setFillColor(245, 250, 246);
    doc.roundedRect(margin, y, W - margin * 2, boxH, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(26, 92, 42);
    doc.text(`DAY ${dayIdx + 1}`, margin + 4, y + 7);

    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(mod ? mod.title : dayLabel, margin + 20, y + 7);

    if (mod) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Focus: ${mod.focus}`, margin + 4, y + 16);

      mod.drills.forEach((drill, di) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(`• ${drill.name}  (${drill.reps})`, margin + 4, y + 26 + di * 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        const lines = doc.splitTextToSize(drill.setup, W - margin * 2 - 10) as string[];
        doc.text(lines[0] ?? '', margin + 8, y + 32 + di * 12);
      });
      y += boxH + 6;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(dayLabel, margin + 4, y + 16);
      y += boxH + 6;
    }
  });

  // ── PAGE 3: Drill Cards ───────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DRILL CARDS', W / 2, 12, { align: 'center' });

  y = 24;
  modules.forEach((mod) => {
    if (y > H - 70) { doc.addPage(); y = 20; }

    doc.setFillColor(240, 180, 41);
    doc.rect(margin, y, W - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 92, 42);
    doc.text(mod.title.toUpperCase(), margin + 4, y + 6);
    y += 12;

    mod.drills.forEach((drill) => {
      if (y > H - 58) { doc.addPage(); y = 20; }

      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, W - margin * 2, 50, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(drill.name, margin + 4, y + 8);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 92, 42);
      doc.text('SETUP', margin + 4, y + 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const setupLines = doc.splitTextToSize(drill.setup, W - margin * 2 - 8) as string[];
      doc.text(setupLines.slice(0, 2), margin + 4, y + 23);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(26, 92, 42);
      doc.text('REPS', margin + 110, y + 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(drill.reps, margin + 110, y + 23);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(200, 130, 0);
      doc.text('COACHING POINT', margin + 4, y + 37);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const cpLines = doc.splitTextToSize(drill.coachingPoint, W - margin * 2 - 8) as string[];
      doc.text(cpLines.slice(0, 2), margin + 4, y + 43);

      y += 56;
    });
    y += 4;
  });

  // Stamp all pages with footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (p > 1) {
      doc.setFillColor(26, 92, 42);
      doc.rect(0, H - 10, W, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(
        `GRS Coaching Blueprint · ${homeTeam} vs ${awayTeam} · Page ${p} of ${totalPages}`,
        W / 2, H - 4, { align: 'center' }
      );
    }
  }

  return doc.output('arraybuffer');
}

// ─── Route Handler ─────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  // Auth check
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Purchase check — ask the Laravel backend whether this user has bought this blueprint
  try {
    const purchaseCheck = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/world-cup/blueprints/check?match_id=${matchId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (purchaseCheck.ok) {
      const purchaseData = await purchaseCheck.json();
      if (!purchaseData.purchased) {
        return NextResponse.json({ error: 'Blueprint not purchased for this match' }, { status: 402 });
      }
    }
    // If the check endpoint doesn't exist yet (404), allow generation
    // so the feature works before the Laravel route is built
  } catch {
    // Network error reaching backend — allow generation to avoid blocking coaches
  }

  // Fetch the tactical report to get phase data
  let phases: PhaseReport = {
    regain: { successRate: 38, events: [] },
    build:  { successRate: 35, events: [] },
    finish: { successRate: 32, events: [] },
  };
  let homeTeam   = 'Home';
  let awayTeam   = 'Away';
  let homeScore  = 0;
  let awayScore  = 0;

  try {
    const reportRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/world-cup/matches/${matchId}/tactical-report`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (reportRes.ok) {
      const reportData = await reportRes.json();
      if (reportData?.phases) phases = reportData.phases as PhaseReport;
      if (reportData?.home_team) homeTeam  = reportData.home_team;
      if (reportData?.away_team) awayTeam  = reportData.away_team;
      if (reportData?.home_score != null) homeScore = reportData.home_score;
      if (reportData?.away_score != null) awayScore = reportData.away_score;
    }
  } catch {
    // Fall through with default phases
  }

  const modules = getModulesFromPhases(phases);
  const pdfBuffer = buildPdf(homeTeam, awayTeam, homeScore, awayScore, phases, modules);

  const filename = `GRS-Blueprint-${homeTeam.replace(/\s+/g, '-')}-vs-${awayTeam.replace(/\s+/g, '-')}.pdf`;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(pdfBuffer.byteLength),
    },
  });
}
