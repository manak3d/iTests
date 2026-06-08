import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Feedback } from "@/models/Feedback";
import { getUserSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ success: false, error: "Obsah zpětné vazby nemůže být prázdný." }, { status: 400 });
    }

    const { Teacher } = await import("@/models/Teacher");
    const teacherObj = await Teacher.findOne({ _id: session.id });
    const teacherEmail = teacherObj?.email || `${session.username}@itests.cz`;
    const schoolId = teacherObj?.schoolId || session.schoolId || "";

    const newFeedback = await Feedback.create({
      teacherId: session.id,
      teacherName: session.name || session.username || "Učitel",
      teacherEmail: teacherEmail,
      schoolId: schoolId,
      content: body.content.trim(),
    });

    return NextResponse.json({ success: true, data: newFeedback }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminReply } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Chybí ID zpětné vazby." }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (adminReply !== undefined) updateData.adminReply = adminReply;

    const updatedFeedback = await Feedback.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedFeedback) {
      return NextResponse.json({ success: false, error: "Zpětná vazba nebyla nalezena." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedFeedback });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Chybí ID zpětné vazby." }, { status: 400 });
    }

    const deleted = await Feedback.deleteOne({ _id: id });
    if (deleted.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Zpětná vazba nebyla nalezena." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
