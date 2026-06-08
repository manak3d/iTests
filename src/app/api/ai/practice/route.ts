import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { practiceFlow } from "@/ai/flows/practice-flow";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Assignment } from "@/models/Assignment";
import { Student } from "@/models/Student";
import { Classroom } from "@/models/Classroom";

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

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized", message: "Pro přístup se musíte přihlásit." }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "AI_OFFLINE", 
        message: "AI asistent je momentálně offline (není nastaven API klíč)." 
      }, { status: 503 });
    }

    const body = await request.json();
    const { questionText, numQuestions, assignmentId } = body;

    if (!questionText) {
      return NextResponse.json({ error: "Missing parameter", message: "Chybí text původní otázky." }, { status: 400 });
    }

    await dbConnect();

    // Resolve teacher to charge
    let teacherId = body.teacherId;
    if (assignmentId) {
      const assignment = await Assignment.findOne({ _id: assignmentId });
      if (assignment) {
        teacherId = assignment.teacherId;
      }
    }

    if (!teacherId && session.role === 'student') {
      const student = await Student.findOne({ _id: session.id });
      if (student && student.classroomId) {
        const classroom = await Classroom.findOne({ _id: student.classroomId });
        if (classroom) {
          teacherId = classroom.teacherId;
        }
      }
    }

    if (teacherId) {
      const teacher = await Teacher.findOne({ _id: teacherId });
      if (teacher && teacher.role !== 'admin' && (teacher.aiCredits || 0) <= 0) {
        return NextResponse.json({ 
          error: "AI_OFFLINE", 
          message: "Učitel nemá dostatek AI kreditů pro generování procvičování. Kontaktujte svého učitele." 
        }, { status: 403 });
      }
    }

    const n = typeof numQuestions === 'number' ? numQuestions : 1;
    const result = await practiceFlow({ questionText, numQuestions: n });

    if ('error' in result) {
      return NextResponse.json({ error: "AI_ERROR", message: result.error }, { status: 500 });
    }

    if (teacherId) {
      await deductTeacherCredit(teacherId);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[API /api/ai/practice POST] Error:", error.message);
    return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  }
}
