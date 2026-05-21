import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Kontrola, zda uživatelské jméno již neexistuje mezi učiteli (globální unikátnost loginu)
    const existingTeacher = await Teacher.findOne({ username: body.username });
    if (existingTeacher) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }
    
    // Hashování hesla žáka
    let hashedPassword = undefined;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }
    
    // Uložení žáka
    const newStudent = await Student.create({
      _id: body.id, // Podpora pro přenos ID z frontendu
      firstName: body.firstName,
      lastName: body.lastName,
      username: body.username,
      password: hashedPassword,
      passwordPlain: body.password, // Plain text password for teacher/admin visibility
      classroomId: body.classroomId,
      email: body.email || undefined // nepovinné
    });

    // Přidání ID žáka do třídy
    const { Classroom } = require('@/models/Classroom');
    if (body.classroomId) {
      await Classroom.findOneAndUpdate(
        { _id: body.classroomId },
        { $push: { studentIds: newStudent._id } }
      );
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

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const oldStudent = await Student.findOne({ _id: body.id });
    if (!oldStudent) {
      return NextResponse.json({ success: false, error: "Žák nebyl nalezen." }, { status: 404 });
    }
    
    const updateData: any = {};
    
    // Support classroom change
    let oldClassId = oldStudent.classroomId;
    if (body.classId !== undefined) {
      updateData.classroomId = body.classId;
    }
    
    // Support password change
    if (body.password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(body.password, salt);
      updateData.passwordPlain = body.password;
    }
    
    const updatedStudent = await Student.findOneAndUpdate(
      { _id: body.id },
      { $set: updateData },
      { new: true }
    );
    
    // Handle classroom array updates in Classroom model if classId changed
    if (body.classId !== undefined && body.classId !== oldClassId) {
      const { Classroom } = require('@/models/Classroom');
      // Remove from old class
      if (oldClassId) {
        await Classroom.findOneAndUpdate(
          { _id: oldClassId },
          { $pull: { studentIds: body.id } }
        );
      }
      // Add to new class
      if (body.classId) {
        await Classroom.findOneAndUpdate(
          { _id: body.classId },
          { $addToSet: { studentIds: body.id } }
        );
      }
    }
    
    return NextResponse.json({ success: true, data: updatedStudent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
