import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Classroom } from "@/models/Classroom";

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
