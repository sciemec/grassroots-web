// src/lib/generate-analysis-pdf.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared PDF generation utility for GrassRoots Sports AI analysis reports.
// Uses jsPDF (already in package.json). Call only from client components.
//
// Exports:
//   downloadGeneralAnalysisPdf(analysis)           — General Football Analysis
//   downloadPlayerMatchEyePdf(analysis, narrative)  — Player Match Eye
//   downloadDrillResultPdf(result, drill)            — Gemini Drill Analysis
// ─────────────────────────────────────────────────────────────────────────────

import jsPDF from 'jspdf';
import type { DrillResult, GeminiDrill } from '@/config/gemini-drills';

// ── Brand colours [R, G, B] ──────────────────────────────────────────────────
const GRS_GREEN  = [26,  92,  42]  as const;
const GRS_GOLD   = [200, 150, 42]  as const;
const WHITE      = [255, 255, 255] as const;
const DARK       = [17,  24,  39]  as const;
const MID        = [55,  65,  81]  as const;
const MUTED      = [107, 114, 128] as const;
const LT_GREEN   = [240, 253, 244] as const;
const GREEN_TEXT = [22,  101, 52]  as const;
const AMBER_TEXT = [146, 64,  14]  as const;
const BLUE_BG    = [240, 249, 255] as const;
const BLUE_TEXT  = [3,   105, 161] as const;

// ── Layout ───────────────────────────────────────────────────────────────────
const PW = 210;           // A4 width  (mm)
const PH = 297;           // A4 height (mm)
const ML = 14;            // left margin
const UW = PW - ML - 14;  // usable width
const LH = 3.8;           // line height (mm) for body text

// ── Score colours ────────────────────────────────────────────────────────────
function scoreRgb(score: number): readonly [number, number, number] {
  if (score === 0) return MUTED;
  if (score >= 8)  return [22, 163, 74];
  if (score >= 6)  return GRS_GOLD;
  if (score >= 4)  return [234, 88, 12];
  return [220, 38, 38];
}

// ── Page header ──────────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, reportType: string, date: string): void {
  doc.setFillColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.rect(0, 0, PW, 22, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text('GRASSROOTS SPORTS', ML, 9);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Analysis Report', ML, 15);

  doc.setFontSize(7.5);
  doc.text(date, PW - 14, 9,  { align: 'right' });
  doc.text(reportType, PW - 14, 15, { align: 'right' });
}

// ── Page footer (applied to every page at the end) ───────────────────────────
function drawFooter(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(210, 210, 210);
    doc.line(ML, PH - 12, PW - 14, PH - 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('Produced by GrassRoots Sports · grassrootssports.live · Confidential', ML, PH - 7);
    doc.text(`Page ${i} of ${pages}`, PW - 14, PH - 7, { align: 'right' });
  }
}

