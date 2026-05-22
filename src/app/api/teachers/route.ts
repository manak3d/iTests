import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Classroom } from "@/models/Classroom";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Kontrola, zda uživatelské jméno již neexistuje mezi žáky (globální unikátnost loginu)
    const existingStudent = await Student.findOne({ username: body.username });
    if (existingStudent) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }

    // Kontrola, zda uživatelské jméno již neexistuje mezi učiteli
    const existingTeacher = await Teacher.findOne({ username: body.username });
    if (existingTeacher) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }
    
    // Hashování hesla
    let hashedPassword = undefined;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }
    
    const newTeacher = await Teacher.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      username: body.username,
      password: hashedPassword,
      subjects: Array.isArray(body.subjects) ? body.subjects : (body.subjects ? body.subjects.split(',').map((s: string) => s.trim()) : []),
    });

    // Nechceme vracet heslo v odpovědi
    const teacherData = newTeacher.toObject();
    delete teacherData.password;

    return NextResponse.json({ success: true, data: teacherData }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Tento uživatel (nebo e-mail) již existuje." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing teacher ID" }, { status: 400 });
    }

    const teacher = await Teacher.findOne({ _id: id });
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    // 1. U tříd spravovaných tímto učitelem nastavíme teacherId na "" (nezařazeno), aby je mohli převzít jiní učitelé
    await Classroom.updateMany({ teacherId: id }, { $set: { teacherId: "" } });

    // 2. Smazání samotného učitele
    await Teacher.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

