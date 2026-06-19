import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { getUserSession } from "@/lib/auth";
import { z } from "zod";

const assignmentPostSchema = z.object({
  id: z.string().min(1, "Chybí ID zadání."),
  title: z.string().min(1, "Chybí název testu."),
  description: z.string().optional(),
  classId: z.string().min(1, "Chybí ID třídy."),
  teacherId: z.string().optional(),
  subject: z.string().optional(),
  questions: z.array(z.any()).optional().default([]),
  dueDate: z.string().optional(),
  fileUri: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  sharedWithClassIds: z.array(z.string()).optional(),
  gradeThresholds: z.array(z.any()).optional(),
  isDraft: z.boolean().optional(),
  isPublicTemplate: z.boolean().optional(),
  timeLimit: z.number().optional(),
  isPractice: z.boolean().optional(),
  schoolId: z.string().optional(),
});

const assignmentPutSchema = z.object({
  id: z.string().min(1, "Chybí ID."),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  studentIds: z.array(z.string()).optional(),
  sharedWithClassIds: z.array(z.string()).optional(),
  gradeThresholds: z.array(z.any()).optional(),
  isDraft: z.boolean().optional(),
  isPublicTemplate: z.boolean().optional(),
  timeLimit: z.number().optional(),
  isPractice: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = assignmentPostSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Neplatná data", details: parseResult.error.errors }, { status: 400 });
    }
    const body = parseResult.data;

    const schoolId = session.role === "admin" ? body.schoolId : session.schoolId;

    if (!schoolId) {
      return NextResponse.json({ success: false, error: "Chybí ID školy." }, { status: 400 });
    }

    console.log("[API /assignments POST] Received body keys:", Object.keys(body));
    console.log("[API /assignments POST] id:", body.id, "title:", body.title, "classId:", body.classId, "dueDate:", body.dueDate);

    const newAssignment = await Assignment.create({
      _id: body.id,
      title: body.title,
      description: body.description || "",
      classId: body.classId,
      teacherId: body.teacherId || session.id, // Uložení vazby na učitele
      subject: body.subject || "Jiný",
      questions: body.questions || [],
      dueDate: body.dueDate,
      fileUri: body.fileUri,
      startTime: body.startTime || undefined,
      endTime: body.endTime || undefined,
      studentIds: body.studentIds || [],
      sharedWithClassIds: body.sharedWithClassIds || [],
      gradeThresholds: body.gradeThresholds || undefined,
      isDraft: body.isDraft === true, // false = publikováno, true = koncept
      isPublicTemplate: body.isPublicTemplate === true,
      timeLimit: typeof body.timeLimit === 'number' ? body.timeLimit : 0,
      isPractice: body.isPractice === true,
      schoolId: schoolId,
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error: any) {
    console.error("[API /assignments POST] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const rawBody = await request.json();
    const parseResult = assignmentPutSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Neplatná data", details: parseResult.error.errors }, { status: 400 });
    }
    const body = parseResult.data;
    const { id, startTime, endTime, studentIds, sharedWithClassIds, gradeThresholds, isDraft, isPublicTemplate, timeLimit, isPractice } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing assignment ID" }, { status: 400 });
    }

    const filter = session.role === "admin" ? { _id: id } : { _id: id, schoolId: session.schoolId };

    const updated = await Assignment.findOneAndUpdate(
      filter,
      {
        $set: {
          startTime: startTime !== undefined ? (startTime || undefined) : undefined,
          endTime: endTime !== undefined ? (endTime || undefined) : undefined,
          studentIds: studentIds !== undefined ? (studentIds || []) : undefined,
          sharedWithClassIds: sharedWithClassIds !== undefined ? (sharedWithClassIds || []) : undefined,
          gradeThresholds: gradeThresholds || undefined,
          ...(isDraft !== undefined ? { isDraft } : {}),
          ...(isPublicTemplate !== undefined ? { isPublicTemplate } : {}),
          ...(timeLimit !== undefined ? { timeLimit: typeof timeLimit === 'number' ? timeLimit : 0 } : {}),
          ...(isPractice !== undefined ? { isPractice } : {})
        }
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Zadání nebylo nalezeno nebo na něj nemáte práva." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing assignment ID" }, { status: 400 });
    }

    const filter = session.role === "admin" ? { _id: id } : { _id: id, schoolId: session.schoolId };
    const assignment = await Assignment.findOne(filter);
    if (!assignment) {
      return NextResponse.json({ success: false, error: "Zadání nebylo nalezeno nebo na něj nemáte práva." }, { status: 404 });
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
