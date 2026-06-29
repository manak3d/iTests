import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Upload, History, Bookmark, Sparkles, Send, ArrowLeft, Loader2, FileText, Image as ImageIcon, Download, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Assignment } from '@/lib/types';

interface AiPedagogDashboardProps {
  onBack: () => void;
  userName: string;
  aiLogs?: any[];
  setAiLogs?: (logs: any[]) => void;
  onGenerateTest?: (text: string, config: { numMultipleChoice: number; numTrueFalse: number; numShortAnswer: number; numCloze: number; targetAssignmentId?: string; targetClassId?: string; targetSubject?: string }) => void;
  isGeneratingQuestions?: boolean;
  assignments?: Assignment[];
  classes?: any[];
  customAiTemplates?: { title: string; prompt: string }[];
  onAddCustomTemplate?: (title: string, prompt: string) => Promise<boolean>;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export function AiPedagogDashboard({ onBack, userName, aiLogs = [], setAiLogs, onGenerateTest, isGeneratingQuestions, assignments = [], classes = [], customAiTemplates = [], onAddCustomTemplate }: AiPedagogDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Custom Template State
  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  
  // Test Generation Config State
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedTextForTest, setSelectedTextForTest] = useState('');
  const [testConfig, setTestConfig] = useState({
    numMultipleChoice: 2,
    numTrueFalse: 1,
    numShortAnswer: 1,
    numCloze: 1,
    targetAssignmentId: 'new',
    targetClassId: '',
    targetSubject: 'Matematika'
  });
  const [contextText, setContextText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, type: string, base64: string} | null>(null);
  
