import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { Submission } from "@/models/Submission";
import { Classroom } from "@/models/Classroom";
import { getUserSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getUserSession();

    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const body = await request.json();
    let schoolId = session.role === "admin" ? body.schoolId : session.schoolId;

    let classroom = null;
    if (body.classroomId) {
      classroom = await Classroom.findOne({ _id: body.classroomId });
      if (classroom && !schoolId) {
        schoolId = classroom.schoolId;
      }
    }

    if (!schoolId) {
      return NextResponse.json({ success: false, error: "Chybí ID školy." }, { status: 400 });
    }

    if (classroom) {
      const teacher = await Teacher.findOne({ _id: classroom.teacherId });
      if (teacher) {
        const now = new Date();
        const isPremium = teacher.isPremium && (!teacher.premiumExpiresAt || new Date(teacher.premiumExpiresAt) > now);
        
        if (!isPremium) {
          const trialDurationMs = 90 * 24 * 60 * 60 * 1000;
          const timeSinceCreation = now.getTime() - new Date(teacher.createdAt).getTime();
          if (timeSinceCreation > trialDurationMs) {
            return NextResponse.json({ success: false, error: "Zkušební doba učitele pro tuto třídu vypršela. Pro zápis dalších žáků je vyžadováno Premium." }, { status: 403 });
          }
          
          const studentCount = await Student.countDocuments({ classroomId: body.classroomId });
          if (studentCount >= 20) {
            return NextResponse.json({ success: false, error: "Zkušební verze má limit maximálně 20 žáků ve třídě. Pro přidání dalšího aktivujte Premium." }, { status: 403 });
          }
        }
      }
    }

    // Kontrola, zda uživatelské jméno již neexistuje mezi učiteli (globální unikátnost loginu)
    const existingTeacher = await Teacher.findOne({ username: body.username });
    if (existingTeacher) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }

    // Kontrola, zda uživatelské jméno již neexistuje mezi žáky
    const existingStudent = await Student.findOne({ username: body.username });
    if (existingStudent) {
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
      email: body.email || undefined, // nepovinné
      schoolId: schoolId,
    });

    // Přidání ID žáka do třídy
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
    const session = await getUserSession();

    if (!session || (session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Přístup odepřen." }, { status: 403 });
    }

    const body = await request.json();
    
    const filter = session.role === "admin" ? { _id: body.id } : { _id: body.id, schoolId: session.schoolId };
    const oldStudent = await Student.findOne(filter);
    
    if (!oldStudent) {
      return NextResponse.json({ success: false, error: "Žák nebyl nalezen nebo na něj nemáte práva." }, { status: 404 });
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
      filter,
      { $set: updateData },
      { new: true }
    );
    
    // Handle classroom array updates in Classroom model if classId changed
    if (body.classId !== undefined && body.classId !== oldClassId) {
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
      return NextResponse.json({ success: false, error: "Missing student ID" }, { status: 400 });
    }

    const filter = session.role === "admin" ? { _id: id } : { _id: id, schoolId: session.schoolId };
    const student = await Student.findOne(filter);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student nebyl nalezen nebo na něj nemáte práva." }, { status: 404 });
    }

    // 1. Odebrání žáka z pole studentIds v jeho třídě
    if (student.classroomId) {
      await Classroom.findOneAndUpdate(
        { _id: student.classroomId },
        { $pull: { studentIds: id } }
      );
    }

    // 2. Smazání všech odevzdaných prací (submissions) tohoto žáka
    await Submission.deleteMany({ studentId: id });

    // 3. Smazání samotného žáka
    await Student.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
