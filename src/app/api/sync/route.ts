import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Classroom } from "@/models/Classroom";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Feedback } from "@/models/Feedback";
import { AiLog } from "@/models/AiLog";

import { getUserSession } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ 
        success: true, 
        users: [], 
        classes: [], 
        assignments: [], 
        submissions: [],
        feedbacks: [],
        aiLogs: []
      });
    }

    // Check and refill credits if reset date has passed
    if (session.role === 'teacher') {
      const currentTeacher = await Teacher.findOne({ _id: session.id });
      if (currentTeacher && currentTeacher.isPremium && currentTeacher.premiumExpiresAt && new Date(currentTeacher.premiumExpiresAt) > new Date()) {
        const now = new Date();
        if (!currentTeacher.aiCreditsResetDate) {
          const nextReset = new Date();
          nextReset.setMonth(nextReset.getMonth() + 1);
          currentTeacher.aiCreditsResetDate = nextReset;
          await currentTeacher.save();
        } else if (now >= new Date(currentTeacher.aiCreditsResetDate)) {
          const maxCredits = currentTeacher.premiumType === 'yearly' ? 400 : currentTeacher.premiumType === 'school' ? 1000 : 200;
          const extraCredits = currentTeacher.aiExtraCredits || 0;
          
          let nextReset = new Date(currentTeacher.aiCreditsResetDate);
          while (nextReset <= now) {
            nextReset.setMonth(nextReset.getMonth() + 1);
          }
          
          currentTeacher.aiCredits = maxCredits + extraCredits;
          currentTeacher.aiCreditsMax = maxCredits;
          currentTeacher.aiCreditsResetDate = nextReset;
          await currentTeacher.save();
        }
      }
    }
    
    // Automatické čištění databáze - smazání žákovských odevzdání (Submission) vždy 30. srpna, 2 roky po uložení
    // Zadání testů (Assignment) od učitelů ponecháváme
    const now = new Date();
    const currentYear = now.getFullYear();
    const august30ThisYear = new Date(currentYear, 7, 30); // 30. srpna (0-indexed, 7 = srpen)

    const thresholdYear = now >= august30ThisYear ? (currentYear - 1) : (currentYear - 2);
    const limitDate = new Date(thresholdYear, 0, 1); // 1. ledna hraničního roku

    await Submission.deleteMany({ createdAt: { $lt: limitDate } });

    let teachers: any[] = [];
    let students: any[] = [];
    let classes: any[] = [];
    let assignments: any[] = [];
    let submissions: any[] = [];
    let feedbacks: any[] = [];
    let aiLogs: any[] = [];

    if (session.role === 'admin') {
      // Admin vidí všechno ze všech škol
      teachers = await Teacher.find({}).lean();
      students = await Student.find({}).lean();
      classes = await Classroom.find({}).lean();
      assignments = await Assignment.find({}).lean();
      submissions = await Submission.find({}).lean();
      feedbacks = await Feedback.find({}).sort({ createdAt: -1 }).lean();
      aiLogs = await AiLog.find({}).sort({ createdAt: -1 }).lean();
    } else {
      // Běžný učitel / student vidí jen data své školy
      const schoolId = session.schoolId || "";
      teachers = await Teacher.find({ schoolId }).lean();
      students = await Student.find({ schoolId }).lean();
      classes = await Classroom.find({ schoolId }).lean();
      if (session.role === 'teacher') {
        assignments = await Assignment.find({
          $or: [
            { schoolId },
            { isPublicTemplate: true }
          ]
        }).lean();
        feedbacks = await Feedback.find({ teacherId: session.id }).sort({ createdAt: -1 }).lean();
        aiLogs = await AiLog.find({ teacherId: session.id }).sort({ createdAt: -1 }).lean();
      } else {
        assignments = await Assignment.find({ schoolId }).lean();
      }

      if (session.role === 'student') {
        // Student vidí pouze své vlastní odevzdané práce
        submissions = await Submission.find({ schoolId, studentId: session.id }).lean();
      } else {
        // Učitel vidí všechny odevzdané práce své školy
        submissions = await Submission.find({ schoolId }).lean();
      }
    }

    // Sjednotíme učitele a žáky do jednoho pole "users", aby to sedělo s původním frontendem
    const users = [
      ...teachers.map(t => ({
        id: t._id,
        name: `${t.firstName} ${t.lastName}`,
        username: t.username,
        role: t.role,
        schoolId: t.schoolId,
        isPremium: t.isPremium,
        premiumExpiresAt: t.premiumExpiresAt,
        createdAt: t.createdAt,
        password: t.passwordPlain,
        aiCredits: t.aiCredits,
        aiCreditsMax: t.aiCreditsMax,
        aiExtraCredits: t.aiExtraCredits,
        premiumType: t.premiumType,
        aiCreditsResetDate: t.aiCreditsResetDate
      })),
      ...students.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, username: s.username, role: s.role, classId: s.classroomId, password: s.passwordPlain, schoolId: s.schoolId }))
    ];

    // Přemapování _id na id pro frontend
    const mappedClasses = classes.map(c => ({ ...c, id: c._id }));
    const mappedAssignments = assignments.map(a => ({ ...a, id: a._id }));
    const mappedFeedbacks = feedbacks.map(f => ({ ...f, id: f._id }));
    const mappedAiLogs = aiLogs.map(l => ({ ...l, id: l._id }));
    // Helper: Mongoose Map → plain object
    const mapToObj = (m: any): Record<string, any> => {
      if (!m) return {};
      if (m instanceof Map) return Object.fromEntries(m);
      if (typeof m === 'object') return m;
      return {};
    };

    const mappedSubmissions = submissions.map(s => ({
      ...s,
      id: s._id,
      answers: mapToObj((s as any).answers),
      questionDrawings: mapToObj((s as any).questionDrawings),
      questionScores: mapToObj((s as any).questionScores),
    }));

    return NextResponse.json({ 
      success: true, 
      users, 
      classes: mappedClasses, 
      assignments: mappedAssignments, 
      submissions: mappedSubmissions,
      feedbacks: mappedFeedbacks,
      aiLogs: mappedAiLogs
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