  // PDF Settings State
  const [isPdfSettingsOpen, setIsPdfSettingsOpen] = useState(false);
  const [pdfHeaderLine1, setPdfHeaderLine1] = useState('iTest Cloud - AI Pedagog');
  const [pdfHeaderLine2, setPdfHeaderLine2] = useState('Vygenerováno úřední AI asistencí');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLine1 = localStorage.getItem('aiPedagogPdfHeader1');
    const savedLine2 = localStorage.getItem('aiPedagogPdfHeader2');
    if (savedLine1) setPdfHeaderLine1(savedLine1);
    if (savedLine2) setPdfHeaderLine2(savedLine2);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleTemplateClick = (template: string) => {
    let prompt = "";
    if (template === "Odpověď rodičům") {
      prompt = "Napiš vysoce profesionální, diplomatickou a empatickou odpověď rodičům na jejich stížnost nebo dotaz (viz kontext). Odpověď musí být věcná, chránit zájmy školy i žáka a působit maximálně seriózně. V případě potřeby se odkaž na školní řád nebo školský zákon (č. 561/2004 Sb.).";
    } else if (template === "Reakce na ČŠI") {
      prompt = "Vypracuj vysoce formální a právně podloženou reakci nebo zprávu pro Českou školní inspekci (ČŠI) na základě dodaných informací. Odpověď musí být strukturovaná, respektovat terminologii MŠMT a přímo se odkazovat na příslušné paragrafy školského zákona (č. 561/2004 Sb.) a související vyhlášky.";
    } else if (template === "Řád odborné učebny") {
      prompt = "Vytvoř striktní a formální návrh řádu odborné učebny. Dokument musí být v souladu s předpisy o bezpečnosti a ochraně zdraví při práci (BOZP), požární ochranou a platnou legislativou MŠMT. Použij odrážky, jasné formulace zákazů a povinností žáků i vyučujících.";
    } else if (template === "Kázeňský prohřešek") {
      prompt = "Zformuluj úřední a zcela objektivní záznam o kázeňském prohřešku žáka pro školní matriku nebo úřední dopis pro rodiče. Nepoužívej emoce, pouze suchá fakta. Zohledni paragrafy týkající se výchovných opatření (§ 31 školského zákona) a dodržuj formální štábní kulturu dokumentu.";
    } else if (template === "Příprava na hodinu") {
      prompt = "Vytvoř precizní, moderní a pedagogicky vysoce kvalitní plán 45minutové vyučovací hodiny. Postupuj podle modelu E-U-R (evokace, uvědomění si významu, reflexe) nebo konstruktivistického přístupu. Zahrň přesné časové dotace, cíle hodiny v jazyce žáka a metody formativního hodnocení.";
    } else if (template === "Slovní hodnocení žáka") {
      prompt = "Přeformuluj mé hrubé poznámky do vysoce profesionálního, motivujícího a formativního slovního hodnocení na vysvědčení. Text musí být v souladu s doporučeními MŠMT k formativnímu hodnocení, musí oceňovat pokrok žáka a citlivě, avšak jasně, definovat oblasti pro další rozvoj.";
    } else if (template === "Skupinový projekt") {
      prompt = "Navrhni inovativní a komplexní metodiku pro skupinový projekt do výuky. Detailně rozepiš: edukativní cíle, konkrétní role jednotlivých žáků, časový harmonogram, začlenění průřezových témat (RVP) a přesnou analytickou rubriku pro hodnocení procesu i výstupu.";
    } else if (template === "Oficiální pochvala") {
      prompt = "Zformuluj slavnostní a vysoce formální text oficiální pochvaly třídního učitele nebo ředitele školy. Text musí mít úřední náležitosti, působit důstojně a přesně odůvodňovat udělení pochvaly (např. reprezentace školy, mimořádný lidský čin) v souladu se školním řádem.";
    } else if (template === "Podklady pro PPP / IVP") {
      prompt = "Sestav odbornou pedagogickou zprávu pro pedagogicko-psychologickou poradnu (PPP) či SPC. Používej exaktní speciálně-pedagogickou a psychologickou terminologii. Analyzuj kognitivní schopnosti, sociální chování a podrobně vypiš dosud uplatňovaná podpůrná opatření (PO 1. stupně) v rámci školy.";
    } else if (template === "Hodnoticí rubrika") {
      prompt = "Vytvoř sofistikovanou analytickou hodnoticí rubriku pro zadaný úkol. Rozděl kritéria do tabulky s deskriptory pro jednotlivé úrovně výkonu (např. 1–5 bodů nebo známky). Rubrika musí být transparentní, validní a odpovídat standardům moderního formativního hodnocení.";
    } else if (template === "Zápis z třídní schůzky") {
      prompt = "Zpracuj mé poznámky do oficiálního, strukturovaného a úředně vyhlížejícího zápisu z třídní schůzky. Dokument musí obsahovat formální náležitosti (datum, program, přijatá usnesení) a být připraven k rozeslání rodičům přes školní informační systém (Bakaláři/EduPage).";
    } else if (template === "Plán třídnické hodiny") {
      prompt = "Navrhni profesionální metodiku pro třídnickou hodinu zaměřenou na budování bezpečného klimatu, prevenci rizikového chování nebo řešení konkrétního problému. Zahrň psychologicky ověřené techniky, pravidla bezpečné komunikace a postupy doporučené metodiky prevence MŠMT.";
    } else if (template === "Diferenciace textu") {
      prompt = "Proveď didaktickou transformaci přiloženého studijního textu pro účely inkluze (žák s SPU nebo s odlišným mateřským jazykem). Text zjednoduš na úroveň jazyka B1, zkrať souvětí, zvýrazni klíčové pojmy, ale zachovej plnou faktickou správnost a vzdělávací hodnotu materiálu.";
    } else if (template === "Zpráva pro OSPOD") {
      prompt = "Zformuluj úřední oznámení či zprávu pro orgán sociálně-právní ochrany dětí (OSPOD) v souladu se zákonem č. 359/1999 Sb. Text musí být striktně faktický, bez dohadů či emocí, a musí obsahovat výčet konkrétních pozorování, termínů a realizovaných intervencí ze strany školy.";
    } else if (template === "Zápis z porad") {
      prompt = "Vytvoř oficiální, reprezentativní a strukturovaný zápis z pedagogické rady nebo provozní porady vedení školy. Pečlivě rozděl text na projednávané body, usnesení a úkoly s přiřazenou zodpovědností a termíny plnění. Text musí splňovat náležitosti úředního dokumentu.";
    }
    setInputValue(prompt);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedFile({
        name: file.name,
        type: file.type,
        base64: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !uploadedFile && !contextText.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue || "Zanalyzuj přiložené podklady.",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const payload = {
        prompt: newUserMsg.content,
        contextText: contextText,
        file: uploadedFile ? {
          name: uploadedFile.name,
          mimeType: uploadedFile.type,
          data: uploadedFile.base64.split(',')[1] // remove data url prefix
        } : null
      };

      const res = await fetch('/api/ai/pedagog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Chyba při komunikaci s AI");
      }

      const data = await res.json();
      
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'ai',
        content: data.text,
        timestamp: new Date()
      }]);
      
