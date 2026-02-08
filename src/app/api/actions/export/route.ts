import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

const exportSchema = z.object({
  meetingId: z.string(),
  format: z.enum(['pdf', 'markdown', 'json', 'txt']),
  include: z.object({
    transcript: z.boolean().default(true),
    summary: z.boolean().default(true),
    decisions: z.boolean().default(true),
    actionItems: z.boolean().default(true),
    speakers: z.boolean().default(false),
    topics: z.boolean().default(false),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, format: formatType, include } = exportSchema.parse(body);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    let content: string;
    let filename: string;
    let contentType: string;

    switch (formatType) {
      case 'json':
        content = JSON.stringify(meeting, null, 2);
        filename = `${meeting.title}-export.json`;
        contentType = 'application/json';
        break;

      case 'markdown':
        content = generateMarkdown(meeting, include);
        filename = `${meeting.title}-export.md`;
        contentType = 'text/markdown';
        break;

      case 'txt':
        content = generateText(meeting, include);
        filename = `${meeting.title}-export.txt`;
        contentType = 'text/plain';
        break;

      case 'pdf':
        const pdfBuffer = await generatePDF(meeting, include);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${meeting.title}-export.pdf"`,
          },
        });

      default:
        throw new Error('Unsupported format');
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export meeting' },
      { status: 500 }
    );
  }
}

function generateMarkdown(meeting: any, include?: any): string {
  const parts: string[] = [];

  parts.push(`# ${meeting.title}`);
  parts.push(`Date: ${format(new Date(meeting.createdAt), 'PPP')}`);
  parts.push(`Duration: ${meeting.duration ? Math.round(meeting.duration / 60) + ' minutes' : 'Unknown'}`);
  parts.push('');

  if (include?.summary !== false && meeting.summary) {
    parts.push('## Summary');
    parts.push(meeting.summary);
    parts.push('');
  }

  if (include?.decisions !== false && meeting.decisions) {
    parts.push('## Decisions');
    const decisions = Array.isArray(meeting.decisions) ? meeting.decisions : [];
    decisions.forEach((d: any) => {
      parts.push(`- ${d.text}${d.owner ? ` (Owner: ${d.owner})` : ''}`);
    });
    parts.push('');
  }

  if (include?.actionItems !== false && meeting.actionItems) {
    parts.push('## Action Items');
    const items = Array.isArray(meeting.actionItems) ? meeting.actionItems : [];
    items.forEach((item: any) => {
      const status = item.completed ? '[x]' : '[ ]';
      parts.push(`- ${status} ${item.text}${item.assignee ? ` @${item.assignee}` : ''}`);
    });
    parts.push('');
  }

  if (include?.transcript !== false && meeting.transcript) {
    parts.push('## Transcript');
    parts.push(meeting.transcript);
  }

  return parts.join('\n');
}

function generateText(meeting: any, include?: any): string {
  
  return generateMarkdown(meeting, include).replace(/[#*[\]]/g, '');
}

async function generatePDF(meeting: any, include?: any): Promise<Buffer> {
  const doc = new jsPDF();
  let y = 20;

  
  doc.setFontSize(20);
  doc.text(meeting.title, 20, y);
  y += 15;

  
  doc.setFontSize(12);
  doc.text(`Date: ${format(new Date(meeting.createdAt), 'PPP')}`, 20, y);
  y += 10;

  if (meeting.duration) {
    doc.text(`Duration: ${Math.round(meeting.duration / 60)} minutes`, 20, y);
    y += 15;
  }

  
  if (include?.summary !== false && meeting.summary) {
    doc.setFontSize(16);
    doc.text('Summary', 20, y);
    y += 10;
    doc.setFontSize(12);
    const splitSummary = doc.splitTextToSize(meeting.summary, 170);
    doc.text(splitSummary, 20, y);
    y += splitSummary.length * 7 + 10;
  }

  

  return Buffer.from(doc.output('arraybuffer'));
}