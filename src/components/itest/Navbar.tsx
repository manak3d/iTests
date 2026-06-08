"use client";

import { LogOut, BookOpen, GraduationCap, ClipboardList, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';

export function Navbar({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <nav className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg shadow-sm">
          <BookOpen className="text-white w-6 h-6" />
        </div>
        <span className="font-headline text-2xl font-bold tracking-tight text-primary">iTest</span>
      </div>

      <div className="flex items-center gap-6">
        {user.role === 'teacher' && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 shadow-sm animate-fade-in">
            <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            <span className="text-xs font-bold">AI Kredity:</span>
            <span className="text-sm font-black">{user.aiCredits !== undefined ? user.aiCredits : 30} / {user.aiCreditsMax || 30}</span>
            {user.aiExtraCredits ? (
              <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold ml-1">
                +{user.aiExtraCredits} extra
              </span>
            ) : null}
          </div>
        )}
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
          <GraduationCap className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent-foreground">{user.name} ({user.role})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Odhlásit se
        </Button>
      </div>
    </nav>
  );
}