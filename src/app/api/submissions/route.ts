import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Submission } from "@/models/Submission";
import { getUserSession } from "@/lib/auth";
import { z } from "zod";

const submissionPostSchema = z.object({
  id: z.string().optional(),
  assignmentId: z.string().min(1, "Chybí ID zadání."),
  studentId: z.string().optional(),
  schoolId: z.string().optional(),
  answers: z.record(z.any()).optional().default({}),
  questionDrawings: z.record(z.any()).optional().default({}),
  mainWorkDrawing: z.string().nullable().optional(),
  submittedAt: z.string().optional(),
  startedAt: z.string().optional(),
  questionScores: z.record(z.number()).optional(),
  questionFeedback: z.record(z.string()).optional(),
  feedback: z.string().optional(),
  tabFocusLostCount: z.number().optional(),
  lastActiveAt: z.string().optional(),
});

const submissionPutSchema = z.object({
  id: z.string().min(1, "Chybí ID."),
  feedback: z.string().optional(),
  questionScores: z.record(z.number()).optional(),
  grade: z.number().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Nepřihlášený uživatel." }, { status: 401 });
    }

    const rawBody = await request.json();
    const parseResult = submissionPostSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Neplatná data", details: parseResult.error.errors }, { status: 400 });
    }
    const body = parseResult.data;

    const schoolId = session.role === "admin" ? body.schoolId : session.schoolId;

    if (!schoolId) {
      return NextResponse.json({ success: false, error: "Chybí ID školy." }, { status: 400 });
    }

    const submissionId = body.id || (body.assignmentId + "-" + (body.studentId || session.id));

    const updateData: any = {
      assignmentId: body.assignmentId,
      studentId: body.studentId || session.id,
      answers: body.answers || {},
      questionDrawings: body.questionDrawings || {},
      mainWorkDrawing: body.mainWorkDrawing,
      submittedAt: body.submittedAt !== undefined ? body.submittedAt : "",
      schoolId: schoolId,
    };

    if (body.startedAt !== undefined) {
      updateData.startedAt = body.startedAt;
    }
    if (body.questionScores !== undefined) {
      updateData.questionScores = body.questionScores;
    }
    if (body.questionFeedback !== undefined) {
      updateData.questionFeedback = body.questionFeedback;
    }
    if (body.feedback !== undefined) {
      updateData.feedback = body.feedback;
    }
    if (body.tabFocusLostCount !== undefined) {
      updateData.tabFocusLostCount = body.tabFocusLostCount;
    }
    if (body.lastActiveAt !== undefined) {
      updateData.lastActiveAt = body.lastActiveAt;
    }

    // Ochrana proti přepsání odevzdaného/oznámkovaného testu konceptem (draftem)
    const existing = await Submission.findById(submissionId);
    if (existing && existing.submittedAt) {
      // Pokud je již odevzdáno, zachováme čas odevzdání
      updateData.submittedAt = existing.submittedAt;
      
      // Pokud je odevzdáno a snažíme se uložit draft (submittedAt je prázdné),
      // nepovolíme přepsání odpovědí, výkresů ani známek
      if (!body.submittedAt || body.submittedAt === "") {
        updateData.answers = existing.answers;
        updateData.questionDrawings = existing.questionDrawings;
        updateData.mainWorkDrawing = existing.mainWorkDrawing;
        
        if (existing.grade !== undefined && existing.grade !== null) {
          updateData.grade = existing.grade;
        }
        if (existing.feedback !== undefined) {
          updateData.feedback = existing.feedback;
        }
        if (existing.questionScores) {
          updateData.questionScores = existing.questionScores;
        }
        if (existing.questionFeedback) {
          updateData.questionFeedback = existing.questionFeedback;
        }
      }
    }

    const newSubmission = await Submission.findOneAndUpdate(
      { _id: submissionId },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: newSubmission }, { status: 201 });
  } catch (error: any) {
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
    const parseResult = submissionPutSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Neplatná data", details: parseResult.error.errors }, { status: 400 });
    }
    const body = parseResult.data;
    
    if (!body.id) throw new Error("Missing submission ID");

    const updateQuery: any = {
      $set: {
        feedback: body.feedback,
        questionScores: body.questionScores
      }
    };

    if (body.grade === 0 || body.grade === null || body.grade === undefined) {
      updateQuery.$unset = { grade: "" };
    } else {
      updateQuery.$set.grade = body.grade;
    }

    const filter = session.role === "admin" ? { _id: body.id } : { _id: body.id, schoolId: session.schoolId };

    const updatedSubmission = await Submission.findOneAndUpdate(
      filter,
      updateQuery,
      { new: true }
    );

    if (!updatedSubmission) {
      return NextResponse.json({ success: false, error: "Odevzdaná práce nebyla nalezena nebo na ni nemáte práva." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSubmission });
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
      return NextResponse.json({ success: false, error: "Chybí ID odevzdání." }, { status: 400 });
    }

    const filter = session.role === "admin" ? { _id: id } : { _id: id, schoolId: session.schoolId };
    const deleted = await Submission.findOneAndDelete(filter);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Odevzdaná práce nebyla nalezena nebo na ni nemáte práva." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