      // Add the new log to the store history
      if (data.log && setAiLogs) {
        setAiLogs([data.log, ...aiLogs]);
      }
      
      // Clear context after sending so it's not reused accidentally
      setContextText('');
      removeFile();

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "Omlouvám se, ale při komunikaci se serverem došlo k chybě. Zkontrolujte prosím své připojení a API klíč.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generatePdf = async (text: string) => {
    // We will use window.print() or jspdf for now
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Format text from markdown to basic HTML for printing
    const formattedHtml = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Úřední dokument - iTest AI Pedagog</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .content { font-size: 14px; }
            .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print {
              @page { margin: 2cm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <strong>${pdfHeaderLine1}</strong><br/>
              ${pdfHeaderLine2}
            </div>
            <div>
              Datum: ${new Date().toLocaleDateString('cs-CZ')}<br/>
              Zpracoval(a): ${userName}
            </div>
          </div>
          <div class="content">
            ${formattedHtml}
          </div>
          <div class="footer">
            Dokument byl automaticky vygenerován systémem iTest Cloud na základě zadání pedagoga a platných vyhlášek MŠMT.<br/>
            Nejedná se o právně závazné stanovisko, doporučujeme formální kontrolu vedením školy.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="rounded-full hover:bg-slate-50 font-bold text-slate-700 mr-2 border-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na rozcestník
          </Button>
          <div>
            <h1 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI Pedagogický Asistent
            </h1>
            <p className="text-xs text-slate-500">ChatGPT přizpůsobený pro učitele a české školství.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 p-6 max-w-[1600px] mx-auto w-full items-start overflow-hidden h-[calc(100vh-73px)]">
        
        {/* LEFT COLUMN: Templates & Context */}
        <div className="w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pb-6 custom-scrollbar">
          
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Šablony a rychlé volby
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Výchozí šablony</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Odpověď rodičům")}>
                    <span className="mr-2">✉️</span> Odpověď rodičům
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Reakce na ČŠI")}>
                    <span className="mr-2">🛡️</span> Reakce na ČŠI
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Řád odborné učebny")}>
                    <span className="mr-2">📐</span> Řád odborné učebny
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Kázeňský prohřešek")}>
                    <span className="mr-2">⚠️</span> Kázeňský prohřešek
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Příprava na hodinu")}>
                    <span className="mr-2">📝</span> Příprava na hodinu
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Slovní hodnocení žáka")}>
                    <span className="mr-2">💬</span> Slovní hodnocení žáka
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Skupinový projekt")}>
                    <span className="mr-2">💡</span> Skupinový projekt
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Oficiální pochvala")}>
                    <span className="mr-2">🏆</span> Oficiální pochvala
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Podklady pro PPP / IVP")}>
                    <span className="mr-2">📄</span> Podklady pro PPP / IVP
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Hodnoticí rubrika")}>
                    <span className="mr-2">📊</span> Hodnoticí rubrika
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Zápis z třídní schůzky")}>
                    <span className="mr-2">💬</span> Zápis z třídní schůzky
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Plán třídnické hodiny")}>
                    <span className="mr-2">🤝</span> Plán třídnické hodiny
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Diferenciace textu")}>
                    <span className="mr-2">🌍</span> Diferenciace textu
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Zpráva pro OSPOD")}>
                    <span className="mr-2">⚖️</span> Zpráva pro OSPOD
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-medium text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100 rounded-xl h-10" onClick={() => handleTemplateClick("Zápis z porad")}>
                    <span className="mr-2">📌</span> Zápis z porad
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-50/50 shrink-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                <Upload className="w-4 h-4 text-indigo-500" />
                Kontext k dotazu
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 flex flex-col gap-4 overflow-y-auto">
              <p className="text-xs text-slate-500 leading-relaxed">
                Sem nahrajte e-mail, PDF nebo obrázek dokumentu, který má AI asistent analyzovat.
              </p>
              
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-colors relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf,image/*,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                />
                
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    {uploadedFile.type.startsWith('image/') ? 
                      <ImageIcon className="w-8 h-8 text-indigo-500" /> : 
                      <FileText className="w-8 h-8 text-indigo-500" />
                    }
                    <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{uploadedFile.name}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 mt-1"
                      onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    >
                      Odstranit soubor
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">Klikněte nebo přetáhněte soubor</p>
                    <p className="text-[10px] text-slate-400">Podpora PDF, TXT a obrázků</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Nebo vložte text ručně:</p>
                <Textarea 
                  placeholder="Sem vložte např. e-mail od rodiče nebo pasáž ze ŠVP..."
                  className="min-h-[120px] text-xs resize-none rounded-xl border-slate-200 focus-visible:ring-indigo-100"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* MIDDLE COLUMN: Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm overflow-hidden h-full border border-slate-100 relative">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="bg-indigo-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">O čem chcete diskutovat?</h2>
                <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                  Zadejte vlastní dotaz, vyberte si z hotových šablon v levém panelu, nebo nahrajte e-mail od rodiče či inspektora a nechte AI asistent vypracovat odpověď.
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-md' 
                        : 'bg-slate-50 text-slate-800 rounded-bl-sm border border-slate-100 shadow-sm'
                    }`}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-indigo-900">AI Pedagog</span>
                        </div>
                      )}
                      
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>

                      {msg.role === 'ai' && !msg.isError && (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Nastavení záhlaví PDF dokumentu"
                            className="h-8 w-8 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-slate-200"
                            onClick={() => setIsPdfSettingsOpen(true)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 border-indigo-100"
                            onClick={() => generatePdf(msg.content)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Stáhnout jako PDF
                          </Button>
                          {onGenerateTest && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs bg-indigo-600 text-white hover:bg-indigo-700 ml-2 border-indigo-600"
                              onClick={() => {
                                setSelectedTextForTest(msg.content);
                                setIsConfigDialogOpen(true);
                              }}
                              disabled={isGeneratingQuestions}
                            >
                              {isGeneratingQuestions ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Vytvořit iTest z textu
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 rounded-2xl rounded-bl-sm border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">AI Pedagog analyzuje a píše odpověď...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-50 shrink-0">
            <div className="max-w-3xl mx-auto relative">
              {(uploadedFile || contextText) && (
                <div className="absolute -top-10 left-0 right-0 flex gap-2">
                  {uploadedFile && (
                    <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md">
                      📎 Zahrnuto: {uploadedFile.name}
                    </span>
                  )}
                  {contextText && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md">
                      📝 Zahrnut textový kontext
                    </span>
                  )}
                </div>
              )}
              
              <div className="relative shadow-sm rounded-2xl border border-slate-200 bg-white overflow-hidden focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                <Textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Zadejte dotaz na AI pedagoga..."
                  className="w-full min-h-[60px] max-h-[200px] border-none shadow-none resize-none px-4 py-4 pr-14 text-sm focus-visible:ring-0"
                  rows={1}
                />
                <Button 
                  size="icon"
                  className="absolute bottom-2 right-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 w-10 shadow-md disabled:opacity-50"
                  disabled={!inputValue.trim() && !uploadedFile && !contextText.trim() || isTyping}
                  onClick={handleSendMessage}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">Stisknutím klávesy Enter zprávu odešlete</p>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: History & Saved */}
        <div className="w-72 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pb-6 custom-scrollbar hidden xl:flex">
          
          <Card className="border-none shadow-sm rounded-2xl bg-white flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50/50 shrink-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                <History className="w-4 h-4 text-indigo-500" />
                Minulé prompty
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-2 flex-1 overflow-y-auto custom-scrollbar">
              {aiLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">Žádné předchozí dotazy.</p>
              ) : (
                <div className="space-y-1">
                  {aiLogs.map((log) => (
                    <button 
                      key={log._id || log.id}
                      onClick={() => {
                        setMessages([
                          {
                            id: `user-${log._id || log.id}`,
                            role: 'user',
                            content: log.prompt,
                            timestamp: new Date(log.createdAt)
                          },
                          {
                            id: `ai-${log._id || log.id}`,
                            role: 'ai',
                            content: log.response,
                            timestamp: new Date(log.createdAt)
                          }
                        ]);
                        if (log.contextText) setContextText(log.contextText);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors group flex flex-col gap-1"
                    >
                      <span className="text-xs font-bold text-slate-700 truncate block group-hover:text-indigo-600 transition-colors">
                        {log.prompt}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(log.createdAt).toLocaleDateString('cs-CZ')} {new Date(log.createdAt).toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                <Bookmark className="w-4 h-4 text-indigo-500" />
                Uložené šablony
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 space-y-4">
              {customAiTemplates.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">Žádné uložené šablony.</p>
              ) : (
                <div className="space-y-2">
                  {customAiTemplates.map((tpl, i) => (
                    <Button 
                      key={i}
                      variant="outline" 
                      className="w-full justify-start text-xs font-medium text-slate-600 bg-indigo-50/50 border-indigo-100 hover:bg-indigo-100 rounded-xl h-auto py-2 whitespace-normal text-left" 
                      onClick={() => setInputValue(tpl.prompt)}
                    >
                      <span className="mr-2">⭐</span> {tpl.title}
                    </Button>
                  ))}
                </div>
              )}
              <Button 
                variant="ghost" 
                className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => setIsAddTemplateDialogOpen(true)}
              >
                + Vytvořit novou šablonu
              </Button>
            </CardContent>
          </Card>

        </div>
        
      </div>
    </div>

      {/* Test Generation Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfigurace generování testu</DialogTitle>
            <DialogDescription>
              Nastavte si parametry pro generování otázek z textu AI Pedagoga.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right">Kam uložit</Label>
              <Select 
                value={testConfig.targetAssignmentId} 
                onValueChange={(val) => setTestConfig(prev => ({ ...prev, targetAssignmentId: val }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Vyberte cíl..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">🌟 Vytvořit novou práci</SelectItem>
                  {assignments.map(ass => (
                    <SelectItem key={ass.id} value={ass.id}>Přidat do: {ass.title || "Nepojmenovaný test"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {testConfig.targetAssignmentId === 'new' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="targetClass" className="text-right">Třída</Label>
                  <Select 
                    value={testConfig.targetClassId} 
                    onValueChange={(val) => setTestConfig(prev => ({ ...prev, targetClassId: val }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Vyberte třídu (volitelné)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nevybírat (později)</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="targetSubject" className="text-right">Předmět</Label>
                  <Select 
                    value={testConfig.targetSubject} 
                    onValueChange={(val) => setTestConfig(prev => ({ ...prev, targetSubject: val }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Vyberte předmět" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matematika">Matematika</SelectItem>
                      <SelectItem value="Český jazyk">Český jazyk</SelectItem>
                      <SelectItem value="Anglický jazyk">Anglický jazyk</SelectItem>
                      <SelectItem value="Přírodověda">Přírodověda</SelectItem>
                      <SelectItem value="Vlastivěda">Vlastivěda</SelectItem>
                      <SelectItem value="Dějepis">Dějepis</SelectItem>
                      <SelectItem value="Zeměpis">Zeměpis</SelectItem>
                      <SelectItem value="Přírodopis">Přírodopis</SelectItem>
                      <SelectItem value="Fyzika">Fyzika</SelectItem>
                      <SelectItem value="Chemie">Chemie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numMultipleChoice" className="text-right">ABCD (MCQ)</Label>
              <Input 
                id="numMultipleChoice" 
                type="number" 
                min={0} 
                max={10} 
                className="col-span-3"
                value={testConfig.numMultipleChoice}
                onChange={(e) => setTestConfig(prev => ({ ...prev, numMultipleChoice: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numTrueFalse" className="text-right">Ano / Ne</Label>
              <Input 
                id="numTrueFalse" 
                type="number" 
                min={0} 
                max={10} 
                className="col-span-3"
                value={testConfig.numTrueFalse}
                onChange={(e) => setTestConfig(prev => ({ ...prev, numTrueFalse: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numShortAnswer" className="text-right">Krátká odpověď</Label>
              <Input 
                id="numShortAnswer" 
                type="number" 
                min={0} 
                max={10} 
                className="col-span-3"
                value={testConfig.numShortAnswer}
                onChange={(e) => setTestConfig(prev => ({ ...prev, numShortAnswer: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numCloze" className="text-right">Doplňovačka</Label>
              <Input 
                id="numCloze" 
                type="number" 
                min={0} 
                max={10} 
                className="col-span-3"
                value={testConfig.numCloze}
                onChange={(e) => setTestConfig(prev => ({ ...prev, numCloze: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>Zrušit</Button>
            <Button onClick={() => {
              if (onGenerateTest) {
                const targetId = testConfig.targetAssignmentId === 'new' ? undefined : testConfig.targetAssignmentId;
                onGenerateTest(selectedTextForTest, {
                  numMultipleChoice: testConfig.numMultipleChoice,
                  numTrueFalse: testConfig.numTrueFalse,
                  numShortAnswer: testConfig.numShortAnswer,
                  numCloze: testConfig.numCloze,
                  targetAssignmentId: targetId,
                  targetClassId: testConfig.targetAssignmentId === 'new' ? testConfig.targetClassId : undefined,
                  targetSubject: testConfig.targetAssignmentId === 'new' ? testConfig.targetSubject : undefined
                });
                setIsConfigDialogOpen(false);
              }
            }}>
              <Wand2 className="w-4 h-4 mr-2" />
              Generovat test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom Template Dialog */}
      <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vytvořit vlastní šablonu</DialogTitle>
            <DialogDescription>
              Uložte si často používaný dotaz jako rychlou volbu pro příště.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="templateTitle">Název tlačítka</Label>
              <Input 
                id="templateTitle" 
                placeholder="Např. Vysvětlení pro prvňáka" 
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="templatePrompt">Text příkazu (Prompt)</Label>
              <Textarea 
                id="templatePrompt" 
                placeholder="Napiš to tak jednoduše, aby to pochopilo i 6leté dítě..." 
                className="min-h-[100px]"
                value={newTemplatePrompt}
                onChange={(e) => setNewTemplatePrompt(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTemplateDialogOpen(false)} disabled={isAddingTemplate}>Zrušit</Button>
            <Button 
              disabled={isAddingTemplate || !newTemplateTitle.trim() || !newTemplatePrompt.trim()}
              onClick={async () => {
                if (onAddCustomTemplate) {
                  setIsAddingTemplate(true);
                  const success = await onAddCustomTemplate(newTemplateTitle, newTemplatePrompt);
                  setIsAddingTemplate(false);
                  if (success) {
                    setIsAddTemplateDialogOpen(false);
                    setNewTemplateTitle('');
                    setNewTemplatePrompt('');
                  }
                }
              }}
            >
              {isAddingTemplate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Uložit šablonu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* PDF Settings Dialog */}
      <Dialog open={isPdfSettingsOpen} onOpenChange={setIsPdfSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nastavení záhlaví PDF</DialogTitle>
            <DialogDescription>
              Změňte si text, který se bude tisknout v záhlaví dokumentu (např. název vaší školy). Nastavení se uloží do vašeho prohlížeče.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pdfLine1">Název školy / Hlavní nadpis</Label>
              <Input 
                id="pdfLine1" 
                value={pdfHeaderLine1}
                onChange={(e) => setPdfHeaderLine1(e.target.value)}
                placeholder="Základní škola a Mateřská škola..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdfLine2">Podtitul</Label>
              <Input 
                id="pdfLine2" 
                value={pdfHeaderLine2}
                onChange={(e) => setPdfHeaderLine2(e.target.value)}
                placeholder="Vygenerováno úřední AI asistencí"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              localStorage.setItem('aiPedagogPdfHeader1', pdfHeaderLine1);
              localStorage.setItem('aiPedagogPdfHeader2', pdfHeaderLine2);
              setIsPdfSettingsOpen(false);
            }}>Uložit a zavřít</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
