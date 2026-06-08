import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Classroom } from "@/models/Classroom";
import { Student } from "@/models/Student";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Teacher } from "@/models/Teacher";
import { getUserSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const body = await request.json();
    let schoolId = session.role === "admin" ? body.schoolId : session.schoolId;

    // Pokud chybí ID školy (např. u admina), zkusíme ho dohledat z učitele
    if (!schoolId && (body.teacherId || session.id)) {
      const teacher = await Teacher.findOne({ _id: body.teacherId || session.id });
      if (teacher) {
        schoolId = teacher.schoolId;
      }
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: "Chybí ID školy." }, { status: 400 });
    }

    if (session.role === "teacher") {
      const teacher = await Teacher.findOne({ _id: body.teacherId || session.id });
      if (teacher) {
        const now = new Date();
        const isPremium = teacher.isPremium && (!teacher.premiumExpiresAt || new Date(teacher.premiumExpiresAt) > now);
        
        if (!isPremium) {
          const trialDurationMs = 90 * 24 * 60 * 60 * 1000;
          const timeSinceCreation = now.getTime() - new Date(teacher.createdAt).getTime();
          if (timeSinceCreation > trialDurationMs) {
            return NextResponse.json({ success: false, error: "Vaše 3měsíční zkušební doba vypršela. Aktivujte si prosím Premium pro vytváření dalších tříd." }, { status: 403 });
          }
          
          const classCount = await Classroom.countDocuments({ teacherId: body.teacherId || session.id });
          if (classCount >= 2) {
            return NextResponse.json({ success: false, error: "Zkušební verze má limit maximálně 2 třídy. Pro vytvoření další aktivujte Premium." }, { status: 403 });
          }
        } else if (teacher.premiumType === 'monthly') {
          const classCount = await Classroom.countDocuments({ teacherId: body.teacherId || session.id });
          if (classCount >= 8) {
            return NextResponse.json({ success: false, error: "Měsíční Premium verze má limit maximálně 8 tříd. Pro vytvoření dalších aktivujte roční Premium nebo Školní licenci." }, { status: 403 });
          }
        }
      }
    }

    // Uložení třídy do DB
    const newClassroom = await Classroom.create({
      _id: body.id,
      name: body.name,
      teacherId: body.teacherId || session.id,
      year: new Date().getFullYear(),
      schoolId: schoolId,
    });

    return NextResponse.json({ success: true, data: newClassroom }, { status: 201 });
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

    const body = await request.json();
    
    const updateData: any = {};
    if (body.teacherId !== undefined) updateData.teacherId = body.teacherId;
    if (body.name !== undefined) updateData.name = body.name;

    const filter = session.role === "admin" ? { _id: body.id } : { _id: body.id, schoolId: session.schoolId };

    const updated = await Classroom.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Třída nebyla nalezena nebo na ni nemáte práva." }, { status: 404 });
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
      return NextResponse.json({ success: false, error: "Missing classroom ID" }, { status: 400 });
    }

    // Ověření, že třída patří k dané škole
    const classroom = await Classroom.findOne(
      session.role === "admin" ? { _id: id } : { _id: id, schoolId: session.schoolId }
    );

    if (!classroom) {
      return NextResponse.json({ success: false, error: "Třída nebyla nalezena nebo na ni nemáte práva." }, { status: 404 });
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
