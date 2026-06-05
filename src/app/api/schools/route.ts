import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { School } from "@/models/School";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Classroom } from "@/models/Classroom";
import { getUserSession } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    if (session.role === "admin") {
      const schools = await School.find({}).lean();
      const teachers = await Teacher.find({}).lean();
      const students = await Student.find({}).lean();
      const classrooms = await Classroom.find({}).lean();

      const schoolsWithStats = schools.map((s) => {
        const schoolIdStr = s._id.toString();
        return {
          ...s,
          id: schoolIdStr,
          teacherCount: teachers.filter((t) => t.schoolId === schoolIdStr).length,
          studentCount: students.filter((st) => st.schoolId === schoolIdStr).length,
          classCount: classrooms.filter((c) => c.schoolId === schoolIdStr).length,
        };
      });

      return NextResponse.json({ success: true, schools: schoolsWithStats });
    } else {
      const schools = await School.find({}).lean();
      const schoolsMapped = schools.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        inviteCode: s.inviteCode,
      }));
      return NextResponse.json({ success: true, schools: schoolsMapped });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const { name, inviteCode } = await request.json();
    if (!name || !inviteCode) {
      return NextResponse.json({ success: false, error: "Zadejte název školy a zvací kód." }, { status: 400 });
    }

    const codeClean = inviteCode.trim().toLowerCase();

    // Kontrola duplicity kódu
    const existing = await School.findOne({ inviteCode: codeClean });
    if (existing) {
      return NextResponse.json({ success: false, error: "Tento zvací kód již používá jiná škola." }, { status: 400 });
    }

    const newSchool = await School.create({
      name: name.trim(),
      inviteCode: codeClean,
    });

    return NextResponse.json({ success: true, school: newSchool }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
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
      return NextResponse.json({ success: false, error: "Missing school ID" }, { status: 400 });
    }

    await School.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
