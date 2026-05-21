import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Vyplňte uživatelské jméno a heslo" }, { status: 400 });
    }

    if (role === 'teacher') {
      // Protože je heslo chráněno (select: false), musíme si o něj při loginu výslovně říct pomocí .select('+password')
      const teacher = await Teacher.findOne({ username }).select('+password');
      if (!teacher || !teacher.password) {
        return NextResponse.json({ success: false, error: "Uživatel nenalezen nebo nemá nastavené heslo" }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(password, teacher.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, error: "Nesprávné heslo" }, { status: 401 });
      }

      // Vytvoření JWT tokenu
      const secret = process.env.JWT_SECRET || "default_secret_key";
      const token = jwt.sign(
        { id: teacher._id, username: teacher.username, role: teacher.role, name: `${teacher.firstName} ${teacher.lastName}` },
        secret,
        { expiresIn: "1d" }
      );

      // Nastavení cookie
      const cookieStore = await cookies();
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 den
        path: "/",
      });

      return NextResponse.json({ success: true, user: { id: teacher._id, username: teacher.username, role: teacher.role, name: `${teacher.firstName} ${teacher.lastName}` } });
    } else if (role === 'student') {
      const student = await Student.findOne({ username }).select('+password');
      if (!student || !student.password) {
        return NextResponse.json({ success: false, error: "Žák nenalezen nebo nemá nastavené heslo" }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, error: "Nesprávné heslo" }, { status: 401 });
      }

      const secret = process.env.JWT_SECRET || "default_secret_key";
      const token = jwt.sign(
        { id: student._id, username: student.username, role: student.role, name: `${student.firstName} ${student.lastName}` },
        secret,
        { expiresIn: "1d" }
      );

      const cookieStore = await cookies();
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 den
        path: "/",
      });

      return NextResponse.json({ success: true, user: { id: student._id, username: student.username, role: student.role, name: `${student.firstName} ${student.lastName}`, classId: student.classroomId } });
    } else {
      return NextResponse.json({ success: false, error: "Neplatná role" }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
