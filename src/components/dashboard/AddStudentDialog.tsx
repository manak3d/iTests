// @ts-nocheck
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddStudentDialog(props: any) {
  const {
    isAddingStudent, setIsAddingStudent,
    studentActionType, setStudentActionType,
    newStudentName, setNewStudentName,
    newStudentUsername, setNewStudentUsername,
    newStudentPassword, setNewStudentPassword,
    targetClassId, setTargetClassId,
    selectedClassId,
    studentSearch, setStudentSearch,
    selectedExistingStudentId, setSelectedExistingStudentId,
    csvFile, setCsvFile,
    csvParsingError, setCsvParsingError,
    csvImportProgress, setCsvImportProgress,
    handleAddStudent, handleImportCSVToExisting,
    store, schools
  } = props;

  return (
    <Dialog open={isAddingStudent} onOpenChange={(open) => {
      setIsAddingStudent(open);
      if (!open) {
        setStudentActionType('create');
        setNewStudentName('');
        setNewStudentUsername('');
        setNewStudentPassword('');
        setSelectedExistingStudentId('');
        setStudentSearch('');
        setCsvFile(null);
        setCsvParsingError(null);
        setCsvImportProgress('');
      }
    }}>
      <DialogContent aria-describedby={undefined} className="rounded-3xl border-none shadow-2xl max-w-md bg-white">
        <DialogHeader><DialogTitle className="text-2xl font-headline font-bold text-primary">Zapsat žáka</DialogTitle></DialogHeader>
        
        {store.currentUser?.role === 'admin' && (
          <div className="space-y-1.5 mb-4">
            <Label className="font-bold text-gray-700">Cílová třída</Label>
            <select
              value={targetClassId || ''}
              onChange={(e) => setTargetClassId(e.target.value || null)}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">-- Vyberte cílovou třídu --</option>
              {store.classes.map(c => {
                const schoolName = schools.find(s => s.id === c.schoolId)?.name || 'Bez školy';
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({schoolName})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-lg mb-4 p-1">
          <button 
            type="button" 
            className={`py-2 text-xs font-semibold rounded-md transition-all ${studentActionType === 'create' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setStudentActionType('create')}
          >Vytvořit</button>
          <button 
            type="button" 
            className={`py-2 text-xs font-semibold rounded-md transition-all ${studentActionType === 'select' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setStudentActionType('select')}
          >Přiřadit</button>
          <button 
            type="button" 
            className={`py-2 text-xs font-semibold rounded-md transition-all ${studentActionType === 'csv' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={() => setStudentActionType('csv')}
          >Z CSV</button>
        </div>

        {studentActionType === 'create' ? (
          <div className="space-y-4 py-4">
            <Input placeholder="Jméno žáka" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
            <Input placeholder="Login" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} />
            <Input type="password" placeholder="Heslo" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
          </div>
        ) : studentActionType === 'select' ? (
          <div className="py-4 space-y-2">
            <Label className="text-sm text-muted-foreground">Vyberte žáka ze systému:</Label>
            <Input 
              placeholder="🔍 Vyhledat žáka podle jména nebo loginu..." 
              value={studentSearch} 
              onChange={(e) => setStudentSearch(e.target.value)} 
              className="mb-2"
            />
            {(() => {
              if (store.currentUser?.role === 'admin' && !targetClassId) {
                return <p className="text-sm text-amber-600 font-semibold py-2">Pro výběr žáků nejprve zvolte cílovou třídu nahoře.</p>;
              }
              const availableStudents = store.users.filter(u => u.role === 'student' && u.classId !== targetClassId);
              if (availableStudents.length === 0) {
                return <p className="text-sm text-amber-600 font-semibold py-2">Žádní další žáci nebyli v systému nalezeni.</p>;
              }
              const filtered = availableStudents.filter(u => 
                u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                u.username.toLowerCase().includes(studentSearch.toLowerCase())
              );
              if (filtered.length === 0) {
                return <p className="text-sm text-amber-600 font-semibold py-2">Žádný žák neodpovídá vyhledávání.</p>;
              }
              return (
                <select
                  value={selectedExistingStudentId}
                  onChange={(e) => setSelectedExistingStudentId(e.target.value)}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- Vyberte žáka ({filtered.length}) --</option>
                  {filtered.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                  ))}
                </select>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="existingCsvFile" className="font-bold text-gray-700">CSV soubor se žáky</Label>
              <Input 
                id="existingCsvFile" 
                type="file" 
                accept=".csv" 
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setCsvFile(files[0]);
                  }
                }}
                className="file:bg-primary/5 file:text-primary file:border-none file:px-3 file:py-1 file:rounded-lg file:font-semibold cursor-pointer"
              />
              <div className="text-[11px] text-muted-foreground bg-gray-50 p-3.5 rounded-2xl border space-y-1.5 leading-relaxed">
                <p className="font-bold text-gray-700 text-xs">Struktura sloupců v CSV souboru:</p>
                <p>Záhlaví: <code className="bg-gray-200/85 px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">Jméno;Uživatelské jméno;Heslo</code></p>
                <p>• Jako oddělovač je podporován středník (<code className="font-bold font-mono">;</code>) i čárka (<code className="font-bold font-mono">,</code>).</p>
              </div>
            </div>

            {csvParsingError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 animate-pulse">
                ⚠️ {csvParsingError}
              </div>
            )}

            {csvImportProgress && (
              <div className="p-3 bg-primary/5 text-primary rounded-xl text-xs font-bold border border-primary/10 flex items-center gap-2.5 justify-center">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {csvImportProgress}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {studentActionType === 'create' ? (
            <Button onClick={handleAddStudent} disabled={!(targetClassId || selectedClassId)}>Vytvořit</Button>
          ) : studentActionType === 'select' ? (
            <Button 
              onClick={() => {
                const classId = targetClassId || selectedClassId;
                if (selectedExistingStudentId && classId) {
                  store.assignStudent(selectedExistingStudentId, classId);
                  setIsAddingStudent(false);
                  setSelectedExistingStudentId('');
                }
              }} 
              disabled={!selectedExistingStudentId || !(targetClassId || selectedClassId)}
            >Přiřadit žáka</Button>
          ) : (
            <Button
              onClick={handleImportCSVToExisting}
              disabled={!csvFile || !!csvImportProgress || !(targetClassId || selectedClassId)}
              className="w-full"
            >
              Importovat žáky z CSV
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
