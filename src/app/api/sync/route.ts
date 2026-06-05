import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Classroom } from "@/models/Classroom";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";

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
        submissions: [] 
      });
    }
    
    // Automatické čistenie databázy - vymazanie dát starších ako 30 dní
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 30);

    // Vymažeme staré odovzdané práce aj samotné zadania testov staršie ako 30 dní
    await Submission.deleteMany({ createdAt: { $lt: limitDate } });
    await Assignment.deleteMany({ createdAt: { $lt: limitDate } });

    let teachers: any[] = [];
    let students: any[] = [];
    let classes: any[] = [];
    let assignments: any[] = [];
    let submissions: any[] = [];

    if (session.role === 'admin') {
      // Admin vidí všechno ze všech škol
      teachers = await Teacher.find({}).lean();
      students = await Student.find({}).lean();
      classes = await Classroom.find({}).lean();
      assignments = await Assignment.find({}).lean();
      submissions = await Submission.find({}).lean();
    } else {
      // Běžný učitel / student vidí jen data své školy
      const schoolId = session.schoolId || "";
      teachers = await Teacher.find({ schoolId }).lean();
      students = await Student.find({ schoolId }).lean();
      classes = await Classroom.find({ schoolId }).lean();
      assignments = await Assignment.find({ schoolId }).lean();

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
      ...teachers.map(t => ({ id: t._id, name: `${t.firstName} ${t.lastName}`, username: t.username, role: t.role, schoolId: t.schoolId, isPremium: t.isPremium, premiumExpiresAt: t.premiumExpiresAt, createdAt: t.createdAt })),
      ...students.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, username: s.username, role: s.role, classId: s.classroomId, password: s.passwordPlain, schoolId: s.schoolId }))
    ];

    // Přemapování _id na id pro frontend
    const mappedClasses = classes.map(c => ({ ...c, id: c._id }));
    const mappedAssignments = assignments.map(a => ({ ...a, id: a._id }));
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
      submissions: mappedSubmissions 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
