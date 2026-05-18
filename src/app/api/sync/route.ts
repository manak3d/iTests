import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Classroom } from "@/models/Classroom";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";

export async function GET() {
  try {
    await dbConnect();
    
    // Automatické čistenie databázy - vymazanie dát starších ako 30 dní
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 30);

    // Vymažeme staré odovzdané práce aj samotné zadania testov staršie ako 30 dní
    await Submission.deleteMany({ createdAt: { $lt: limitDate } });
    await Assignment.deleteMany({ createdAt: { $lt: limitDate } });

    // Načteme všechna data z MongoDB
    const teachers = await Teacher.find({}).lean();
    const students = await Student.find({}).lean();
    const classes = await Classroom.find({}).lean();
    const assignments = await Assignment.find({}).lean();
    const submissions = await Submission.find({}).lean();

    // Sjednotíme učitele a žáky do jednoho pole "users", aby to sedělo s původním frontendem
    const users = [
      ...teachers.map(t => ({ id: t._id, name: `${t.firstName} ${t.lastName}`, username: t.username, role: t.role })),
      ...students.map(s => ({ id: s._id, name: `${s.firstName} ${s.lastName}`, username: s.username, role: s.role, classId: s.classroomId }))
    ];

    // Přemapování _id na id pro frontend
    const mappedClasses = classes.map(c => ({ ...c, id: c._id }));
    const mappedAssignments = assignments.map(a => ({ ...a, id: a._id }));
    const mappedSubmissions = submissions.map(s => ({ ...s, id: s._id }));

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
