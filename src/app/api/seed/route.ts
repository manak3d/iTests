import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { School } from "@/models/School";
import { Teacher } from "@/models/Teacher";
import { Classroom } from "@/models/Classroom";
import { Student } from "@/models/Student";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    // 1. Vyčištění předchozích testovacích dat
    await School.deleteMany({});
    await Teacher.deleteMany({});
    await Classroom.deleteMany({});
    await Student.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});

    // 2. Vytvoření testovací školy
    const school = await School.create({
      name: "Základní škola Komenského",
      inviteCode: "testskola",
    });
    const schoolId = school._id.toString();

    // 3. Hashování hesel
    const teacherPasswordHash = await bcrypt.hash("heslo", 10);
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const studentPasswordHash1 = await bcrypt.hash("123456", 10);
    const studentPasswordHash2 = await bcrypt.hash("QWERT135", 10);

    // 4. Vytvoření testovacího učitele (testu)
    const teacher = await Teacher.create({
      firstName: "Jan",
      lastName: "Komenský",
      email: "jan.komensky@skola.cz",
      username: "testu",
      password: teacherPasswordHash,
      passwordPlain: "heslo",
      role: "teacher",
      subjects: ["Matematika", "Fyzika"],
      schoolId: schoolId,
      aiCredits: 30,
      aiCreditsMax: 30,
      aiExtraCredits: 0,
      premiumType: "trial",
      aiCreditsResetDate: null,
    });

    // 4.1. Vytvoření administrátora (v modelu Teacher s role: "admin", bez schoolId)
    const adminUser = await Teacher.create({
      firstName: "Hlavní",
      lastName: "Administrátor",
      email: "admin@itests.cz",
      username: "admin",
      password: adminPasswordHash,
      passwordPlain: "admin123",
      role: "admin",
      subjects: ["Všechny"],
    });

    // 5. Vytvoření testovací třídy
    const classroom = await Classroom.create({
      _id: "0.A",
      name: "0.A",
      teacherId: teacher._id.toString(),
      year: 2024,
      studentIds: ["tests1", "nina.sekerkova"],
      schoolId: schoolId,
    });

    // 6. Vytvoření testovacích žáků
    const student1 = await Student.create({
      _id: "tests1",
      firstName: "tests1",
      lastName: "Neznámé",
      email: "student1@zaci.cz",
      username: "tests1",
      password: studentPasswordHash1,
      passwordPlain: "123456",
      role: "student",
      classroomId: classroom._id.toString(),
      schoolId: schoolId,
    });

    const student2 = await Student.create({
      _id: "nina.sekerkova",
      firstName: "Nina",
      lastName: "Sekerková",
      email: "nina.sekerkova@zaci.cz",
      username: "nina.sekerkova",
      password: studentPasswordHash2,
      passwordPlain: "QWERT135",
      role: "student",
      classroomId: classroom._id.toString(),
      schoolId: schoolId,
    });

    return NextResponse.json({
      message: "Data byla úspěšně uložena do databáze!",
      data: {
        school,
        teacher,
        classroom,
        students: [student1, student2],
      },
    });
  } catch (error: any) {
    console.error("Chyba při ukládání dat do DB:", error);
    return NextResponse.json(
      { error: "Nepodařilo se uložit data do databáze", details: error.message },
      { status: 500 }
    );
  }
}
