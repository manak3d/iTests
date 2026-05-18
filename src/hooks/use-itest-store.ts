
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, updateDoc, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function useITestStore() {
  const db = useFirestore();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load session from sessionStorage for faster UI
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('itest_session');
    if (sessionUser) {
      try {
        setCurrentUser(JSON.parse(sessionUser));
      } catch (e) {
        console.error("Session parse error", e);
      }
    }
  }, []);

  // Real-time sync with Firestore
  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setIsLoaded(true);
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
    });

    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment)));
    });

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission)));
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

  const addClass = useCallback(async (name: string) => {
    if (!db || !currentUser) return;
    const classId = Math.random().toString(36).substring(2, 11);
    const newClass: Class = { 
      id: classId, 
      name, 
      teacherId: currentUser.id, 
      studentIds: [] 
    };
    setDoc(doc(db, 'classes', classId), newClass);
  }, [db, currentUser]);

  const addStudent = useCallback(async (classId: string, name: string, username: string, password?: string) => {
    if (!db) return;
    const studentId = Math.random().toString(36).substring(2, 11);
    const newUser: User = { id: studentId, name, username, role: 'student', classId, password };
    
    setDoc(doc(db, 'users', studentId), newUser);
    
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      updateDoc(doc(db, 'classes', classId), {
        studentIds: [...cls.studentIds, studentId]
      });
    }
  }, [db, classes]);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    setDoc(doc(db, 'assignments', id), { ...assignment, id });
  }, [db]);

  const submitWork = useCallback(async (submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newSubmission = { 
      ...submission, 
      id,
      submittedAt: new Date().toISOString()
    };
    setDoc(doc(db, 'submissions', id), newSubmission);
  }, [db]);

  const gradeSubmission = useCallback(async (id: string, grade: number, feedback: string) => {
    if (!db) return;
    updateDoc(doc(db, 'submissions', id), { grade, feedback });
  }, [db]);

  return {
    isLoaded, currentUser, classes, users, assignments, submissions,
    login, logout, addClass, addStudent, addAssignment, submitWork, gradeSubmission
  };
}
