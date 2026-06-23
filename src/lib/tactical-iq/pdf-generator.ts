// src/lib/tactical-iq/pdf-generator.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { TrainingMicrocycle } from './blueprint-generator';
import { PhaseReport } from './phase-classifier';

export async function generateBlueprintPDF(input: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  microcycle: TrainingMicrocycle;
  phases: PhaseReport;
  narrative: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Page 1: Cover
  const page1 = pdfDoc.addPage([600, 800]);
  const { width, height } = page1.getSize();
  
  // GRS Header
  page1.drawText('GRS COACHING BLUEPRINT', {
    x: 50,
    y: height - 50,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.36, 0.16), // GRS Green
  });
  
  page1.drawText(`${input.homeTeam} vs ${input.awayTeam}`, {
    x: 50,
    y: height - 100,
    size: 32,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page1.drawText(`Final Score: ${input.homeScore} - ${input.awayScore}`, {
    x: 50,
    y: height - 140,
    size: 18,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page1.drawText('5-Day Training Microcycle', {
    x: 50,
    y: height - 200,
    size: 20,
    font: boldFont,
    color: rgb(0.94, 0.7, 0.16), // GRS Gold
  });
  
  page1.drawText('Generated for: [Coach Name]', {
    x: 50,
    y: height - 250,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  page1.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: height - 270,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Page 2: Executive Summary
  const page2 = pdfDoc.addPage([600, 800]);
  page2.drawText('Executive Summary', {
    x: 50,
    y: height - 50,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.36, 0.16),
  });
  
  // Wrap text for the narrative
  const wrappedNarrative = wrapText(input.narrative, 500);
  let yPos = height - 100;
  for (const line of wrappedNarrative) {
    page2.drawText(line, {
      x: 50,
      y: yPos,
      size: 12,
      font: font,
      color: rgb(0.1, 0.1, 0.1),
    });
    yPos -= 18;
  }
  
  // Phase Summary
  yPos -= 20;
  page2.drawText('Phase Performance', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont,
    color: rgb(0.94, 0.7, 0.16),
  });
  
  yPos -= 30;
  const phases = [
    { label: 'Regaining Possession', rate: input.phases.regain.successRate },
    { label: 'Building the Attack', rate: input.phases.build.successRate },
    { label: 'Finishing', rate: input.phases.finish.successRate },
  ];
  
  for (const phase of phases) {
    page2.drawText(`${phase.label}: ${phase.rate}%`, {
      x: 60,
      y: yPos,
      size: 12,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 20;
  }
  
  // Page 3+: Training Modules
  let currentPage = pdfDoc.addPage([600, 800]);
  let pageCount = 3;
  
  for (const module of input.microcycle.modules) {
    if (currentPage.getSize().height - 100 < 100) {
      currentPage = pdfDoc.addPage([600, 800]);
      pageCount++;
    }
    
    const { height: pageHeight } = currentPage.getSize();
    let y = pageHeight - 50;
    
    // Module Header
    currentPage.drawText(`Day ${module.day}: ${module.title}`, {
      x: 50,
      y: y,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.36, 0.16),
    });
    
    y -= 30;
    currentPage.drawText(`Focus: ${module.focus}`, {
      x: 50,
      y: y,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Session Components
    y -= 25;
    const components = [
      ['Warm-up', module.warmup],
      ['Skill/Drill', module.drill],
      ['Tactical Game', module.tacticalGame],
      ['Conditioned Match', module.conditionedMatch],
    ];
    
    for (const [label, content] of components) {
      if (y < 100) {
        currentPage = pdfDoc.addPage([600, 800]);
        pageCount++;
        y = currentPage.getSize().height - 50;
      }
      
      currentPage.drawText(label, {
        x: 55,
        y: y,
        size: 12,
        font: boldFont,
        color: rgb(0.94, 0.7, 0.16),
      });
      
      y -= 18;
      const wrappedContent = wrapText(content, 450);
      for (const line of wrappedContent) {
        currentPage.drawText(line, {
          x: 65,
          y: y,
          size: 10,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 16;
      }
      y -= 10;
    }
    
    // Coaching Points
    if (y < 100) {
      currentPage = pdfDoc.addPage([600, 800]);
      pageCount++;
      y = currentPage.getSize().height - 50;
    }
    
    currentPage.drawText('Coaching Points:', {
      x: 55,
      y: y,
      size: 12,
      font: boldFont,
      color: rgb(0.94, 0.7, 0.16),
    });
    
    y -= 20;
    for (const point of module.coachingPoints) {
      if (y < 50) {
        currentPage = pdfDoc.addPage([600, 800]);
        pageCount++;
        y = currentPage.getSize().height - 50;
      }
      currentPage.drawText(`• ${point}`, {
        x: 65,
        y: y,
        size: 10,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 16;
    }
  }
  
  return await pdfDoc.save();
}

// Helper function to wrap text
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    // Approximate width: 6px per character for 12pt font
    if (testLine.length * 6 > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }
  return lines;
}