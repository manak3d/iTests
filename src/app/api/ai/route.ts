import { NextRequest, NextResponse } from 'next/server';
import { digitizePdfContentForAssignment } from '@/ai/flows/digitize-pdf-content-for-assignment';
import { generateQuestionsFromExtractedText } from '@/ai/flows/generate-questions-from-extracted-text';
import { gradeSubmissionFlow } from '@/ai/flows/grade-submission';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log('[AI API] Action:', action);
    console.log('[AI API] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
    console.log('[AI API] GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);

    if (action === 'digitize') {
      const { fileDataUri } = body;
      if (!fileDataUri) {
        return NextResponse.json({ error: 'Missing fileDataUri' }, { status: 400 });
      }

      const result = await digitizePdfContentForAssignment({ fileDataUri });
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, extractedText: result.extractedText });
    }

    if (action === 'generate') {
      const { extractedText, topic } = body;
      if (!extractedText && !topic) {
        return NextResponse.json({ error: 'Missing both extractedText and topic' }, { status: 400 });
      }

      const result = await generateQuestionsFromExtractedText({ extractedText, topic });
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, questions: result.questions });
    }

    if (action === 'grade') {
      const { questions, answers, questionDrawings, mainWorkDrawing, gradeThresholds } = body;
      if (!questions || !answers) {
        return NextResponse.json({ error: 'Missing questions or answers' }, { status: 400 });
      }

      const result = await gradeSubmissionFlow({
        questions,
        answers,
        questionDrawings: questionDrawings || {},
        mainWorkDrawing,
        gradeThresholds
      });

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, evaluation: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/ai error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
