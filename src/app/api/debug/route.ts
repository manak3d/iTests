import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";

export async function GET() {
  try {
    await dbConnect();
    const assignments = await Assignment.find({}).lean();
    const result = assignments.map((a: any) => ({
      id: a._id,
      title: a.title,
      questions: a.questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        clozeText: q.clozeText,
        options: q.options
      }))
    }));
    return NextResponse.json({ success: true, assignments: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
