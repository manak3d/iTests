import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { practiceFlow } from "@/ai/flows/practice-flow";

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized", message: "Pro přístup se musíte přihlásit." }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "AI_OFFLINE", 
        message: "AI asistent je momentálně offline (není nastaven API klíč)." 
      }, { status: 503 });
    }

    const body = await request.json();
    const { questionText, numQuestions } = body;

    if (!questionText) {
      return NextResponse.json({ error: "Missing parameter", message: "Chybí text původní otázky." }, { status: 400 });
    }

    const n = typeof numQuestions === 'number' ? numQuestions : 1;
    const result = await practiceFlow({ questionText, numQuestions: n });

    if ('error' in result) {
      return NextResponse.json({ error: "AI_ERROR", message: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[API /api/ai/practice POST] Error:", error.message);
    return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  }
}
