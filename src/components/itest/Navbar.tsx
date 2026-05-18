"use client";

import { LogOut, BookOpen, GraduationCap, ClipboardList } from 'lucide-react';
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
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
          <GraduationCap className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent-foreground">{user.name} ({user.role})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );
}