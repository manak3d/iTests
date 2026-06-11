import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Classroom } from "@/models/Classroom";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { School } from "@/models/School";
import { getUserSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    let schoolId = "";

    if (body.isTrialRegistration) {
      const randomId = Math.floor(100 + Math.random() * 900);
      const trialSchool = await School.create({
        name: `Zkušební škola - ${body.firstName} ${body.lastName}`,
        inviteCode: `zkouska-${body.username.toLowerCase().trim()}-${randomId}`,
      });
      schoolId = trialSchool._id.toString();
    } else {
      const inviteCode = body.inviteCode;
      if (!inviteCode) {
        return NextResponse.json({ success: false, error: "Zadejte kód školy (zvací kód)." }, { status: 400 });
      }

      const school = await School.findOne({ inviteCode: inviteCode.trim().toLowerCase() });
      if (!school) {
        return NextResponse.json({ success: false, error: "Zadaný kód školy není platný." }, { status: 400 });
      }
      schoolId = school._id.toString();
    }

    // Kontrola, zda uživatelské jméno již neexistuje mezi žáky (globální unikátnost loginu)
    const existingStudent = await Student.findOne({ username: body.username });
    if (existingStudent) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }

    // Kontrola, zda uživatelské jméno již neexistuje mezi učiteli
    const existingTeacher = await Teacher.findOne({ username: body.username });
    if (existingTeacher) {
      return NextResponse.json({ success: false, error: "Tento uživatel (login) již existuje." }, { status: 400 });
    }
    
    // Hashování hesla
    let hashedPassword = undefined;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }
    
    const newTeacher = await Teacher.create({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      username: body.username,
      password: hashedPassword,
      passwordPlain: body.password,
      subjects: Array.isArray(body.subjects) ? body.subjects : (body.subjects ? body.subjects.split(',').map((s: string) => s.trim()) : []),
      schoolId: schoolId,
      aiCredits: 30,
      aiCreditsMax: 30,
      aiExtraCredits: 0,
      premiumType: "trial",
      aiCreditsResetDate: null
    });

    // Nechceme vracet heslo v odpovědi
    const teacherData = newTeacher.toObject();
    delete teacherData.password;

    return NextResponse.json({ success: true, data: teacherData }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Tento uživatel (nebo e-mail) již existuje." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing teacher ID" }, { status: 400 });
    }

    const teacher = await Teacher.findOne({ _id: id });
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    // 1. U tříd spravovaných tímto učitelem nastavíme teacherId na "" (nezařazeno), aby je mohli převzít jiní učitelé
    await Classroom.updateMany({ teacherId: id }, { $set: { teacherId: "" } });

    // 2. Smazání samotného učitele
    await Teacher.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
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

    if ((body.action === "activatePremium" || body.action === "deactivatePremium" || body.action === "addCredits") && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Pouze administrátor může spravovat předplatné a kredity." }, { status: 403 });
    }

    const teacherId = session.role === "admin" ? body.id : session.id;

    if (!teacherId) {
      return NextResponse.json({ success: false, error: "Chybí ID učitele." }, { status: 400 });
    }

    const teacher = await Teacher.findOne({ _id: teacherId }).select("+password");
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Učitel nebyl nalezen." }, { status: 404 });
    }

    const updateData: any = {};
    if (body.action === "activatePremium") {
      updateData.isPremium = true;
      const now = new Date();
      if (body.type === "yearly") {
        updateData.premiumExpiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        updateData.premiumType = "yearly";
        updateData.aiCreditsMax = 400;
        updateData.aiCredits = 400 + (teacher.aiExtraCredits || 0);
      } else if (body.type === "school") {
        updateData.premiumExpiresAt = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
        updateData.premiumType = "school";
        updateData.aiCreditsMax = 1000;
        updateData.aiCredits = 1000 + (teacher.aiExtraCredits || 0);
      } else {
        updateData.premiumExpiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        updateData.premiumType = "monthly";
        updateData.aiCreditsMax = 200;
        updateData.aiCredits = 200 + (teacher.aiExtraCredits || 0);
      }
      updateData.aiCreditsResetDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    } else if (body.action === "deactivatePremium") {
      updateData.isPremium = false;
      updateData.premiumExpiresAt = null;
      updateData.premiumType = "trial";
      updateData.aiCreditsMax = 30;
      updateData.aiCredits = 30;
      updateData.aiCreditsResetDate = null;
    } else if (body.action === "addCredits") {
      const creditsToAdd = body.amount || 50;
      updateData.aiExtraCredits = (teacher.aiExtraCredits || 0) + creditsToAdd;
      updateData.aiCredits = (teacher.aiCredits || 0) + creditsToAdd;
    } else {
      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.lastName !== undefined) updateData.lastName = body.lastName;
      if (body.subjects !== undefined) updateData.subjects = body.subjects;
      if (body.education !== undefined) updateData.education = body.education;
      if (body.yearsOfExperience !== undefined) updateData.yearsOfExperience = body.yearsOfExperience;
      
      if (body.password !== undefined) {
        if (!body.currentPassword) {
          return NextResponse.json({ success: false, error: "Pro změnu hesla musíte zadat stávající heslo." }, { status: 400 });
        }
        if (!teacher.password) {
          return NextResponse.json({ success: false, error: "Nelze ověřit stávající heslo." }, { status: 400 });
        }
        const isMatch = await bcrypt.compare(body.currentPassword, teacher.password);
        if (!isMatch) {
          return NextResponse.json({ success: false, error: "Stávající heslo je nesprávné." }, { status: 400 });
        }
        if (body.password.length < 6) {
          return NextResponse.json({ success: false, error: "Nové heslo musí mít alespoň 6 znaků." }, { status: 400 });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(body.password, salt);
        updateData.passwordPlain = body.password;
      }
      
      if (body.schoolName !== undefined && teacher.schoolId) {
        await School.updateOne({ _id: teacher.schoolId }, { $set: { name: body.schoolName } });
      }
    }

    const updatedTeacher = await Teacher.findOneAndUpdate(
      { _id: teacherId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedTeacher) {
      return NextResponse.json({ success: false, error: "Učitel nebyl nalezen při ukládání." }, { status: 404 });
    }

    const teacherData = updatedTeacher.toObject();
    delete teacherData.password;

    return NextResponse.json({ success: true, data: teacherData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

