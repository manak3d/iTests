import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Student } from "@/models/Student";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Hashování hesla žáka
    let hashedPassword = undefined;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }
    
    // Uložení žáka
    const newStudent = await Student.create({
      firstName: body.firstName,
      lastName: body.lastName,
      username: body.username,
      password: hashedPassword,
      classroomId: body.classroomId,
      email: body.email || undefined // nepovinné
    });

    // Přidání ID žáka do třídy
    const { Classroom } = require('@/models/Classroom');
    if (body.classroomId) {
      await Classroom.findByIdAndUpdate(body.classroomId, {
        $push: { studentIds: newStudent._id }
      });
    }

    const studentData = newStudent.toObject();
    delete studentData.password;

    return NextResponse.json({ success: true, data: studentData }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
