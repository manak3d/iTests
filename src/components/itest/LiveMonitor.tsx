"use client";

import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldAlert, Clock, CheckCircle2, User, 
  RefreshCw, X, AlertTriangle, Monitor, ExternalLink, HelpCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LiveMonitorProps {
  assignmentId: string;
  store: any;
  onClose: () => void;
}

export function LiveMonitor({ assignmentId, store, onClose }: LiveMonitorProps) {
  const [timeTick, setTimeTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Periodic store sync (every 3 seconds)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      setIsRefreshing(true);
      store.refresh().finally(() => setIsRefreshing(false));
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [store]);

  // Local clock tick for countdown timers (every 1 second)
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const assignment = store.assignments.find((a: any) => a.id === assignmentId);
  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">Zadání nebylo nalezeno</h2>
        <p className="text-slate-400 mb-6">Zadání s ID {assignmentId} v databázi neexistuje.</p>
        <Button onClick={onClose} variant="destructive">Zavřít okno</Button>
      </div>
    );
  }

  const classroom = store.classes.find((c: any) => c.id === assignment.classId);
  const className = classroom ? classroom.name : 'Neznámá třída';

  // Find students assigned to this test
  const students = store.users.filter((u: any) => 
    u.role === 'student' && 
    (assignment.studentIds && assignment.studentIds.length > 0 
      ? assignment.studentIds.includes(u.id) 
      : u.classId === assignment.classId)
  );

  // Stats calculation
  const totalStudents = students.length;
  const submissionsForAssignment = store.submissions.filter((s: any) => s.assignmentId === assignmentId);
  
  const completedCount = submissionsForAssignment.filter((s: any) => s.submittedAt !== "").length;
  const inProgressCount = submissionsForAssignment.filter((s: any) => s.startedAt && s.submittedAt === "").length;
  const notStartedCount = totalStudents - completedCount - inProgressCount;
  const cheatAlertsCount = submissionsForAssignment.filter((s: any) => (s.tabFocusLostCount || 0) > 0).length;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    store.refresh().finally(() => setIsRefreshing(false));
  };

  const getRemainingTime = (startedAtStr: string | undefined) => {
    if (!startedAtStr || !assignment.timeLimit) return null;
    const startedAt = new Date(startedAtStr).getTime();
    const limitMs = assignment.timeLimit * 60 * 1000;
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, limitMs - elapsed);
    
    if (remaining <= 0) return "Čas vypršel";
    
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 65000) / 1000) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-905 to-slate-950 text-white font-sans p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-indigo-500/30">
              Aktivní sledování
            </span>
            <span className="bg-emerald-500/25 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">{assignment.title}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Třída: <span className="text-white font-bold">{className}</span> · Předmět: <span className="text-white font-bold">{assignment.subject || 'Obecný'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <Button 
            onClick={handleManualRefresh} 
            variant="outline" 
            className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aktualizovat
          </Button>
          <Button onClick={onClose} variant="destructive" className="bg-red-900/40 hover:bg-red-800 text-red-100 border border-red-505/30">
            <X className="w-4 h-4 mr-2" />
            Ukončit monitoring
          </Button>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-slate-800/60 p-3 rounded-2xl text-slate-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Celkem žáků</p>
              <h3 className="text-2xl font-black text-white">{totalStudents}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Píšou test</p>
              <h3 className="text-2xl font-black text-indigo-400">{inProgressCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Odevzdali</p>
              <h3 className="text-2xl font-black text-emerald-400">{completedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-slate-800/40 p-3 rounded-2xl text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-505 uppercase tracking-wider">Nezačali</p>
              <h3 className="text-2xl font-black text-slate-400">{notStartedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20 backdrop-blur col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-red-505/10 p-3 rounded-2xl text-red-400 border border-red-500/25">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Podezření</p>
              <h3 className="text-2xl font-black text-red-500">{cheatAlertsCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {students.map((student: any) => {
          const sub = submissionsForAssignment.find((s: any) => s.studentId === student.id);
          
          let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
          if (sub) {
            status = sub.submittedAt !== "" ? 'completed' : 'in_progress';
          }

          // Active/Idle checking (active within 15 seconds)
          let isActive = false;
          if (status === 'in_progress' && sub.lastActiveAt) {
            const lastActive = new Date(sub.lastActiveAt).getTime();
            isActive = (Date.now() - lastActive) < 15000;
          }

          const hasCheatWarning = sub && (sub.tabFocusLostCount || 0) > 0;
          const questionsCount = assignment.questions?.length || 0;
          const answeredCount = sub ? Object.keys(sub.answers || {}).length : 0;
          const progressPct = questionsCount > 0 ? Math.round((answeredCount / questionsCount) * 100) : 0;
          
          let timerStr = "-";
          if (status === 'completed') {
            timerStr = "Dokončeno";
          } else if (status === 'in_progress') {
            timerStr = getRemainingTime(sub.startedAt) || "Probíhá";
          }

          return (
            <Card 
              key={student.id} 
              className={`transition-all duration-300 relative overflow-hidden backdrop-blur flex flex-col justify-between ${
                status === 'completed' 
                  ? 'bg-emerald-950/15 border-emerald-900/30' 
                  : status === 'in_progress'
                    ? hasCheatWarning
                      ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.07)] ring-1 ring-red-500/30'
                      : 'bg-slate-900/60 border-slate-800'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              {/* Cheat Suspected Glow Bar */}
              {status === 'in_progress' && hasCheatWarning && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
              )}

              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <h4 className="font-bold text-base tracking-tight truncate text-white">
                      {student.name}
                    </h4>
                    <span className="text-xs font-mono text-slate-500">@{student.username}</span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center">
                    {status === 'completed' && (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] py-0.5 font-bold uppercase">
                        Hotovo
                      </Badge>
                    )}
                    {status === 'in_progress' && (
                      <div className="flex items-center gap-1.5">
                        {isActive ? (
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" title="Aktivní"></span>
                          </span>
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" title="Neaktivní / Odešel"></span>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {isActive ? 'Aktivní' : 'Idle'}
                        </span>
                      </div>
                    )}
                    {status === 'not_started' && (
                      <Badge className="bg-slate-800 text-slate-500 text-[10px] py-0.5 font-bold uppercase">
                        Nezačal
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 flex-grow space-y-4 text-white">
                {/* Timer details */}
                <div className="flex items-center justify-between text-sm bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                    <span>Zbývající čas:</span>
                  </div>
                  <span className={`font-mono font-bold ${
                    status === 'in_progress' 
                      ? timerStr === "Čas vypršel" || timerStr.startsWith("0:") || timerStr.startsWith("1:")
                        ? 'text-red-500 animate-pulse'
                        : 'text-indigo-400' 
                      : status === 'completed'
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                  }`}>
                    {timerStr}
                  </span>
                </div>

                {/* Progress Bar */}
                {status !== 'not_started' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Vypracováno:</span>
                      <span className="font-bold text-white">{answeredCount} / {questionsCount} ({progressPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          status === 'completed' 
                            ? 'bg-emerald-500' 
                            : progressPct > 70 
                              ? 'bg-indigo-500' 
                              : 'bg-indigo-600/70'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Warnings / Anti-cheating */}
                {status === 'in_progress' && (
                  <div className="space-y-2 pt-1">
                    {hasCheatWarning ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-200">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-400">Podezření na opisování</p>
                          <p className="text-[11px] text-red-300/80 mt-0.5">
                            Žák opustil kartu testu celkem <span className="font-bold text-red-400 text-sm">{sub.tabFocusLostCount}x</span>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-300/85">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Žák zatím neopustil okno testu.</span>
                      </div>
                    )}
                  </div>
                )}

                {status === 'completed' && hasCheatWarning && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Odevzdáno s {sub.tabFocusLostCount}x přepnutím karty.</span>
                  </div>
                )}
              </CardContent>

              {/* Real-time answers preview toggle */}
              {status !== 'not_started' && sub && (
                <div className="border-t border-slate-850 p-3 bg-slate-950/20">
                  <button 
                    onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                    className="w-full flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                  >
                    <span>{expandedStudentId === student.id ? 'Skrýt přehled odpovědí' : 'Nahlédnout na odpovědi'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  
                  {expandedStudentId === student.id && (
                    <div className="mt-3 pt-3 border-t border-slate-800/40 text-xs space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin">
                      {assignment.questions?.map((q: any, idx: number) => {
                        const ans = sub.answers?.[q.id];
                        let displayText = "Neodpovězeno";
                        if (q.type === 'drawing') {
                          displayText = sub.questionDrawings?.[q.id] ? "🎨 Obrázek zakreslen" : "Neodpovězeno";
                        } else if (q.type === 'multiple_choice') {
                          displayText = ans !== undefined && ans !== null && ans !== ''
                            ? `${String.fromCharCode(65 + Number(ans))}. ${q.options?.[Number(ans)] || ''}`
                            : "Neodpovězeno";
                        } else if (q.type === 'true_false') {
                          displayText = ans !== undefined && ans !== null && ans !== ''
                            ? (ans ? "✓ Ano" : "✗ Ne")
                            : "Neodpovězeno";
                        } else if (ans !== undefined && ans !== null && ans !== '') {
                          displayText = String(ans);
                        }

                        return (
                          <div key={q.id} className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/45">
                            <div className="font-semibold text-slate-400 truncate mb-1">
                              {idx + 1}. {q.text}
                            </div>
                            <div className={`italic ${ans !== undefined && ans !== null && ans !== '' ? 'text-indigo-200 not-italic font-medium' : 'text-slate-600'}`}>
                              {displayText}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="text-center py-20 text-slate-500 bg-slate-900/20 rounded-3xl border border-slate-800/50 mt-8">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="font-bold text-lg text-slate-400">Žádní žáci v této třídě</p>
          <p className="text-sm text-slate-600 mt-1">K tomuto testu nejsou přiřazeni žádní žáci.</p>
        </div>
      )}
    </div>
  );
}
