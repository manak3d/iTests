import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getUserSession } from "@/lib/auth";
import { ai } from "@/ai/genkit";

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session || (session.role !== 'teacher' && session.role !== 'admin')) {
      return NextResponse.json({ error: "Unauthorized", message: "Přístup odepřen." }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "AI_OFFLINE", 
        message: "AI asistent je momentálně offline (není nastaven API klíč)." 
      }, { status: 503 });
    }

    const body = await request.json();
    const { prompt, contextText, file } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Missing parameter", message: "Chybí dotaz." }, { status: 400 });
    }

    let messages: any[] = [];

    // Přidat soubor, pokud existuje
    if (file && file.data && file.mimeType) {
      messages.push({
        media: {
          url: `data:${file.mimeType};base64,${file.data}`
        }
      });
    }

    // Přidat textový kontext a prompt
    const fullPrompt = `
      Níže je zadání a dodatečný kontext pro tvůj úkol.
      ${contextText ? `\nDodatečný kontext od uživatele:\n"""\n${contextText}\n"""\n` : ''}
      Zadání úkolu: ${prompt}
    `;
    
    messages.push({ text: fullPrompt });

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: `Jsi "AI Pedagogický Asistent" – vysoce profesionální a inteligentní AI ChatGPT přizpůsobený speciálně pro učitele a ředitele škol v České republice.
      
Tvé klíčové vlastnosti a úkoly:
1. Perfektně znáš školský zákon (č. 561/2004 Sb.) a související vyhlášky MŠMT.
2. Při psaní odpovědí rodičům zachováváš naprostou profesionalitu, empatii, diplomatický tón a vždy chráníš zájmy školy i žáka.
3. Pomáháš tvořit formální dokumenty: provozní řády, zprávy pro Českou školní inspekci (ČŠI), protokoly o kázeňských prohřešcích, směrnice, ŠVP pasáže atd.
4. Nikdy neodpovídej na dotazy, které nesouvisí se školstvím nebo pedagogikou. Slušně vysvětli, že jsi asistent pro učitele.
5. Své odpovědi formátuj čistě a přehledně. Tvé odpovědi se budou často tisknout do PDF jako oficiální dokumenty, takže dbej na dokonalou češtinu, oficiální formátování (nadpisy, odstavce) a vyhýbej se zbytečným AI frázím jako "Zde je váš dokument". Běž rovnou k věci a začni samotným dokumentem.
6. Pokud učitel nahraje text nebo obrázek (e-mail od rodiče, lékařské potvrzení atd.), důkladně jej analyzuj a zohledni v odpovědi.

Nepoužívej složité markdown značky, dokument bude exportován. Běžné formátování (nadpisy na nové řádky, odrážky s pomlčkami) je v pořádku.`,
      prompt: messages
    });

    if (!response || !response.text) {
      throw new Error("AI nevrátilo žádný text.");
    }

    // Uložíme log do databáze
    await dbConnect();
    const { AiLog } = await import("@/models/AiLog");
    const aiLog = await AiLog.create({
      teacherId: session.id,
      schoolId: session.schoolId || 'unknown',
      prompt: prompt,
      contextText: contextText || '',
      fileName: file?.name || '',
      response: response.text
    });

    return NextResponse.json({ success: true, text: response.text, log: aiLog });
  } catch (error: any) {
    console.error("[API /api/ai/pedagog POST] Error:", error.message);
    return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  }
}
