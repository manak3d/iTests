import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
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
