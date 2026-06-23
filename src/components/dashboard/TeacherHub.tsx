import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Sparkles, LogOut, ChevronRight, Crown, ShieldAlert, FileText, Search, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TeacherHubProps {
  onSelectMode: (mode: 'itest' | 'ai' | 'admin-dashboard') => void;
  onLogout: () => void;
  userName: string;
  isAdmin?: boolean;
  aiLogs?: any[];
  users?: any[];
}

export function TeacherHub({ onSelectMode, onLogout, userName, isAdmin, aiLogs = [], users = [] }: TeacherHubProps) {
  const [showAdminLogs, setShowAdminLogs] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-1.5 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <span className="text-xl font-bold text-primary">iTest</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-700">AI Kredity: 199 / 200</span>
          </div>
          <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100">
            <GraduationCap className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-800">{userName} (Učitel)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-500 hover:text-gray-700">
            <LogOut className="w-4 h-4 mr-2" /> Odhlásit se
          </Button>
        </div>
      </header>

      <div className="w-full max-w-5xl px-4 py-8 flex-1 flex flex-col items-center">
        {/* Premium Banner */}
        <div className="w-full bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-100/50 rounded-2xl p-4 flex items-center gap-4 mb-12">
          <div className="bg-amber-100 p-2 rounded-full">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-800">Prémiový účet aktivní</span>
              <span className="text-[9px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded uppercase">Premium (Měsíční)</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Limity aktivní: max. 8 tříd, max. 100 žáků celkem. Placená verze vyprší za <span className="font-bold text-indigo-600">27 dní</span>.</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#26538D] mb-4">Digitální asistent pedagoga</h1>
          <p className="text-gray-500">Vítejte v cloudovém prostředí iTest. Vyberte si nástroj, se kterým chcete<br/>pracovat.</p>
        </div>

        {/* Cards */}
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4 max-w-7xl' : 'md:grid-cols-2 max-w-4xl'} gap-8 w-full`}>
          {/* Card 1: iTest Cloud */}
          <Card 
            className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group bg-white flex flex-col"
            onClick={() => onSelectMode('itest')}
          >
            <CardContent className="p-8 flex flex-col h-full">
              <div className="bg-[#F0F4FF] w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-[#4669B0]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">iTest Cloud</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Kompletní prostředí pro správu školních tříd, vytváření a zadávání testů, automatické vyhodnocení, sledování klasifikace a tisk PDF.
              </p>
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span>✓</span> Správa a zakládání školních tříd
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span>✓</span> Banka sdílených testových šablon
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span>✓</span> Sledování odevzdaných prací a známek
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-[#4669B0] group-hover:text-indigo-700 transition-colors">
                <span>Vstoupit do nástěnky</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: AI Pedagog */}
          <Card 
            className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group bg-white flex flex-col relative"
            onClick={() => onSelectMode('ai')}
          >
            <div className="absolute top-8 right-8 bg-indigo-100 rounded-full w-3 h-3"></div>
            <CardContent className="p-8 flex flex-col h-full">
              <div className="bg-[#F0F2FF] w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-[#5C45B3]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">AI Pedagog</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Inteligentní AI asistent pro učitele. Pomůže Vám psát odpovědi rodičům, tvořit reakce na školní inspekci (ČŠI), vytvářet provozní řády učeben z PDF nebo řešit kázeňské prohřešky.
              </p>
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span className="text-amber-400">✨</span> Rychlá tvorba diplomatických odpovědí rodičům
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span className="text-amber-400">✨</span> Generování provozních řádů a dokumentů
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <span className="text-amber-400">✨</span> Možnost nahrávat maily, PDF a obrázky jako kontext
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-[#5C45B3] group-hover:text-indigo-700 transition-colors">
                <span>Spustit AI asistenta</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Admin Dohled (Only visible to Admin) */}
          {isAdmin && (
            <Card 
              className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group bg-white flex flex-col relative"
              onClick={() => setShowAdminLogs(true)}
            >
              <CardContent className="p-8 flex flex-col h-full">
                <div className="bg-red-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldAlert className="w-7 h-7 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Dohled AI (Logy)</h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  Administrátorský přístup k logům z AI Pedagoga. Procházejte všechny dotazy učitelů a vygenerované odpovědi z důvodu kontroly a auditu.
                </p>
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <span className="text-red-400">🛡️</span> Viditelné dotazy všech škol
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <span className="text-red-400">🛡️</span> Přístup k textům odpovědí
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">
                  <span>Otevřít protokoly</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 4: System Management (Only visible to Admin) */}
          {isAdmin && (
            <Card 
              className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group bg-slate-900 flex flex-col relative"
              onClick={() => onSelectMode('admin-dashboard')}
            >
              <CardContent className="p-8 flex flex-col h-full">
                <div className="bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <Crown className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Správa systému</h2>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Hlavní administrátorský panel. Přidávejte školy, spravujte všechny učitelské účty a kontrolujte databázi z nejvyšší úrovně.
                </p>
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <span className="text-amber-400">⚙️</span> Kompletní kontrola
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <span className="text-amber-400">⚙️</span> Správa oprávnění
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                  <span>Vstoupit do administrace</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Admin Logs Modal */}
      {showAdminLogs && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Administrátorský Dohled AI</h2>
                  <p className="text-xs text-slate-500">Logy komunikace s AI Pedagogem napříč školami.</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAdminLogs(false)} className="rounded-full hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-500" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-white">
              
              {/* Left Column: Log List */}
              <div className="w-full md:w-1/3 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
                <div className="p-4 shrink-0 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historie dotazů</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Vyhledat v dotazech..." 
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {aiLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Žádné záznamy k zobrazení.</p>
                  ) : (
                    aiLogs.map((log) => {
                      const teacher = users.find(u => u.id === log.teacherId);
                      return (
                        <button 
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`w-full text-left p-3 rounded-xl transition-all ${selectedLog?.id === log.id ? 'bg-indigo-50 border-indigo-200 shadow-sm border' : 'hover:bg-white border border-transparent'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-700 truncate pr-2">
                              {teacher ? teacher.name : 'Neznámý učitel'}
                            </span>
                            <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleDateString('cs-CZ')}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${selectedLog?.id === log.id ? 'text-indigo-700 font-medium' : 'text-slate-500'}`}>
                            {log.prompt}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Log Detail */}
              <div className="w-full md:w-2/3 h-full flex flex-col bg-white">
                {selectedLog ? (
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="mb-6 pb-6 border-b border-slate-100 flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Detail dotazu</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{new Date(selectedLog.createdAt).toLocaleString('cs-CZ')}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">{users.find(u => u.id === selectedLog.teacherId)?.name || 'Neznámý'}</span>
                          <span>•</span>
                          <span className="text-slate-400 font-mono text-[10px] bg-slate-100 px-1 rounded">{selectedLog.schoolId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Zadání (Prompt)
                        </h4>
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                          {selectedLog.prompt}
                        </div>
                      </div>

                      {selectedLog.contextText && (
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            📝 Vložený kontext
                          </h4>
                          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed italic">
                            {selectedLog.contextText}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Odpověď AI
                        </h4>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                          {selectedLog.response}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-100">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Žádný záznam nevybrán</h3>
                    <p className="text-sm text-slate-500 max-w-xs">Vyberte si dotaz z levého panelu pro zobrazení jeho detailu, vloženého kontextu a kompletní odpovědi AI.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
