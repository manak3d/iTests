import { NextRequest, NextResponse } from 'next/server';
import { digitizePdfContentForAssignment } from '@/ai/flows/digitize-pdf-content-for-assignment';
import { generateQuestionsFromExtractedText } from '@/ai/flows/generate-questions-from-extracted-text';
import { gradeSubmissionFlow } from '@/ai/flows/grade-submission';
import { getUserSession } from '@/lib/auth';
import { Teacher } from '@/models/Teacher';
import { Assignment } from '@/models/Assignment';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const deductTeacherCredit = async (teacherId: string) => {
  const t = await Teacher.findOne({ _id: teacherId });
  if (!t || t.role === 'admin') return;
  
  const maxCredits = t.aiCreditsMax || 30;
  const currentCredits = t.aiCredits || 0;
  
  const updateData: any = {};
  if (currentCredits > maxCredits) {
    updateData.aiExtraCredits = Math.max(0, (t.aiExtraCredits || 0) - 1);
    updateData.aiCredits = Math.max(0, currentCredits - 1);
  } else {
    updateData.aiCredits = Math.max(0, currentCredits - 1);
  }
  await Teacher.updateOne({ _id: teacherId }, { $set: updateData });
};

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Pro přístup se musíte přihlásit.' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { action } = body;

    let teacher = null;

    if (session.role === 'teacher') {
      teacher = await Teacher.findOne({ _id: session.id });
      if (!teacher) {
        return NextResponse.json({ error: 'Učitel nebyl nalezen.' }, { status: 404 });
      }
      if ((teacher.aiCredits || 0) <= 0) {
        return NextResponse.json({ 
          error: 'Nemáte dostatek AI kreditů. Pro pokračování si prosím dokupte kredity (50 ks za 25 Kč) nebo upgradujte svůj tarif.' 
        }, { status: 403 });
      }
    } else if (session.role === 'student') {
      if (action !== 'grade') {
        return NextResponse.json({ error: 'Nedostatečná oprávnění pro využití AI funkcí.' }, { status: 403 });
      }
      const { assignmentId } = body;
      if (!assignmentId) {
        return NextResponse.json({ error: 'Chybí ID úkolu.' }, { status: 400 });
      }
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return NextResponse.json({ error: 'Úkol nebyl nalezen.' }, { status: 404 });
      }
      if (!assignment.isPractice) {
        return NextResponse.json({ error: 'AI vyhodnocení můžete spustit pouze u cvičných úkolů.' }, { status: 403 });
      }

      if (assignment.teacherId) {
        teacher = await Teacher.findById(assignment.teacherId);
        if (!teacher) {
          return NextResponse.json({ error: 'Učitel přiřazený k úkolu nebyl nalezen.' }, { status: 404 });
        }
        if (teacher.role !== 'admin') {
          if ((teacher.aiCredits || 0) <= 0) {
            return NextResponse.json({ 
              error: 'Učitel nemá dostatek AI kreditů pro vyhodnocení.' 
            }, { status: 403 });
          }
          if (teacher.premiumType !== 'yearly' && teacher.premiumType !== 'school') {
            return NextResponse.json({ 
              error: 'AI vyhodnocení cvičných úkolů je dostupné pouze pro školy nebo učitele s ročním Premium předplatným.' 
            }, { status: 403 });
          }
        }
      }
    } else if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Nedostatečná oprávnění pro využití AI funkcí.' }, { status: 403 });
    }

    if (action === 'grade' && session.role === 'teacher' && teacher) {
      if (teacher.premiumType !== 'yearly' && teacher.premiumType !== 'school') {
        return NextResponse.json({ 
          error: 'AI hodnocení odevzdaných prací je dostupné pouze pro uživatele s ročním Premium předplatným nebo školní licencí.' 
        }, { status: 403 });
      }
    }

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

      if (teacher) {
        await deductTeacherCredit(teacher._id.toString());
      }
      return NextResponse.json({ success: true, extractedText: result.extractedText });
    }

    if (action === 'generate') {
      const { extractedText, topic, numMultipleChoice, numTrueFalse, numShortAnswer } = body;
      if (!extractedText && !topic) {
        return NextResponse.json({ error: 'Missing both extractedText and topic' }, { status: 400 });
      }

      const result = await generateQuestionsFromExtractedText({
        extractedText,
        topic,
        numMultipleChoice: numMultipleChoice ? Number(numMultipleChoice) : undefined,
        numTrueFalse: numTrueFalse ? Number(numTrueFalse) : undefined,
        numShortAnswer: numShortAnswer ? Number(numShortAnswer) : undefined
      });
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      if (teacher) {
        await deductTeacherCredit(teacher._id.toString());
      }
      return NextResponse.json({ success: true, questions: result.questions });
    }

    if (action === 'grade') {
      const { questions, answers, questionDrawings, mainWorkDrawing, gradeThresholds, customInstructions } = body;
      if (!questions || !answers) {
        return NextResponse.json({ error: 'Missing questions or answers' }, { status: 400 });
      }

      const result = await gradeSubmissionFlow({
        questions,
        answers,
        questionDrawings: questionDrawings || {},
        mainWorkDrawing,
        gradeThresholds,
        customInstructions
      });

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      if (teacher) {
        await deductTeacherCredit(teacher._id.toString());
      }
      return NextResponse.json({ success: true, evaluation: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/ai error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
