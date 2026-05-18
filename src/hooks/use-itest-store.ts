
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, updateDoc, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// Pomocná funkce pro odstranění undefined hodnot před uložením do Firestore
function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  const clean: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val === undefined) return;
    if (val !== null && typeof val === 'object') {
      clean[key] = cleanData(val);
    } else {
      clean[key] = val;
    }
  });
  return clean;
}

export function useITestStore() {
  const db = useFirestore();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('itest_session');
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

  // Real-time sync s Firestore
  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const fetchedUsers = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
      setUsers(fetchedUsers);
      
      // Synchronizace aktuálního uživatele s daty z DB
      if (currentUser) {
        const freshUser = fetchedUsers.find(u => u.id === currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
          sessionStorage.setItem('itest_session', JSON.stringify(freshUser));
        }
      }
      
      setLoadingStates(prev => ({ ...prev, users: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' }));
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(d => ({ ...d.data(), id: d.id } as Class)));
      setLoadingStates(prev => ({ ...prev, classes: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'classes', operation: 'list' }));
    });

    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      setAssignments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Assignment)));
      setLoadingStates(prev => ({ ...prev, assignments: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'assignments', operation: 'list' }));
    });

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
      setSubmissions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Submission)));
      setLoadingStates(prev => ({ ...prev, submissions: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'submissions', operation: 'list' }));
    });

    return () => {
      unsubUsers();
      unsubClasses();
      unsubAssignments();
      unsubSubmissions();
    };
  }, [db, currentUser?.id]);

  // Automatické vytvoření učitele pokud DB zeje prázdnotou
  useEffect(() => {
    if (!db || !isLoaded || users.length > 0) return;

    const defaultTeacherId = 'default-teacher';
    const defaultTeacher: User = {
      id: defaultTeacherId,
      name: 'Hlavní učitel',
      role: 'teacher',
      username: 'ucitel',
      password: '123'
    };
    setDoc(doc(db, 'users', defaultTeacherId), cleanData(defaultTeacher))
      .catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${defaultTeacherId}`, operation: 'create' }));
      });
  }, [db, isLoaded, users.length]);

  const login = useCallback((role: Role, username: string, password?: string) => {
    const user = users.find(u => u.username === username && u.role === role && u.password === password);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('itest_session', JSON.stringify(user));
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem('itest_session');
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
      .then(() => {
        toast({ title: "Žák zapsán", description: "Účet byl vytvořen v cloudové databázi." });
      })
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
