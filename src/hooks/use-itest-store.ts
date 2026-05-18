'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
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
    return users.find(u => u.id === currentUserId) || null;
  }, [currentUserId, users]);

  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
      setLoadingStates(prev => ({ ...prev, users: false }));
    }, () => setLoadingStates(prev => ({ ...prev, users: false })));

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Class)));
      setLoadingStates(prev => ({ ...prev, classes: false }));
    }, () => setLoadingStates(prev => ({ ...prev, classes: false })));

    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      setAssignments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Assignment)));
      setLoadingStates(prev => ({ ...prev, assignments: false }));
    }, () => setLoadingStates(prev => ({ ...prev, assignments: false })));

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
      setSubmissions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Submission)));
      setLoadingStates(prev => ({ ...prev, submissions: false }));
    }, () => setLoadingStates(prev => ({ ...prev, submissions: false })));

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
    sessionStorage.removeItem('itest_user_id');
  }, []);

  const addClass = useCallback((name: string) => {
    if (!db || !currentUser) return;
    const classId = Math.random().toString(36).substring(2, 11);
    const newClass: Class = { id: classId, name, teacherId: currentUser.id, studentIds: [] };
    
    setDoc(doc(db, 'classes', classId), cleanData(newClass))
      .then(() => toast({ title: "Třída vytvořena", description: "Data synchronizována." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `classes/${classId}`, operation: 'create' })));
  }, [db, currentUser, toast]);

  const addStudent = useCallback((classId: string, name: string, username: string, password?: string) => {
    if (!db) return;
    const studentId = Math.random().toString(36).substring(2, 11);
    const newUser: User = { id: studentId, name, username, role: 'student', classId, password };
    
    setDoc(doc(db, 'users', studentId), cleanData(newUser))
      .then(() => toast({ title: "Žák zapsán", description: "Účet vytvořen v cloudu." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${studentId}`, operation: 'create' })));
  }, [db, toast]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newAssignment = { ...assignment, id };
    
    setDoc(doc(db, 'assignments', id), cleanData(newAssignment))
      .then(() => toast({ title: "Práce publikována", description: "Úkol nahrán do cloudu." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `assignments/${id}`, operation: 'create' })));
  }, [db, toast]);

  const submitWork = useCallback((submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newSubmission = { ...submission, id, submittedAt: new Date().toISOString() };
    
    setDoc(doc(db, 'submissions', id), cleanData(newSubmission))
      .then(() => toast({ title: "Odevzdáno", description: "Práce nahrána do cloudu." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${id}`, operation: 'create' })));
  }, [db, toast]);

  const gradeSubmission = useCallback((id: string, grade: number, feedback: string) => {
    if (!db) return;
    updateDoc(doc(db, 'submissions', id), cleanData({ grade, feedback }))
      .then(() => toast({ title: "Oznámkováno", description: "Hodnocení uloženo." }))
      .catch(err => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${id}`, operation: 'update' })));
  }, [db, toast]);

  return {
    isLoaded, currentUser, classes, users, assignments, submissions,
    login, register, logout, addClass, addStudent, addAssignment, submitWork, gradeSubmission
  };
}