import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { Classroom } from "@/models/Classroom";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { firstName, lastName, username, password, joinCode } = body;

    if (!joinCode || !firstName || !lastName || !username || !password) {
      return NextResponse.json({ success: false, error: "Všechna pole (jméno, příjmení, uživatelské jméno, heslo a kód třídy) jsou povinná." }, { status: 400 });
    }

    // 1. Najít třídu podle joinCode
    const classroom = await Classroom.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!classroom) {
      return NextResponse.json({ success: false, error: "Třída se zadaným kódem nebyla nalezena. Zkontrolujte prosím kód." }, { status: 404 });
    }

    const schoolId = classroom.schoolId;
    const classroomId = classroom._id;

    // 2. Kontrola limitů učitele
    const teacher = await Teacher.findOne({ _id: classroom.teacherId });
    if (teacher) {
      const now = new Date();
      const isPremium = teacher.isPremium && (!teacher.premiumExpiresAt || new Date(teacher.premiumExpiresAt) > now);
      
      if (!isPremium) {
        const trialDurationMs = 90 * 24 * 60 * 60 * 1000;
        const timeSinceCreation = now.getTime() - new Date(teacher.createdAt).getTime();
        if (timeSinceCreation > trialDurationMs) {
          return NextResponse.json({ success: false, error: "Zkušební doba učitele pro tuto třídu vypršela. Zápis žáků není možný." }, { status: 403 });
        }
        
        const studentCount = await Student.countDocuments({ classroomId });
        if (studentCount >= 20) {
          return NextResponse.json({ success: false, error: "Zkušební verze má limit maximálně 20 žáků ve třídě. Zápis není možný." }, { status: 403 });
        }
      } else if (teacher.premiumType === 'monthly') {
        const teacherClassrooms = await Classroom.find({ teacherId: classroom.teacherId });
        const classIds = teacherClassrooms.map(c => c._id);
        const totalStudentsCount = await Student.countDocuments({ classroomId: { $in: classIds } });
        if (totalStudentsCount >= 100) {
          return NextResponse.json({ success: false, error: "Měsíční Premium verze učitele má limit maximálně 100 žáků. Zápis není možný." }, { status: 403 });
        }
      }
    }

    // 3. Kontrola unikátnosti uživatelského jména
    const existingTeacher = await Teacher.findOne({ username });
    if (existingTeacher) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }

    const existingStudent = await Student.findOne({ username });
    if (existingStudent) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }

    // 4. Hashování hesla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generovat náhodné Firebase-kompatibilní ID pro studenta
    const studentId = "student-" + Math.random().toString(36).substring(2, 15);

    // 5. Uložení studenta
    const newStudent = await Student.create({
      _id: studentId,
      firstName,
      lastName,
      username,
      password: hashedPassword,
      passwordPlain: password,
      classroomId,
      schoolId,
    });

    // 6. Přidání studentId do Classroom
    await Classroom.findOneAndUpdate(
      { _id: classroomId },
      { $push: { studentIds: studentId } }
    );

    const studentData = newStudent.toObject();
    delete studentData.password;

    return NextResponse.json({ success: true, data: studentData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
