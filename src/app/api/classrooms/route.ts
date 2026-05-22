import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Classroom } from "@/models/Classroom";
import { Student } from "@/models/Student";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Uložení třídy do DB
    const newClassroom = await Classroom.create({
      _id: body.id,
      name: body.name,
      teacherId: body.teacherId,
      year: new Date().getFullYear()
    });

    return NextResponse.json({ success: true, data: newClassroom }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const updateData: any = {};
    if (body.teacherId !== undefined) updateData.teacherId = body.teacherId;
    if (body.name !== undefined) updateData.name = body.name;

    const updated = await Classroom.findOneAndUpdate(
      { _id: body.id },
      { $set: updateData },
      { new: true }
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing classroom ID" }, { status: 400 });
    }

    // 1. Získání seznamu studentů a zadání v této třídě pro následné promazání submission
    const studentsInClass = await Student.find({ classroomId: id }).select("_id");
    const studentIds = studentsInClass.map(s => s._id.toString());

    const assignmentsInClass = await Assignment.find({ classId: id }).select("_id");
    const assignmentIds = assignmentsInClass.map(a => a._id.toString());

    // 2. Smazání všech odevzdaných prací (submissions)
    await Submission.deleteMany({
      $or: [
        { studentId: { $in: studentIds } },
        { assignmentId: { $in: assignmentIds } }
      ]
    } as any);

    // 3. Smazání všech zadání (assignments) této třídy
    await Assignment.deleteMany({ classId: id });

    // 4. Smazání všech studentů (students) této třídy
    await Student.deleteMany({ classroomId: id });

    // 5. Smazání samotné třídy (classroom)
    await Classroom.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

