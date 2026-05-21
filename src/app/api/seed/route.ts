import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Classroom } from "@/models/Classroom";
import { Student } from "@/models/Student";

export async function GET() {
  try {
    // 1. Připojení k databázi
    await dbConnect();

    // 2. Vyčištění předchozích testovacích dat (volitelné, ale dobré pro testování)
    await Teacher.deleteMany({});
    await Classroom.deleteMany({});
    await Student.deleteMany({});

    // 3. Vytvoření testovacího učitele
    const teacher = await Teacher.create({
      firstName: "Jan",
      lastName: "Komenský",
      email: "jan.komensky@skola.cz",
      subjects: ["Matematika", "Fyzika"],
    });

    // 4. Vytvoření testovací třídy a přiřazení učitele
    const classroom = await Classroom.create({
      name: "9.A",
      teacherId: teacher._id.toString(),
      year: 2024,
    });

    // 5. Vytvoření testovacího žáka a přiřazení do třídy
    const student = await Student.create({
      firstName: "Petr",
      lastName: "Novák",
      email: "petr.novak@zaci.cz",
      classroomId: classroom._id.toString(),
    });

    return NextResponse.json({
      message: "Data byla úspěšně uložena do databáze!",
      data: {
        teacher,
        classroom,
        student,
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
