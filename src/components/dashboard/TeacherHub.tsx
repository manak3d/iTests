import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Sparkles, LogOut, ChevronRight, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TeacherHubProps {
  onSelectMode: (mode: 'itest' | 'ai') => void;
  onLogout: () => void;
  userName: string;
}

export function TeacherHub({ onSelectMode, onLogout, userName }: TeacherHubProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
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
        </div>
      </div>
    </div>
  );
}
