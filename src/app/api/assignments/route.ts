import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    console.log("[API /assignments POST] Received body keys:", Object.keys(body));
    console.log("[API /assignments POST] id:", body.id, "title:", body.title, "classId:", body.classId, "dueDate:", body.dueDate);
    console.log("[API /assignments POST] description length:", body.description?.length ?? "N/A");
    console.log("[API /assignments POST] questions count:", body.questions?.length ?? 0);
    console.log("[API /assignments POST] fileUri length:", body.fileUri?.length ?? "N/A");

    const newAssignment = await Assignment.create({
      _id: body.id,
      title: body.title,
      description: body.description || "",
      classId: body.classId,
      teacherId: body.teacherId, // Uložení vazby na učitele
      subject: body.subject || "Jiný",
      questions: body.questions || [],
      dueDate: body.dueDate,
      fileUri: body.fileUri
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error: any) {
    console.error("[API /assignments POST] Error:", error.message);
    console.error("[API /assignments POST] Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing assignment ID" }, { status: 400 });
    }

    // Vymažeme samotné zadanie z MongoDB
    await Assignment.deleteOne({ _id: id });
    // Vymažeme všetky odevzdané odpovede k tomuto zadaniu
    await Submission.deleteMany({ assignmentId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
