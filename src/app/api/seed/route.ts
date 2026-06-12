import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { School } from "@/models/School";
import { Teacher } from "@/models/Teacher";
import { Classroom } from "@/models/Classroom";
import { Student } from "@/models/Student";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Feedback } from "@/models/Feedback";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    // 1. Vyčištění všech kolekcí v databázi
    console.log("Clearing all collections...");
    await School.deleteMany({});
    await Teacher.deleteMany({});
    await Classroom.deleteMany({});
    await Student.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Feedback.deleteMany({});

    // 2. Hashování nového hesla pro admina
    const adminPasswordHash = await bcrypt.hash("admin1234", 10);

    // 3. Vytvoření administrátora (v kolekci teachers s role: "admin")
    const adminUser = await Teacher.create({
      firstName: "Hlavní",
      lastName: "Administrátor",
      email: "admin@itests.cz",
      username: "admin",
      password: adminPasswordHash,
      passwordPlain: "admin1234",
      role: "admin",
      subjects: ["Všechny"],
    });

    return NextResponse.json({
      success: true,
      message: "Databáze byla kompletně smazána a byl vytvořen nový administrátorský účet!",
      data: {
        username: adminUser.username,
        role: adminUser.role,
        passwordPlain: adminUser.passwordPlain
      }
    });
  } catch (error: any) {
    console.error("Chyba při mazání a seeding dat do DB:", error);
    return NextResponse.json(
      { error: "Nepodařilo se vymazat a nasadit nová data do databáze", details: error.message },
      { status: 500 }
    );
  }
}
