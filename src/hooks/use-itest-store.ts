
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Pomocná funkce pro vyčištění dat před odesláním do Firestore.
 * Firestore nepodporuje 'undefined' hodnoty.
 */
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

  // Ukládáme pouze ID aktuálního uživatele, abychom objekt mohli vždy najít v čerstvých datech z DB
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('itest_user_id');
      return saved || null;
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

  // Aplikace je plně načtena až po synchronizaci všech kolekcí
  const isLoaded = useMemo(() => {
    return !loadingStates.users && !loadingStates.classes && !loadingStates.assignments && !loadingStates.submissions;
  }, [loadingStates]);

  // Dynamicky najdeme aktuálního uživatele v poli načtených uživatelů
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return users.find(u => u.id === currentUserId) || null;
  }, [currentUserId, users]);

  // Hlavní synchronizační smyčka s cloudem
  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const fetchedUsers = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
      setUsers(fetchedUsers);
      setLoadingStates(prev => ({ ...prev, users: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' }));
      setLoadingStates(prev => ({ ...prev, users: false }));
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const fetchedClasses = snap.docs.map(d => ({ ...d.data(), id: d.id } as Class));
      setClasses(fetchedClasses);
      setLoadingStates(prev => ({ ...prev, classes: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'classes', operation: 'list' }));
      setLoadingStates(prev => ({ ...prev, classes: false }));
    });

    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      setAssignments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Assignment)));
      setLoadingStates(prev => ({ ...prev, assignments: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'assignments', operation: 'list' }));
      setLoadingStates(prev => ({ ...prev, assignments: false }));
    });

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
      setSubmissions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Submission)));
      setLoadingStates(prev => ({ ...prev, submissions: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'submissions', operation: 'list' }));
      setLoadingStates(prev => ({ ...prev, submissions: false }));
    });

    return () => {
      unsubUsers();
      unsubClasses();
      unsubAssignments();
      unsubSubmissions();
    };
  }, [db]);

  const login = useCallback((role: Role, username: string, password?: string) => {
    const user = users.find(u => u.username === username && u.role === role && u.password === password);
    if (user) {
      setCurrentUserId(user.id);
      sessionStorage.setItem('itest_user_id', user.id);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    sessionStorage.removeItem('itest_user_id');
  }, []);

  const addClass = useCallback((name: string) => {
    if (!db || !currentUser) return;
    const classId = Math.random().toString(36).substring(2, 11);
    const newClass: Class = { 
      id: classId, 
      name, 
      teacherId: currentUser.id, 
      studentIds: [] 
    };
    
    setDoc(doc(db, 'classes', classId), cleanData(newClass))
      .then(() => toast({ title: "Třída vytvořena", description: "Data byla synchronizována s cloudem." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `classes/${classId}`, operation: 'create' })));
  }, [db, currentUser, toast]);

  const addStudent = useCallback((classId: string, name: string, username: string, password?: string) => {
    if (!db) return;
    const studentId = Math.random().toString(36).substring(2, 11);
    const newUser: User = { id: studentId, name, username, role: 'student', classId, password };
    
    setDoc(doc(db, 'users', studentId), cleanData(newUser))
      .then(() => toast({ title: "Žák zapsán", description: "Účet vytvořen v cloudové databázi." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${studentId}`, operation: 'create' })));
  }, [db, toast]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newAssignment = { ...assignment, id };
    
    setDoc(doc(db, 'assignments', id), cleanData(newAssignment))
      .then(() => toast({ title: "Práce publikována", description: "Úkol byl nahrán do cloudu." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `assignments/${id}`, operation: 'create' })));
  }, [db, toast]);

  const submitWork = useCallback((submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newSubmission = { 
      ...submission, 
      id,
      submittedAt: new Date().toISOString()
    };
    
    setDoc(doc(db, 'submissions', id), cleanData(newSubmission))
      .then(() => toast({ title: "Odevzdáno", description: "Práce byla úspěšně nahrána do cloudu." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${id}`, operation: 'create' })));
  }, [db, toast]);

  const gradeSubmission = useCallback((id: string, grade: number, feedback: string) => {
    if (!db) return;
    updateDoc(doc(db, 'submissions', id), cleanData({ grade, feedback }))
      .then(() => toast({ title: "Oznámkováno", description: "Hodnocení uloženo v cloudu." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${id}`, operation: 'update' })));
  }, [db, toast]);

  return {
    isLoaded, currentUser, classes, users, assignments, submissions,
    login, logout, addClass, addStudent, addAssignment, submitWork, gradeSubmission
  };
}