// ── Score circle ─────────────────────────────────────────────────────────────
function drawScore(doc: jsPDF, score: number, cx: number, cy: number, r: number): void {
  const rgb = scoreRgb(score);
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.circle(cx, cy, r, 'F');
  doc.setFontSize(score >= 10 ? 12 : 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text(score === 0 ? '?' : String(score), cx, cy + 2, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('/10', cx, cy + r + 4.5, { align: 'center' });
}

// ── Section label + rule ─────────────────────────────────────────────────────
function sectionLabel(doc: jsPDF, label: string, y: number): number {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.text(label.toUpperCase(), ML, y);
  doc.setDrawColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.line(ML, y + 1.5, ML + UW, y + 1.5);
  return y + 6;
}

// ── Wrapped text block ───────────────────────────────────────────────────────
function addText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  size: number,
  style: 'normal' | 'bold' | 'italic' = 'normal',
  color: readonly [number, number, number] = MID,
): number {
  doc.setFontSize(size);
  doc.setFont('helvetica', style);
  doc.setTextColor(color[0], color[1], color[2]);
  const lines = doc.splitTextToSize(text, maxW) as string[];
  lines.forEach((line, i) => doc.text(line, x, y + i * LH));
  return y + lines.length * LH;
}

// ── Bullet list ──────────────────────────────────────────────────────────────
function bulletList(
  doc: jsPDF,
  items: string[],
  x: number,
  y: number,
  maxW: number,
  textColor: readonly [number, number, number] = MID,
  bulletColor: readonly [number, number, number] = GRS_GREEN,
): number {
  let cy = y;
  for (const item of items) {
    doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
    doc.circle(x + 1.2, cy - 0.6, 0.9, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const lines = doc.splitTextToSize(item, maxW - 5) as string[];
    lines.forEach((line, i) => doc.text(line, x + 4.5, cy + i * LH));
    cy += lines.length * LH + 1.5;
  }
  return cy;
}

// ── Overflow guard: add page + header if needed ──────────────────────────────
function checkPage(
  doc: jsPDF,
  y: number,
  needed: number,
  reportType: string,
  date: string,
): number {
  if (y + needed > PH - 20) {
    doc.addPage();
    drawHeader(doc, reportType, date);
    return 30;
  }
  return y;
}

// ════════════════════════════════════════════════════════════════════════════
// 1.  GENERAL FOOTBALL ANALYSIS
// ════════════════════════════════════════════════════════════════════════════

export interface GeneralAnalysis {
  video_type: string;
  context_summary: string;
  participants: { estimated_count: number; age_group: string; level: string };
  key_observations: string[];
  strengths: string[];
  improvements: string[];
  tactical_note: string | null;
  standout_moment: string | null;
  coaching_priority: string;
  drill_recommendation: string;
  overall_score: number;
  score_rationale: string;
}

const VIDEO_TYPE_LABELS: Record<string, string> = {
  match:               'Full Match',
  training_drill:      'Training Drill',
  skill_practice:      'Skill Practice',
  small_sided_game:    'Small-Sided Game',
  street_football:     'Street Football',
  goalkeeper_training: 'Goalkeeper Training',
  fitness_session:     'Fitness Session',
  other:               'Football Footage',
};

export function downloadGeneralAnalysisPdf(analysis: GeneralAnalysis): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const type = 'General Football Analysis';

  drawHeader(doc, type, date);
  let y = 30;

  // ── Type badge + score circle ─────────────────────────────────────────────
  const typeLabel = VIDEO_TYPE_LABELS[analysis.video_type] ?? analysis.video_type;
  drawScore(doc, analysis.overall_score, PW - 14 - 12, y + 12, 10);

  doc.setFillColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.roundedRect(ML, y, 42, 6.5, 1.5, 1.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text(typeLabel, ML + 3, y + 4.5);

  y += 10;
  y = addText(doc, analysis.context_summary, ML, y, UW - 28, 9, 'normal', MID);
  y += 2;
  y = addText(doc, analysis.score_rationale, ML, y, UW - 28, 8, 'italic', MUTED);
  y += 8;

  // ── Participants row ──────────────────────────────────────────────────────
  y = checkPage(doc, y, 12, type, date);
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(ML, y, UW, 8, 2, 2, 'F');
  const partText = [
    `${analysis.participants.estimated_count} player${analysis.participants.estimated_count !== 1 ? 's' : ''} visible`,
    analysis.participants.age_group.replace(/_/g, ' '),
    analysis.participants.level,
  ].join('   ·   ');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MID[0], MID[1], MID[2]);
  doc.text(partText, ML + 4, y + 5.2);
  y += 13;

  // ── Key observations ──────────────────────────────────────────────────────
  y = checkPage(doc, y, 16, type, date);
  y = sectionLabel(doc, 'Key Observations', y);

  for (let i = 0; i < analysis.key_observations.length; i++) {
    const lines = doc.splitTextToSize(analysis.key_observations[i], UW - 9) as string[];
    y = checkPage(doc, y, lines.length * LH + 4, type, date);

    doc.setFillColor(219, 234, 254);
    doc.circle(ML + 2.5, y - 0.8, 2.8, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(String(i + 1), ML + 2.5, y + 0.5, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MID[0], MID[1], MID[2]);
    lines.forEach((line, li) => doc.text(line, ML + 8, y + li * LH));
    y += lines.length * LH + 3;
  }
  y += 3;

  // ── Strengths + Improvements (2-col) ─────────────────────────────────────
  y = checkPage(doc, y, 24, type, date);
  const colW = (UW - 4) / 2;
  const col2 = ML + colW + 4;

  y = sectionLabel(doc, 'Strengths', y);
  const baseY = y;

  // Strengths column
  const strBottom = bulletList(doc, analysis.strengths, ML, baseY, colW, GREEN_TEXT, [22, 163, 74]);

  // Improvements label (manual — can't call sectionLabel at same y level)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('IMPROVEMENTS', col2, baseY - 4.5);
  doc.setDrawColor(200, 130, 20);
  doc.line(col2, baseY - 3, col2 + colW, baseY - 3);
  const impBottom = bulletList(doc, analysis.improvements, col2, baseY, colW, AMBER_TEXT, [234, 88, 12]);

  y = Math.max(strBottom, impBottom) + 6;

  // ── Standout moment ───────────────────────────────────────────────────────
  if (analysis.standout_moment) {
    y = checkPage(doc, y, 14, type, date);
    y = sectionLabel(doc, 'Standout Moment', y);
    y = addText(doc, `\u2605  ${analysis.standout_moment}`, ML, y, UW, 8.5, 'normal', MID);
    y += 5;
  }

  // ── Tactical note ─────────────────────────────────────────────────────────
  if (analysis.tactical_note) {
    y = checkPage(doc, y, 14, type, date);
    y = sectionLabel(doc, 'Tactical Pattern', y);
    y = addText(doc, analysis.tactical_note, ML, y, UW, 8.5, 'normal', MID);
    y += 5;
  }

  // ── Coaching priority + drill (dark green box) ────────────────────────────
  const cpLines   = doc.splitTextToSize(analysis.coaching_priority,    UW - 10) as string[];
  const drLines   = doc.splitTextToSize(analysis.drill_recommendation, UW - 10) as string[];
  const boxH      = 8 + cpLines.length * LH + 7 + drLines.length * LH + 6;

  y = checkPage(doc, y, boxH + 4, type, date);
  doc.setFillColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.roundedRect(ML, y, UW, boxH, 3, 3, 'F');

  let bY = y + 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text('COACHING PRIORITY', ML + 4, bY);
  bY += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  cpLines.forEach((line, i) => doc.text(line, ML + 4, bY + i * LH));
  bY += cpLines.length * LH + 5;

  doc.setDrawColor(255, 255, 255);
  doc.line(ML + 4, bY - 1, ML + UW - 4, bY - 1);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RECOMMENDED DRILL', ML + 4, bY + 3);
  bY += 7;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  drLines.forEach((line, i) => doc.text(line, ML + 4, bY + i * LH));

  drawFooter(doc);
  doc.save(`grassroots-general-analysis-${date.replace(/ /g, '-')}.pdf`);
}

// ════════════════════════════════════════════════════════════════════════════
// 2.  PLAYER MATCH EYE
// ════════════════════════════════════════════════════════════════════════════

export interface PlayerAnalysis {
  overall_rating: number;
  performance_summary: string;
  key_moments?: Array<{ time: string; type: 'strength' | 'weakness' | 'neutral'; description: string }>;
  technical_strengths?: string[];
  areas_to_improve?: string[];
  positioning_analysis?: string;
  physical_assessment?: string;
  tactical_understanding?: string;
  drill_recommendations?: Array<{ drill: string; why: string; frequency: string }>;
  scout_note?: string;
}

export function downloadPlayerMatchEyePdf(
  analysis: PlayerAnalysis,
  narrative: string,
  sport = 'Football',
): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const type = `Match Eye — ${sport}`;

  drawHeader(doc, type, date);
  let y = 30;

  // ── Rating + summary ──────────────────────────────────────────────────────
  const rating = Math.min(10, Math.max(1, Math.round(analysis.overall_rating)));
  drawScore(doc, rating, PW - 14 - 12, y + 12, 10);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('PERFORMANCE RATING', ML, y + 2);
  y += 6;
  y = addText(doc, analysis.performance_summary, ML, y, UW - 28, 9, 'normal', MID);
  y += 9;

  // ── Strengths + Areas to improve (2-col) ─────────────────────────────────
  if ((analysis.technical_strengths?.length ?? 0) > 0 || (analysis.areas_to_improve?.length ?? 0) > 0) {
    y = checkPage(doc, y, 24, type, date);
    const colW2 = (UW - 4) / 2;
    const col2X = ML + colW2 + 4;

    y = sectionLabel(doc, 'Technical Strengths', y);
    const sBase = y;
    const lBot = bulletList(doc, analysis.technical_strengths ?? [], ML, sBase, colW2, GREEN_TEXT, [22, 163, 74]);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('AREAS TO IMPROVE', col2X, sBase - 4.5);
    doc.setDrawColor(200, 130, 20);
    doc.line(col2X, sBase - 3, col2X + colW2, sBase - 3);
    const rBot = bulletList(doc, analysis.areas_to_improve ?? [], col2X, sBase, colW2, AMBER_TEXT, [234, 88, 12]);

    y = Math.max(lBot, rBot) + 6;
  }

  // ── Key moments ───────────────────────────────────────────────────────────
  if ((analysis.key_moments?.length ?? 0) > 0) {
    y = checkPage(doc, y, 16, type, date);
    y = sectionLabel(doc, 'Key Moments', y);

    for (const m of analysis.key_moments ?? []) {
      const mLines = doc.splitTextToSize(m.description, UW - 24) as string[];
      y = checkPage(doc, y, mLines.length * LH + 4, type, date);

      const dotRgb: readonly [number, number, number] =
        m.type === 'strength' ? [22, 163, 74] : m.type === 'weakness' ? [202, 138, 4] : MUTED;

      doc.setFillColor(dotRgb[0], dotRgb[1], dotRgb[2]);
      doc.circle(ML + 1.5, y - 0.5, 1.2, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(dotRgb[0], dotRgb[1], dotRgb[2]);
      doc.text(m.time, ML + 5, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      mLines.forEach((line, li) => doc.text(line, ML + 22, y + li * LH));
      y += Math.max(mLines.length * LH, 4) + 2.5;
    }
    y += 3;
  }

  // ── Detailed breakdowns ───────────────────────────────────────────────────
  const paras: Array<[string, string | undefined]> = [
    ['Positioning & Movement', analysis.positioning_analysis],
    ['Physical Assessment',    analysis.physical_assessment],
    ['Tactical Understanding', analysis.tactical_understanding],
  ];
  for (const [title, text] of paras) {
    if (!text) continue;
    const lines = doc.splitTextToSize(text, UW) as string[];
    y = checkPage(doc, y, lines.length * LH + 12, type, date);
    y = sectionLabel(doc, title, y);
    y = addText(doc, text, ML, y, UW, 8.5, 'normal', MID);
    y += 6;
  }

  // ── Drill recommendations ─────────────────────────────────────────────────
  if ((analysis.drill_recommendations?.length ?? 0) > 0) {
    y = checkPage(doc, y, 16, type, date);
    y = sectionLabel(doc, 'Recommended Drills', y);

    for (const d of analysis.drill_recommendations ?? []) {
      const dLines = doc.splitTextToSize(d.drill, UW - 10) as string[];
      const wLines = doc.splitTextToSize(d.why,  UW - 10) as string[];
      const rowH   = 6 + (dLines.length + wLines.length) * LH;
      y = checkPage(doc, y, rowH + 4, type, date);

      doc.setFillColor(BLUE_BG[0], BLUE_BG[1], BLUE_BG[2]);
      doc.roundedRect(ML, y, UW, rowH, 2, 2, 'F');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BLUE_TEXT[0], BLUE_TEXT[1], BLUE_TEXT[2]);
      dLines.forEach((line, li) => doc.text(line, ML + 4, y + 5 + li * LH));

      const wY = y + 5 + dLines.length * LH + 1.5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      wLines.forEach((line, li) => doc.text(line, ML + 4, wY + li * LH));

      // Frequency badge (top-right of card)
      doc.setFontSize(7);
      doc.setFillColor(224, 242, 254);
      doc.setTextColor(BLUE_TEXT[0], BLUE_TEXT[1], BLUE_TEXT[2]);
      const fW = doc.getTextWidth(d.frequency) + 5;
      doc.roundedRect(ML + UW - fW - 2, y + 2.5, fW + 2, 5, 1, 1, 'F');
      doc.text(d.frequency, ML + UW - fW - 1 + (fW + 2) / 2, y + 6.2, { align: 'center' });

      y += rowH + 4;
    }
    y += 2;
  }

  // ── Scout note ────────────────────────────────────────────────────────────
  if (analysis.scout_note) {
    const snLines = doc.splitTextToSize(`"${analysis.scout_note}"`, UW - 8) as string[];
    const snH     = snLines.length * LH + 10;
    y = checkPage(doc, y, snH + 8, type, date);
    y = sectionLabel(doc, 'Scout Note', y);

    doc.setFillColor(240, 252, 244);
    doc.roundedRect(ML, y, UW, snH, 2, 2, 'F');
    doc.setDrawColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
    doc.line(ML + 0.5, y, ML + 0.5, y + snH);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(GREEN_TEXT[0], GREEN_TEXT[1], GREEN_TEXT[2]);
    snLines.forEach((line, i) => doc.text(line, ML + 4, y + 5 + i * LH));
    y += snH + 5;
  }

  // ── Coaching narrative ────────────────────────────────────────────────────
  if (narrative) {
    y = checkPage(doc, y, 16, type, date);
    y = sectionLabel(doc, 'Personal Coaching Message', y);
    y = addText(doc, narrative, ML, y, UW, 8.5, 'italic', MID);
    y += 5;
  }

  drawFooter(doc);
  doc.save(`grassroots-match-eye-${date.replace(/ /g, '-')}.pdf`);
}

// ════════════════════════════════════════════════════════════════════════════
// 3.  GEMINI DRILL ANALYSIS
// ════════════════════════════════════════════════════════════════════════════

export function downloadDrillResultPdf(result: DrillResult, drill: GeminiDrill): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const type = `Drill Analysis — ${drill.name}`;

  drawHeader(doc, type, date);
  let y = 30;

  // ── Drill title + score ───────────────────────────────────────────────────
  drawScore(doc, result.overall_score, PW - 14 - 14, y + 14, 12);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`${drill.emoji}  ${drill.name}`, ML, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const meta = [
    drill.sport.charAt(0).toUpperCase() + drill.sport.slice(1),
    drill.difficulty,
    drill.duration,
  ].join('  ·  ');
  doc.text(meta, ML, y + 14.5);

  if (result.data_confidence) {
    doc.setFontSize(7.5);
    doc.text(`Gemini confidence: ${result.data_confidence}`, ML, y + 20);
  }
  y += 30;

  // ── Strength + Improvement cards ─────────────────────────────────────────
  y = checkPage(doc, y, 20, type, date);
  const hColW = (UW - 4) / 2;
  const hCol2 = ML + hColW + 4;

  const strLines = doc.splitTextToSize(result.top_strength,    hColW - 6) as string[];
  const impLines = doc.splitTextToSize(result.key_improvement, hColW - 6) as string[];
  const boxH     = Math.max(strLines.length, impLines.length) * LH + 15;

  // Strength card
  doc.setFillColor(LT_GREEN[0], LT_GREEN[1], LT_GREEN[2]);
  doc.roundedRect(ML, y, hColW, boxH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('YOUR STRENGTH', ML + 4, y + 5.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GREEN_TEXT[0], GREEN_TEXT[1], GREEN_TEXT[2]);
  strLines.forEach((line, i) => doc.text(line, ML + 4, y + 10.5 + i * LH));

  // Improvement card
  doc.setFillColor(255, 247, 237);
  doc.roundedRect(hCol2, y, hColW, boxH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('WORK ON THIS', hCol2 + 4, y + 5.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(AMBER_TEXT[0], AMBER_TEXT[1], AMBER_TEXT[2]);
  impLines.forEach((line, i) => doc.text(line, hCol2 + 4, y + 10.5 + i * LH));

  y += boxH + 8;

  // ── Dimension scores table ────────────────────────────────────────────────
  y = checkPage(doc, y, 16, type, date);
  y = sectionLabel(doc, 'Breakdown by Dimension', y);

  // Table header row
  doc.setFillColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.rect(ML, y, UW, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text('Dimension',   ML + 3,  y + 5);
  doc.text('Score',       ML + 72, y + 5);
  doc.text('Observation', ML + 87, y + 5);
  y += 7;

  for (let i = 0; i < drill.dimensions.length; i++) {
    const dim = drill.dimensions[i];
    const s   = result.scores?.[dim.key];
    if (!s) continue;

    const obsLines = doc.splitTextToSize(s.observation, UW - 90) as string[];
    const rowH     = Math.max(obsLines.length * LH, 6) + 4;
    y = checkPage(doc, y, rowH + 2, type, date);

    if (i % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(ML, y, UW, rowH, 'F');
    }

    // Dimension label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(dim.label, ML + 3, y + rowH / 2 + 1.2);

    // Score circle
    const sRgb = scoreRgb(s.score);
    doc.setFillColor(sRgb[0], sRgb[1], sRgb[2]);
    doc.circle(ML + 76, y + rowH / 2, 4.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text(`${s.score}`, ML + 76, y + rowH / 2 + 1.2, { align: 'center' });

    // Observation
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MID[0], MID[1], MID[2]);
    obsLines.forEach((line, li) => doc.text(line, ML + 87, y + 4 + li * LH));

    y += rowH;
  }
  y += 6;

  // ── Coach note ────────────────────────────────────────────────────────────
  if (result.coach_note) {
    const cnLines = doc.splitTextToSize(result.coach_note, UW - 8) as string[];
    const cnH     = cnLines.length * LH + 10;
    y = checkPage(doc, y, cnH + 8, type, date);
    y = sectionLabel(doc, 'Coach Note', y);

    doc.setFillColor(248, 247, 244);
    doc.roundedRect(ML, y, UW, cnH, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(MID[0], MID[1], MID[2]);
    cnLines.forEach((line, i) => doc.text(line, ML + 4, y + 5 + i * LH));
    y += cnH + 5;
  }

  drawFooter(doc);
  doc.save(`grassroots-drill-${drill.id}-${date.replace(/ /g, '-')}.pdf`);
}

// ════════════════════════════════════════════════════════════════════════════
// 4.  COACH MATCH EYE — FULL MATCH
// ════════════════════════════════════════════════════════════════════════════

export interface CoachHalfAnalysis {
  formation_home: string;
  formation_away: string;
  possession_home: number;
  possession_away: number;
  shots_home: number;
  shots_away: number;
  shots_on_target_home: number;
  shots_on_target_away: number;
  fouls_detected: number;
  key_events: Array<{ time: string; team: 'home' | 'away' | 'neutral'; type: string; description: string }>;
  tactical_patterns: string[];
  defensive_issues: string[];
  attacking_strengths: string[];
  man_of_match_candidate: string;
  halftime_recommendation: string;
  key_coaching_points: string[];
  turnover_moments?: Array<{
    time:            string;
    pattern:         string;
    consequence:     string;
    principle_id:    string;
    principle_title: string;
    principle_fix:   string;
    safety_flag:     boolean;
    safety_note?:    string;
  }>;
}

export interface CoachHalfResult {
  analysis: CoachHalfAnalysis;
  narrative: string;
}

export function downloadCoachMatchEyePdf(
  firstResult: CoachHalfResult,
  secondResult: CoachHalfResult,
  homeTeam: string,
  awayTeam: string,
  sport: string,
  competition: string,
): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const type = `Coach Match Eye — ${sport}`;

  drawHeader(doc, type, date);
  let y = 30;

  // ── Match title banner ────────────────────────────────────────────────────
  const bannerH = 16;
  doc.setFillColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.roundedRect(ML, y, UW, bannerH, 3, 3, 'F');
  if (competition) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(competition, ML + 4, y + 5.5);
  }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${homeTeam} vs ${awayTeam}`, ML + 4, y + 12);
  y += bannerH + 10;

  // ── Full match combined stats ─────────────────────────────────────────────
  y = checkPage(doc, y, 16, type, date);
  y = sectionLabel(doc, 'Full Match Stats', y);

  const statCols = [
    { label: 'Shots (Home)',    value: String((firstResult.analysis.shots_home ?? 0) + (secondResult.analysis.shots_home ?? 0)),    sub: `On target: ${(firstResult.analysis.shots_on_target_home ?? 0) + (secondResult.analysis.shots_on_target_home ?? 0)}` },
    { label: 'Shots (Away)',    value: String((firstResult.analysis.shots_away ?? 0) + (secondResult.analysis.shots_away ?? 0)),    sub: `On target: ${(firstResult.analysis.shots_on_target_away ?? 0) + (secondResult.analysis.shots_on_target_away ?? 0)}` },
    { label: 'Poss 1H (Home)', value: `${firstResult.analysis.possession_home ?? '—'}%` },
    { label: 'Poss 2H (Home)', value: `${secondResult.analysis.possession_home ?? '—'}%` },
    { label: 'Total Fouls',    value: String((firstResult.analysis.fouls_detected ?? 0) + (secondResult.analysis.fouls_detected ?? 0)) },
  ];
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(ML, y, UW, 22, 2, 2, 'F');
  const sw5 = (UW - 16) / 5;
  statCols.forEach((s, i) => {
    const cx = ML + i * (sw5 + 4) + sw5 / 2;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
    doc.text(s.value, cx, y + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(s.label, cx, y + 13, { align: 'center' });
    if (s.sub) doc.text(s.sub, cx, y + 18, { align: 'center' });
  });
  y += 28;

  // ── Render each half ──────────────────────────────────────────────────────
  const renderHalf = (result: CoachHalfResult, halfLabel: string, home: string, away: string) => {
    const a = result.analysis;

    y = checkPage(doc, y, 14, type, date);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(ML, y, UW, 9, 2, 2, 'F');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
    doc.text(halfLabel, ML + 4, y + 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${a.formation_home} vs ${a.formation_away}`, PW - 14, y + 6, { align: 'right' });
    y += 13;

    if (result.narrative) {
      const nLines = doc.splitTextToSize(result.narrative, UW) as string[];
      y = checkPage(doc, y, nLines.length * LH + 10, type, date);
      y = addText(doc, result.narrative, ML, y, UW, 8.5, 'normal', MID);
      y += 6;
    }

    if ((a.key_events?.length ?? 0) > 0) {
      y = checkPage(doc, y, 16, type, date);
      y = sectionLabel(doc, 'Key Events', y);
      for (const ev of a.key_events.slice(0, 8)) {
        const evLines = doc.splitTextToSize(`${ev.type} — ${ev.description}`, UW - 30) as string[];
        y = checkPage(doc, y, evLines.length * LH + 3, type, date);
        const teamColor: readonly [number, number, number] =
          ev.team === 'home' ? [29, 78, 216] : ev.team === 'away' ? [220, 38, 38] : MUTED;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
        doc.text(ev.time, ML, y);
        doc.setTextColor(teamColor[0], teamColor[1], teamColor[2]);
        doc.text(ev.team === 'home' ? home : ev.team === 'away' ? away : '–', ML + 12, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MID[0], MID[1], MID[2]);
        evLines.forEach((l, li) => doc.text(l, ML + 30, y + li * LH));
        y += Math.max(evLines.length * LH, LH) + 2;
      }
      y += 3;
    }

    const lists: Array<[string, string[], readonly [number, number, number]]> = [
      ['Tactical Patterns',   a.tactical_patterns   ?? [], MID],
      ['Defensive Issues',    a.defensive_issues    ?? [], [180, 40, 40]],
      ['Attacking Strengths', a.attacking_strengths ?? [], GREEN_TEXT],
    ];
    for (const [title, items, color] of lists) {
      if (!items.length) continue;
      y = checkPage(doc, y, items.length * (LH + 1) + 14, type, date);
      y = sectionLabel(doc, title, y);
      y = bulletList(doc, items, ML, y, UW, color, color);
      y += 4;
    }

    if ((a.key_coaching_points?.length ?? 0) > 0) {
      y = checkPage(doc, y, a.key_coaching_points.length * (LH + 1) + 14, type, date);
      y = sectionLabel(doc, 'Coaching Points', y);
      y = bulletList(doc, a.key_coaching_points, ML, y, UW, GREEN_TEXT, GRS_GREEN);
      y += 4;
    }

    if (halfLabel.includes('First') && a.halftime_recommendation) {
      const htLines = doc.splitTextToSize(a.halftime_recommendation, UW - 8) as string[];
      const htH     = htLines.length * LH + 10;
      y = checkPage(doc, y, htH + 8, type, date);
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(ML, y, UW, htH, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('HALFTIME RECOMMENDATION', ML + 4, y + 5.5);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      htLines.forEach((l, i) => doc.text(l, ML + 4, y + 10 + i * LH));
      y += htH + 6;
    }

    y += 4;
  };

  renderHalf(firstResult,  'First Half',  homeTeam, awayTeam);
  y = checkPage(doc, y, 10, type, date);
  doc.setDrawColor(220, 220, 220);
  doc.line(ML, y, ML + UW, y);
  y += 8;
  renderHalf(secondResult, 'Second Half', homeTeam, awayTeam);

  // ── Man of match ──────────────────────────────────────────────────────────
  const motm = secondResult.analysis.man_of_match_candidate || firstResult.analysis.man_of_match_candidate;
  if (motm) {
    const motmH = 16;
    y = checkPage(doc, y, motmH + 8, type, date);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(ML, y, UW, motmH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('MAN OF THE MATCH', ML + 4, y + 5.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(motm, ML + 4, y + 12.5);
    y += motmH + 6;
  }

  drawFooter(doc);
  const slug = `${homeTeam.replace(/\s+/g, '-')}-vs-${awayTeam.replace(/\s+/g, '-')}`;
  doc.save(`grassroots-coach-match-eye-${slug}-${date.replace(/ /g, '-')}.pdf`);
}

// ════════════════════════════════════════════════════════════════════════════
// 5.  COACH MATCH EYE — DRILL SESSION
// ════════════════════════════════════════════════════════════════════════════

export interface CoachDrillAnalysis {
  drill_type: string;
  duration_observed: string;
  intensity_rating: number;
  player_count?: number;
  key_observations: string[];
  individual_feedback: Array<{ identifier: string; observation: string; fix: string }>;
  technical_issues: string[];
  positives: string[];
  coaching_points: string[];
  drill_progression: string;
}

export function downloadCoachDrillPdf(
  result: { analysis: CoachDrillAnalysis; narrative: string },
  drillType: string,
  sport: string,
): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const a    = result.analysis;
  const type = `Coach Drill — ${a.drill_type || drillType}`;

  drawHeader(doc, type, date);
  let y = 30;

  // ── Title + stats row ─────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(`${a.drill_type || drillType} — ${sport}`, ML, y + 7);
  y += 14;

  const statRow = [
    { label: 'Intensity', value: `${a.intensity_rating ?? '—'}/10` },
    ...(a.duration_observed ? [{ label: 'Duration', value: a.duration_observed }] : []),
    ...(a.player_count != null ? [{ label: 'Players', value: String(a.player_count) }] : []),
  ];
  if (statRow.length) {
    doc.setFillColor(248, 250, 248);
    doc.roundedRect(ML, y, UW, 14, 2, 2, 'F');
    const sw = UW / statRow.length;
    statRow.forEach((s, i) => {
      const cx = ML + i * sw + sw / 2;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
      doc.text(s.value, cx, y + 7, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(s.label, cx, y + 12, { align: 'center' });
    });
    y += 20;
  }

  // ── Session narrative ─────────────────────────────────────────────────────
  if (result.narrative) {
    y = checkPage(doc, y, 14, type, date);
    y = sectionLabel(doc, 'Session Report', y);
    y = addText(doc, result.narrative, ML, y, UW, 8.5, 'normal', MID);
    y += 6;
  }

  // ── What's working ────────────────────────────────────────────────────────
  if ((a.positives?.length ?? 0) > 0) {
    y = checkPage(doc, y, a.positives.length * (LH + 1) + 14, type, date);
    y = sectionLabel(doc, "What's Working", y);
    y = bulletList(doc, a.positives, ML, y, UW, GREEN_TEXT, [22, 163, 74]);
    y += 4;
  }

  // ── Key observations ──────────────────────────────────────────────────────
  if ((a.key_observations?.length ?? 0) > 0) {
    y = checkPage(doc, y, a.key_observations.length * (LH + 1) + 14, type, date);
    y = sectionLabel(doc, 'Key Observations', y);
    y = bulletList(doc, a.key_observations, ML, y, UW, MID, GRS_GREEN);
    y += 4;
  }

  // ── Technical issues ──────────────────────────────────────────────────────
  if ((a.technical_issues?.length ?? 0) > 0) {
    y = checkPage(doc, y, a.technical_issues.length * (LH + 1) + 14, type, date);
    y = sectionLabel(doc, 'Technical Issues', y);
    y = bulletList(doc, a.technical_issues, ML, y, UW, [160, 40, 40] as const, [220, 38, 38] as const);
    y += 4;
  }

  // ── Individual player feedback ────────────────────────────────────────────
  if ((a.individual_feedback?.length ?? 0) > 0) {
    y = checkPage(doc, y, 16, type, date);
    y = sectionLabel(doc, 'Individual Player Feedback', y);
    for (const pl of a.individual_feedback) {
      const obsLines = doc.splitTextToSize(pl.observation,      UW - 8) as string[];
      const fixLines = doc.splitTextToSize(`Fix: ${pl.fix}`,    UW - 8) as string[];
      const rowH     = 8 + (obsLines.length + fixLines.length) * LH + 6;
      y = checkPage(doc, y, rowH + 4, type, date);
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(ML, y, UW, rowH, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      doc.text(pl.identifier, ML + 4, y + 5.5);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      obsLines.forEach((l, i) => doc.text(l, ML + 4, y + 9.5 + i * LH));
      const fy = y + 9.5 + obsLines.length * LH + 2;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(AMBER_TEXT[0], AMBER_TEXT[1], AMBER_TEXT[2]);
      fixLines.forEach((l, i) => doc.text(l, ML + 4, fy + i * LH));
      y += rowH + 4;
    }
    y += 2;
  }

  // ── Coaching points ───────────────────────────────────────────────────────
  if ((a.coaching_points?.length ?? 0) > 0) {
    y = checkPage(doc, y, a.coaching_points.length * (LH + 1) + 14, type, date);
    y = sectionLabel(doc, 'Coaching Points', y);
    y = bulletList(doc, a.coaching_points, ML, y, UW, GREEN_TEXT, GRS_GREEN);
    y += 4;
  }

  // ── Next progression ──────────────────────────────────────────────────────
  if (a.drill_progression) {
    const dpLines = doc.splitTextToSize(a.drill_progression, UW - 8) as string[];
    const dpH     = dpLines.length * LH + 10;
    y = checkPage(doc, y, dpH + 8, type, date);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(ML, y, UW, dpH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('NEXT PROGRESSION', ML + 4, y + 5.5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MID[0], MID[1], MID[2]);
    dpLines.forEach((l, i) => doc.text(l, ML + 4, y + 10 + i * LH));
    y += dpH + 6;
  }

  drawFooter(doc);
  doc.save(`grassroots-drill-${(a.drill_type || drillType).replace(/\s+/g, '-').toLowerCase()}-${date.replace(/ /g, '-')}.pdf`);
}

// ════════════════════════════════════════════════════════════════════════════
// 6.  COACH MATCH EYE — SINGLE HALF
// ════════════════════════════════════════════════════════════════════════════

export function downloadCoachHalfPdf(
  result: CoachHalfResult,
  halfLabel: string,
  homeTeam: string,
  awayTeam: string,
  sport: string,
  competition: string,
): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const type = `Coach Match Eye — ${sport} — ${halfLabel}`;

  drawHeader(doc, type, date);
  let y = 30;

  const a = result.analysis;

  // ── Match title banner ────────────────────────────────────────────────────
  const bannerH = 16;
  doc.setFillColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.roundedRect(ML, y, UW, bannerH, 3, 3, 'F');
  if (competition) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(`${competition} — ${halfLabel}`, ML + 4, y + 5.5);
  }
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`${homeTeam} vs ${awayTeam}`, ML + 4, y + 12);
  y += bannerH + 10;

  // ── Half sub-header ───────────────────────────────────────────────────────
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(ML, y, UW, 9, 2, 2, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
  doc.text(halfLabel, ML + 4, y + 6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`${a.formation_home} vs ${a.formation_away}`, PW - 14, y + 6, { align: 'right' });
  y += 13;

  // ── Narrative ─────────────────────────────────────────────────────────────
  if (result.narrative) {
    const nLines = doc.splitTextToSize(result.narrative, UW) as string[];
    y = checkPage(doc, y, nLines.length * LH + 10, type, date);
    y = addText(doc, result.narrative, ML, y, UW, 8.5, 'normal', MID);
    y += 6;
  }

  // ── Key events ────────────────────────────────────────────────────────────
  if ((a.key_events?.length ?? 0) > 0) {
    y = checkPage(doc, y, 16, type, date);
    y = sectionLabel(doc, 'Key Events', y);
    for (const ev of a.key_events.slice(0, 8)) {
      const evLines = doc.splitTextToSize(`${ev.type} — ${ev.description}`, UW - 30) as string[];
      y = checkPage(doc, y, evLines.length * LH + 3, type, date);
      const teamColor: readonly [number, number, number] =
        ev.team === 'home' ? [29, 78, 216] : ev.team === 'away' ? [220, 38, 38] : MUTED;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
      doc.text(ev.time, ML, y);
      doc.setTextColor(teamColor[0], teamColor[1], teamColor[2]);
      doc.text(ev.team === 'home' ? homeTeam : ev.team === 'away' ? awayTeam : '–', ML + 12, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      evLines.forEach((l, li) => doc.text(l, ML + 30, y + li * LH));
      y += Math.max(evLines.length * LH, LH) + 2;
    }
    y += 3;
  }

  // ── Tactical / defensive / attacking lists ────────────────────────────────
  const lists: Array<[string, string[], readonly [number, number, number]]> = [
    ['Tactical Patterns',   a.tactical_patterns   ?? [], MID],
    ['Defensive Issues',    a.defensive_issues    ?? [], [180, 40, 40]],
    ['Attacking Strengths', a.attacking_strengths ?? [], GREEN_TEXT],
  ];
  for (const [title, items, color] of lists) {
    if (!items.length) continue;
    y = checkPage(doc, y, items.length * (LH + 1) + 14, type, date);
    y = sectionLabel(doc, title, y);
    y = bulletList(doc, items, ML, y, UW, color, color);
    y += 4;
  }

  // ── Study in Tactical Academy ─────────────────────────────────────────────
  if ((a.turnover_moments?.length ?? 0) > 0) {
    const seen = new Set<string>();
    const uniquePrinciples = a.turnover_moments!.filter(m => {
      if (seen.has(m.principle_id)) return false;
      seen.add(m.principle_id);
      return true;
    });
    y = checkPage(doc, y, uniquePrinciples.length * (LH + 2) + 14, type, date);
    y = sectionLabel(doc, 'Study in Tactical Academy', y);
    for (const p of uniquePrinciples) {
      y = checkPage(doc, y, LH + 2, type, date);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
      doc.text(`${p.principle_title} →`, ML + 4, y);
      y += LH + 2;
    }
    y += 4;
  }

  // ── Team Turnover Patterns ────────────────────────────────────────────────
  if ((a.turnover_moments?.length ?? 0) > 0) {
    y = checkPage(doc, y, 14, type, date);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(ML, y, UW, 8, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('Team Turnover Patterns', ML + 4, y + 5.5);
    y += 12;

    for (const m of a.turnover_moments!) {
      y = checkPage(doc, y, 12, type, date);

      // Time badge
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(m.time, ML, y);
      if (m.safety_flag) {
        doc.setFillColor(220, 38, 38);
        doc.roundedRect(ML + 14, y - 4, 26, 5.5, 1, 1, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Collision Risk', ML + 15, y);
      }
      y += LH + 1;

      // Pattern
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      doc.text('Pattern:', ML, y);
      doc.setFont('helvetica', 'normal');
      const patLines = doc.splitTextToSize(m.pattern, UW - 20) as string[];
      patLines.forEach((l, i) => doc.text(l, ML + 16, y + i * LH));
      y += Math.max(patLines.length, 1) * LH + 2;

      // Consequence
      y = checkPage(doc, y, LH + 2, type, date);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      doc.text('Result:', ML, y);
      doc.setFont('helvetica', 'normal');
      const conLines = doc.splitTextToSize(m.consequence, UW - 20) as string[];
      conLines.forEach((l, i) => doc.text(l, ML + 16, y + i * LH));
      y += Math.max(conLines.length, 1) * LH + 2;

      // Safety note
      if (m.safety_flag && m.safety_note) {
        const snLines = doc.splitTextToSize(`⚠ ${m.safety_note}`, UW - 8) as string[];
        const snH     = snLines.length * LH + 6;
        y = checkPage(doc, y, snH, type, date);
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(ML, y, UW, snH, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(185, 28, 28);
        snLines.forEach((l, i) => doc.text(l, ML + 4, y + 4 + i * LH));
        y += snH + 3;
      }

      // Tactics fix green box
      const fixLines = doc.splitTextToSize(m.principle_fix, UW - 8) as string[];
      const fixH     = fixLines.length * LH + 14;
      y = checkPage(doc, y, fixH, type, date);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(ML, y, UW, fixH, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(GRS_GREEN[0], GRS_GREEN[1], GRS_GREEN[2]);
      doc.text(`${m.principle_title} — Tactics Academy Fix`, ML + 4, y + 5);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(MID[0], MID[1], MID[2]);
      fixLines.forEach((l, i) => doc.text(l, ML + 4, y + 10 + i * LH));
      y += fixH + 4;
    }
    y += 2;
  }

  // ── Session Recommendations ───────────────────────────────────────────────
  if ((a.key_coaching_points?.length ?? 0) > 0) {
    y = checkPage(doc, y, a.key_coaching_points.length * (LH + 1) + 14, type, date);
    y = sectionLabel(doc, 'Session Recommendations', y);
    y = bulletList(doc, a.key_coaching_points, ML, y, UW, GREEN_TEXT, GRS_GREEN);
    y += 4;
  }

  // ── Man of the Match ──────────────────────────────────────────────────────
  if (a.man_of_match_candidate) {
    const motmLines = doc.splitTextToSize(a.man_of_match_candidate, UW - 8) as string[];
    const motmH     = motmLines.length * LH + 12;
    y = checkPage(doc, y, motmH + 8, type, date);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(ML, y, UW, motmH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('MAN OF THE MATCH', ML + 4, y + 5.5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MID[0], MID[1], MID[2]);
    motmLines.forEach((l, i) => doc.text(l, ML + 4, y + 10 + i * LH));
    y += motmH + 6;
  }

  // ── Halftime recommendation (first half only) ─────────────────────────────
  if (halfLabel === 'First Half' && a.halftime_recommendation) {
    const htLines = doc.splitTextToSize(a.halftime_recommendation, UW - 8) as string[];
    const htH     = htLines.length * LH + 10;
    y = checkPage(doc, y, htH + 8, type, date);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(ML, y, UW, htH, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('HALFTIME RECOMMENDATION', ML + 4, y + 5.5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MID[0], MID[1], MID[2]);
    htLines.forEach((l, i) => doc.text(l, ML + 4, y + 10 + i * LH));
    y += htH + 6;
  }

  drawFooter(doc);
  const halfSlug = halfLabel.toLowerCase().replace(/\s+/g, '-');
  const slug     = `${homeTeam.replace(/\s+/g, '-')}-vs-${awayTeam.replace(/\s+/g, '-')}`;
  doc.save(`grassroots-coach-${halfSlug}-${slug}-${date.replace(/ /g, '-')}.pdf`);
}
