// @ts-nocheck
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AddTeacherDialog(props: any) {
  const {
    isAddingTeacher, setIsAddingTeacher,
    schools,
    onTeacherAdded
  } = props;
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setSchoolId('');
  };

  const handleAddTeacher = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password.trim()) {
      toast({ title: "Chyba", description: "Jméno, příjmení, login a heslo jsou povinné údaje.", variant: "destructive" });
      return;
    }

    if (!schoolId) {
      toast({ title: "Chyba", description: "Musíte vybrat školu, pod kterou učitel spadá.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          username: username.trim(),
          password: password.trim(),
          schoolId: schoolId,
          subjects: []
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Při vytváření učitele došlo k chybě.");
      }

      toast({ title: "Učitel vytvořen", description: `Účet pro ${firstName} ${lastName} byl úspěšně založen.` });
      
      // Vyčistíme formulář
      resetForm();
      setIsAddingTeacher(false);
      
      // Zavoláme callback pro přidání učitele do storu
      if (onTeacherAdded) {
        onTeacherAdded(data.data);
      }
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isAddingTeacher} onOpenChange={(open) => {
      setIsAddingTeacher(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogContent aria-describedby={undefined} className="rounded-3xl border-none shadow-2xl max-w-md bg-white">
        <DialogHeader><DialogTitle className="text-2xl font-headline font-bold text-primary">Přidat učitele</DialogTitle></DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-bold text-gray-700">Jméno</Label>
              <Input 
                placeholder="Jan" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-gray-700">Příjmení</Label>
              <Input 
                placeholder="Novák" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                className="bg-slate-50"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="font-bold text-gray-700">E-mail (nepovinné)</Label>
            <Input 
              type="email"
              placeholder="jan.novak@skola.cz" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-gray-700">Uživatelské jméno (Login)</Label>
            <Input 
              placeholder="jannovak" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-gray-700">Přístupové heslo</Label>
            <Input 
              type="text"
              placeholder="Min. 6 znaků" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-gray-700">Spárovaná škola</Label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- Vyberte školu --</option>
              {schools.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => setIsAddingTeacher(false)} className="rounded-xl font-bold w-full sm:w-auto">
            Zrušit
          </Button>
          <Button 
            onClick={handleAddTeacher} 
            disabled={isSubmitting || !firstName || !lastName || !username || !password || !schoolId}
            className="rounded-xl font-bold w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vytvářím...</> : 'Vytvořit učitele'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
