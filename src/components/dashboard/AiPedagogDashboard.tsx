import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Upload, History, Bookmark, Sparkles, Send, ArrowLeft, Loader2, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AiPedagogDashboardProps {
  onBack: () => void;
  userName: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function AiPedagogDashboard({ onBack, userName }: AiPedagogDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [contextText, setContextText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, type: string, base64: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleTemplateClick = (template: string) => {
    let prompt = "";
    if (template === "Odpověď rodičům") {
      prompt = "Napiš diplomatickou a vstřícnou odpověď rodičům, kteří mají stížnost nebo dotaz. Použij přiložený kontext.";
    } else if (template === "Reakce na ČŠI") {
      prompt = "Připrav formální reakci nebo zprávu pro Českou školní inspekci (ČŠI) na základě poskytnutých informací a platných vyhlášek MŠMT.";
    } else if (template === "Řád odborné učebny") {
      prompt = "Vypracuj návrh řádu odborné učebny, který bude v souladu s bezpečnostními předpisy a platnou legislativou.";
    } else if (template === "Kázeňský prohřešek") {
      prompt = "Navrhni postup a formulaci zápisu o kázeňském prohřešku žáka podle školního řádu.";
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
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.text,
        timestamp: new Date()
      }]);
      
      // Clear context after sending so it's not reused accidentally
      setContextText('');
      removeFile();

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "Omlouvám se, ale při komunikaci se serverem došlo k chybě. Zkontrolujte prosím své připojení a API klíč.",
        timestamp: new Date()
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
              <strong>iTest Cloud - AI Pedagog</strong><br/>
              Vygenerováno úřední AI asistencí
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

                      {msg.role === 'ai' && (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 border-indigo-100"
                            onClick={() => generatePdf(msg.content)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Stáhnout jako PDF
                          </Button>
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
          
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                <History className="w-4 h-4 text-indigo-500" />
                Minulé promty
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-4">
              <p className="text-xs text-slate-400 italic text-center">Žádné předchozí dotazy.</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-50/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                <Bookmark className="w-4 h-4 text-indigo-500" />
                Uložené šablony
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-4">
              <p className="text-xs text-slate-400 italic text-center">Žádné uložené šablony.</p>
            </CardContent>
          </Card>

        </div>
        
      </div>
    </div>
  );
}
