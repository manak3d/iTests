import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Submission } from "@/models/Submission";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const newSubmission = await Submission.create({
      _id: body.id,
      assignmentId: body.assignmentId,
      studentId: body.studentId,
      answers: body.answers || {},
      questionDrawings: body.questionDrawings || {},
      mainWorkDrawing: body.mainWorkDrawing,
      submittedAt: body.submittedAt,
      questionScores: body.questionScores || {},
    });

    return NextResponse.json({ success: true, data: newSubmission }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    if (!body.id) throw new Error("Missing submission ID");

    const updateObj: any = {
      feedback: body.feedback,
      questionScores: body.questionScores
    };

    if (body.grade === 0 || body.grade === null || body.grade === undefined) {
      updateObj.$unset = { grade: "" };
    } else {
      updateObj.grade = body.grade;
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      body.id,
      updateObj,
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedSubmission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
