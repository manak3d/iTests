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
  }, [currentUserId]);

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
    if (!currentUser) return "";
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

    return classId;
  }, [db, currentUser, toast]);

  const addStudent = useCallback((classId: string, name: string, username: string, password?: string, studentId?: string) => {
    const id = studentId || Math.random().toString(36).substring(2, 11);
    const classroom = classes.find(c => c.id === classId);
    const schoolId = classroom?.schoolId;
    const newUser: User = { id, name, username, role: 'student', classId, password, schoolId };
    
    // O samotný zápis studenta do MongoDB se teď stará funkce v page.tsx, 
    // zde už jen zkusíme zálohu do Firebase a upravíme lokální stav.
    setUsers(prev => [...prev, newUser]);
    
    if (db) {
      setDoc(doc(db, 'users', id), cleanData(newUser)).catch(console.error);
    }
  }, [db, classes]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newAssignment = { ...assignment, id, teacherId: currentUser?.id };
    
    // Zápis do MongoDB primárně
    fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssignment)
    })
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: newAssignment.isDraft ? "Koncept uložen" : "Práce publikována", description: newAssignment.isDraft ? "Úkol byl uložen jako koncept. Žáci ho ještě nevidí." : "Úkol byl úspěšně uložen." });
        setAssignments(prev => [...prev, newAssignment]);
        
        // Firebase záloha
        if (db) {
          setDoc(doc(db, 'assignments', id), cleanData(newAssignment)).catch(console.error);
        }
      } else {
        toast({ 
          title: "Chyba při ukládání", 
          description: data.error || "Nepodařilo se uložit zadání.", 
          variant: "destructive" 
        });
      }
    })
    .catch(console.error);
  }, [db, currentUser, toast]);

  const updateAssignment = useCallback((id: string, updates: { startTime?: string; endTime?: string; studentIds?: string[]; sharedWithClassIds?: string[]; isDraft?: boolean }) => {
    return fetch('/api/assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        toast({ title: updates.isDraft === false ? "Práce publikována" : "Zadání upraveno", description: updates.isDraft === false ? "Úkol je nyní viditelný pro žáky." : "Nastavení úkolu bylo úspěšně uloženo." });
        setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        
        if (db) {
          setDoc(doc(db, 'assignments', id), cleanData({
            ...assignments.find(a => a.id === id),
            ...updates
          })).catch(console.error);
        }
        return true;
      } else {
        toast({ title: "Chyba", description: data.error || "Nepodařilo se upravit zadání.", variant: "destructive" });
        return false;
      }
    })
    .catch(err => {
      console.error(err);
      toast({ title: "Chyba sítě", description: "Nelze se spojit se serverem.", variant: "destructive" });
      return false;
    });
  }, [db, toast, assignments]);

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

  const deleteClassroom = useCallback((id: string) => {
    fetch(`/api/classrooms?id=${id}`, {
      method: 'DELETE'
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Smazáno", description: "Třída i všichni žáci, jejich úkoly a odevzdané práce byly smazány." });
        
        // 1. Získání ID všech žáků a úkolů v této třídě k pročištění lokálního stavu
        const studentsInClass = users.filter(u => u.role === 'student' && u.classId === id).map(u => u.id);
        const assignmentsInClass = assignments.filter(a => a.classId === id).map(a => a.id);

        // 2. Filtrování lokálního stavu
        setClasses(prev => prev.filter(c => c.id !== id));
        setUsers(prev => prev.filter(u => u.classId !== id));
        setAssignments(prev => prev.filter(a => a.classId !== id));
        setSubmissions(prev => prev.filter(s => !studentsInClass.includes(s.studentId) && !assignmentsInClass.includes(s.assignmentId)));

        // 3. Fallback/backup v Firestore
        if (db) {
          deleteDoc(doc(db, 'classes', id)).catch(console.error);
          studentsInClass.forEach(sId => deleteDoc(doc(db, 'users', sId)).catch(console.error));
          assignmentsInClass.forEach(aId => deleteDoc(doc(db, 'assignments', aId)).catch(console.error));
        }
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se smazat třídu.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, toast, users, assignments]);

  const deleteStudent = useCallback((id: string) => {
    fetch(`/api/students?id=${id}`, {
      method: 'DELETE'
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Smazáno", description: "Žák i všechny jeho odevzdané práce byly smazány." });
        
        // 1. Najdeme třídu studenta pro odebrání z pole studentIds v lokálním stavu
        const student = users.find(u => u.id === id);
        if (student && student.classId) {
          setClasses(prev => prev.map(c => c.id === student.classId ? { ...c, studentIds: c.studentIds.filter(sId => sId !== id) } : c));
        }

        // 2. Filtrování lokálního stavu
        setUsers(prev => prev.filter(u => u.id !== id));
        setSubmissions(prev => prev.filter(s => s.studentId !== id));

        // 3. Fallback/backup v Firestore
        if (db) {
          deleteDoc(doc(db, 'users', id)).catch(console.error);
        }
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se smazat žáka.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, toast, users]);

  const deleteTeacher = useCallback((id: string) => {
    fetch(`/api/teachers?id=${id}`, {
      method: 'DELETE'
    })
    .then(async res => {
      if (res.ok) {
        toast({ title: "Smazáno", description: "Učitel byl úspěšně smazán. Spravované třídy byly zachovány." });
        
        // 1. Nastavíme teacherId u lokálních tříd na "" (nezařazeno)
        setClasses(prev => prev.map(c => c.teacherId === id ? { ...c, teacherId: "" } : c));

        // 2. Odebereme učitele z lokálního seznamu uživatelů
        setUsers(prev => prev.filter(u => u.id !== id));

        // 3. Fallback/backup v Firestore (smažeme pouze dokument učitele)
        if (db) {
          deleteDoc(doc(db, 'users', id)).catch(console.error);
        }
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se smazat učitele.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [db, toast]);


  const submitWork = useCallback((submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    const id = Math.random().toString(36).substring(2, 11);

    // Auto-hodnocení: pokud má otázka correctAnswer, porovnáme s odpovědí žáka
    const assignment = assignments.find(a => a.id === submission.assignmentId);
    const autoScores: Record<string, number> = {};
    if (assignment?.questions) {
      for (const q of assignment.questions) {
        if (q.correctAnswer === undefined || q.correctAnswer === null) continue;
        const studentAnswer = submission.answers?.[q.id];
        const points = q.points ?? 1;
        let isCorrect = false;
        if (q.type === 'multiple_choice') {
          isCorrect = studentAnswer === q.correctAnswer;
        } else if (q.type === 'axis') {
          const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
          const given = Array.isArray(studentAnswer) ? studentAnswer : [];
          if (correct.length === given.length) {
            isCorrect = correct.every(([cx, cy]) =>
              given.some(([gx, gy]) => gx === cx && gy === cy)
            );
          }
        } else if (q.type === 'number_line') {
          const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
          const given = Array.isArray(studentAnswer) ? studentAnswer : [];
          if (correct.length === given.length) {
            const sortedCorrect = [...correct].sort((a, b) => a - b);
            const sortedGiven = [...given].sort((a, b) => a - b);
            isCorrect = sortedCorrect.every((val, idx) => Math.abs(val - sortedGiven[idx]) < 0.0001);
          }
        } else if (q.type === 'true_false') {
          isCorrect = studentAnswer === q.correctAnswer;
        } else if (q.type === 'graph') {
          const gType = q.graphType;
          if (gType === 'pie' || gType === 'bar') {
            const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
            const given = Array.isArray(studentAnswer) ? studentAnswer : [];
            if (correct.length > 0 && correct.length === given.length) {
              // Tolerance of +/- 2 units
              isCorrect = correct.every((cVal, idx) => {
                const gVal = given[idx] ?? 0;
                return Math.abs(cVal - gVal) <= 2;
              });
            }
          } else if (gType === 'linear') {
            const given = Array.isArray(studentAnswer) ? studentAnswer : [];
            const targetA = q.graphData?.a ?? 1;
            const targetB = q.graphData?.b ?? 0;
            
            // Student must place exactly 2 points to define the line
            if (given.length === 2) {
              isCorrect = given.every(([px, py]) => {
                // Check if py = targetA * px + targetB
                return Math.abs(py - (targetA * px + targetB)) < 0.01;
              });
            }
          }
        }
        autoScores[q.id] = isCorrect ? points : 0;
      }
    }

    // Sloučit auto-skóry s existujícími (auto přepíše jen ty, kde je correctAnswer)
    const mergedScores = Object.keys(autoScores).length > 0
      ? { ...(submission.questionScores || {}), ...autoScores }
      : submission.questionScores;

    const newSubmission = {
      ...submission,
      id,
      submittedAt: new Date().toISOString(),
      ...(mergedScores ? { questionScores: mergedScores } : {}),
    };
    
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
  }, [db, toast, assignments]);

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
        setSubmissions(prev => prev.map(s => {
          if (s.id === id) {
            const updated = { ...s, feedback, questionScores };
            if (grade === 0 || grade === null || grade === undefined) {
              delete updated.grade;
            } else {
              updated.grade = grade;
            }
            return updated;
          }
          return s;
        }));
        
        if (db) {
          const fbUpdate: any = { feedback, questionScores };
          if (grade === 0 || grade === null || grade === undefined) {
            fbUpdate.grade = null;
          } else {
            fbUpdate.grade = grade;
          }
          updateDoc(doc(db, 'submissions', id), cleanData(fbUpdate)).catch(console.error);
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
        const classroom = classes.find(c => c.id === classId);
        const schoolId = classroom?.schoolId;
        setUsers(prev => prev.map(u => u.id === studentId ? { ...u, classId, schoolId } : u));
      } else {
        toast({ title: "Chyba", description: "Nepodařilo se zapsat žáka.", variant: "destructive" });
      }
    })
    .catch(console.error);
  }, [toast, classes]);

  const changeStudentPassword = useCallback((studentId: string, newPassword: string) => {
    return fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: studentId, password: newPassword })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Heslo změněno", description: "Heslo žáka bylo úspěšně aktualizováno." });
        setUsers(prev => prev.map(u => u.id === studentId ? { ...u, password: newPassword } : u));
        return true;
      } else {
        toast({ title: "Chyba", description: data.error || "Nepodařilo se změnit heslo.", variant: "destructive" });
        return false;
      }
    })
    .catch(err => {
      console.error(err);
      toast({ title: "Chyba sítě", description: "Nelze se spojit se serverem.", variant: "destructive" });
      return false;
    });
  }, [toast]);



  const toggleUserPremium = useCallback((userId: string, isPremium: boolean) => {
    return fetch('/api/teachers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: userId, 
        action: isPremium ? 'deactivatePremium' : 'activatePremium', 
        type: 'yearly'
      })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ 
          title: isPremium ? "Premium deaktivováno" : "Premium aktivováno", 
          description: isPremium ? "Učitelský účet byl převeden na zkušební verzi." : "Učitelský účet byl úspěšně povýšen na Premium." 
        });
        
        const targetUser = users.find(u => u.id === userId);
        const updatedUser = { 
          id: userId,
          name: targetUser?.name || '',
          username: targetUser?.username || '',
          role: targetUser?.role || 'teacher',
          schoolId: targetUser?.schoolId,
          createdAt: targetUser?.createdAt,
          classId: targetUser?.classId,
          isPremium: !isPremium, 
          premiumExpiresAt: data.data.premiumExpiresAt 
        };
        
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        
        if (currentUser && currentUser.id === userId) {
          const updatedCurrentUser = {
            ...currentUser,
            isPremium: !isPremium,
            premiumExpiresAt: data.data.premiumExpiresAt
          };
          if (mongoUser && mongoUser.id === userId) {
            setMongoUser(updatedCurrentUser);
            sessionStorage.setItem('itest_mongo_user', JSON.stringify(updatedCurrentUser));
          }
        }
        
        return true;
      } else {
        toast({ title: "Chyba", description: data.error || "Změna Premium stavu selhala.", variant: "destructive" });
        return false;
      }
    })
    .catch(err => {
      console.error(err);
      toast({ title: "Chyba sítě", description: "Nelze se spojit se serverem.", variant: "destructive" });
      return false;
    });
  }, [users, currentUser, mongoUser, toast]);

  const renameClassroom = useCallback((classId: string, newName: string) => {
    return fetch('/api/classrooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: classId, name: newName })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Třída přejmenována", description: "Název třídy byl úspěšně aktualizován." });
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, name: newName } : c));
        
        // Nepovinná záloha do Firebase
        if (db) {
          const classroom = classes.find(c => c.id === classId);
          if (classroom) {
            setDoc(doc(db, 'classes', classId), cleanData({ ...classroom, name: newName })).catch(console.error);
          }
        }
        return true;
      } else {
        toast({ title: "Chyba", description: data.error || "Nepodařilo se přejmenovat třídu.", variant: "destructive" });
        return false;
      }
    })
    .catch(err => {
      console.error(err);
      toast({ title: "Chyba sítě", description: "Nelze se spojit se serverem.", variant: "destructive" });
      return false;
    });
  }, [db, toast, classes]);

  return {
    isLoaded, currentUser, classes, users, assignments, submissions,
    login, forceLogin, register, logout, addClass, addStudent, addAssignment, deleteAssignment, deleteClassroom, deleteStudent, deleteTeacher, submitWork, gradeSubmission,
    assignClass, assignStudent, changeStudentPassword, renameClassroom, updateAssignment, toggleUserPremium
  };
}