'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(v => cleanData(v));
  if (typeof obj !== 'object') return obj;
  
  const clean: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = cleanData(val);
    }
  });
  return clean;
}

export function useITestStore() {
  const db = useFirestore();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('itest_user_id');
    }
    return null;
  });
  
  const [mongoUser, setMongoUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('itest_mongo_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  const [loadingStates, setLoadingStates] = useState({
    users: true,
    classes: true,
    assignments: true,
    submissions: true
  });

  const isLoaded = useMemo(() => {
    return !loadingStates.users && !loadingStates.classes && !loadingStates.assignments && !loadingStates.submissions;
  }, [loadingStates]);

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return users.find(u => u.id === currentUserId) || mongoUser || null;
  }, [currentUserId, users, mongoUser]);

  useEffect(() => {
    fetch('/api/sync')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
          setClasses(data.classes);
          setAssignments(data.assignments);
          setSubmissions(data.submissions);
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoadingStates({
          users: false,
          classes: false,
          assignments: false,
          submissions: false
        });
      });
  }, []);

  const login = useCallback((role: Role, username: string, password?: string) => {
    const user = users.find(u => u.username === username && u.role === role && u.password === password);
    if (user) {
      setCurrentUserId(user.id);
      sessionStorage.setItem('itest_user_id', user.id);
      return true;
    }
    return false;
  }, [users]);

  // Speciální funkce pro vynucené přihlášení, když proběhlo přes MongoDB
  const forceLogin = useCallback((userId: string, role: Role, username: string, name: string, classId?: string) => {
    const u: User = { id: userId, username, role, name, classId };
    setMongoUser(u);
    setCurrentUserId(userId);
    sessionStorage.setItem('itest_user_id', userId);
    sessionStorage.setItem('itest_mongo_user', JSON.stringify(u));
  }, []);

  const register = useCallback((name: string, username: string, password?: string) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newUser: User = { id, name, username, role: 'teacher', password };
    
    setDoc(doc(db, 'users', id), cleanData(newUser))
      .then(() => {
        toast({ title: "Účet vytvořen", description: "Nyní se můžete přihlásit." });
      })
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${id}`, operation: 'create' })));
  }, [db, toast]);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    setMongoUser(null);
    sessionStorage.removeItem('itest_user_id');
    sessionStorage.removeItem('itest_mongo_user');
  }, []);

  const addClass = useCallback((name: string) => {
    if (!currentUser) return;
    const classId = Math.random().toString(36).substring(2, 11);
    const newClass: Class = { id: classId, name, teacherId: currentUser.id, studentIds: [] };
    
    // Zápis do MongoDB
    fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: classId,
        name: name,
        teacherId: currentUser.id
      })
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Třída vytvořena", description: "Zapsáno do databáze." });
        setClasses(prev => [...prev, newClass]);
        
        // Pokus o zálohu do Firebase (neblokující)
        if (db) {
          setDoc(doc(db, 'classes', classId), cleanData(newClass)).catch(console.error);
        }
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se vytvořit třídu.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, currentUser, toast]);

  const addStudent = useCallback((classId: string, name: string, username: string, password?: string) => {
    const studentId = Math.random().toString(36).substring(2, 11);
    const newUser: User = { id: studentId, name, username, role: 'student', classId, password };
    
    // O samotný zápis studenta do MongoDB se teď stará funkce v page.tsx, 
    // zde už jen zkusíme zálohu do Firebase a upravíme lokální stav.
    setUsers(prev => [...prev, newUser]);
    
    if (db) {
      setDoc(doc(db, 'users', studentId), cleanData(newUser)).catch(console.error);
    }
  }, [db, toast]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newAssignment = { ...assignment, id };
    
    // Zápis do MongoDB primárně
    fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssignment)
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Práce publikována", description: "Úkol byl úspěšně uložen." });
        setAssignments(prev => [...prev, newAssignment]);
        
        // Firebase záloha
        if (db) {
          setDoc(doc(db, 'assignments', id), cleanData(newAssignment)).catch(console.error);
        }
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se uložit zadání.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, toast]);

  const deleteAssignment = useCallback((id: string) => {
    fetch(`/api/assignments?id=${id}`, {
      method: 'DELETE'
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Smazáno", description: "Zadání i odevzdané práce byly smazány." });
        setAssignments(prev => prev.filter(a => a.id !== id));
        setSubmissions(prev => prev.filter(s => s.assignmentId !== id));
        
        if (db) {
          deleteDoc(doc(db, 'assignments', id)).catch(console.error);
        }
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se smazat zadání.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, toast]);

  const submitWork = useCallback((submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newSubmission = { ...submission, id, submittedAt: new Date().toISOString() };
    
    // Zápis do MongoDB primárně
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSubmission)
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Odevzdáno", description: "Práce byla úspěšně nahrána." });
        setSubmissions(prev => [...prev, newSubmission as Submission]);
        
        if (db) {
          setDoc(doc(db, 'submissions', id), cleanData(newSubmission)).catch(console.error);
        }
      } else {
        toast({ title: "Chyba", description: "Odevzdání selhalo.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, toast]);

  const gradeSubmission = useCallback((id: string, grade: number, feedback: string, questionScores?: Record<string, number>) => {
    // Aktualizace v MongoDB primárně
    fetch('/api/submissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, grade, feedback, questionScores })
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Oznámkováno", description: "Hodnocení uloženo." });
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, grade, feedback, questionScores } : s));
        
        if (db) {
          updateDoc(doc(db, 'submissions', id), cleanData({ grade, feedback, questionScores })).catch(console.error);
        }
      } else {
        toast({ title: "Chyba", description: "Uložení hodnocení selhalo.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, toast]);

  const assignClass = useCallback((classId: string) => {
    if (!currentUser) return;
    fetch('/api/classrooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: classId, teacherId: currentUser.id })
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Třída přidána", description: "Třída byla úspěšně přiřazena k vašemu účtu." });
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, teacherId: currentUser.id } : c));
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se přidat třídu.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [currentUser, toast]);

  const assignStudent = useCallback((studentId: string, classId: string) => {
    fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: studentId, classId })
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Žák přidán", description: "Žák byl úspěšně zapsán do třídy." });
        setUsers(prev => prev.map(u => u.id === studentId ? { ...u, classId } : u));
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se zapsat žáka.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [toast]);

  return {
    isLoaded, currentUser, classes, users, assignments, submissions,
    login, forceLogin, register, logout, addClass, addStudent, addAssignment, deleteAssignment, submitWork, gradeSubmission,
    assignClass, assignStudent
  };
}