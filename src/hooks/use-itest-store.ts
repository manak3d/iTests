
'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDocs, query, limit } from 'firebase/firestore';
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

  // Load session from sessionStorage for faster UI (only for the current logged-in user)
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

  // Seeding initial data if empty - Creates the main teacher account
  useEffect(() => {
    if (!db) return;

    const seedData = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
        if (usersSnap.empty) {
          const defaultTeacher: User = {
            id: 'default-teacher',
            name: 'Hlavní učitel',
            role: 'teacher',
            username: 'ucitel',
            password: '123'
          };
          await setDoc(doc(db, 'users', defaultTeacher.id), defaultTeacher);
          console.log("Database seeded with default teacher account.");
        }
      } catch (error) {
        console.error("Error seeding data:", error);
      }
    };

    seedData();
  }, [db]);

  // Real-time sync with Firestore collections
  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id } as User)));
      setIsLoaded(true);
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(d => {
        const data = d.data();
        return { 
          ...data, 
          id: d.id, 
          studentIds: data.studentIds || [] 
        } as Class;
      }));
    });

    const unsubAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
      setAssignments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Assignment)));
    });

    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
      setSubmissions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Submission)));
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
    try {
      await setDoc(doc(db, 'classes', classId), newClass);
    } catch (e) {
      console.error("Error adding class", e);
      toast({ title: "Chyba při ukládání třídy", variant: "destructive" });
    }
  }, [db, currentUser, toast]);

  const addStudent = useCallback(async (classId: string, name: string, username: string, password?: string) => {
    if (!db) return;
    const studentId = Math.random().toString(36).substring(2, 11);
    const newUser: User = { id: studentId, name, username, role: 'student', classId, password };
    
    try {
      await setDoc(doc(db, 'users', studentId), newUser);
      const cls = classes.find(c => c.id === classId);
      if (cls) {
        await updateDoc(doc(db, 'classes', classId), {
          studentIds: [...(cls.studentIds || []), studentId]
        });
      }
    } catch (e) {
      console.error("Error adding student", e);
      toast({ title: "Chyba při přidávání žáka", variant: "destructive" });
    }
  }, [db, classes, toast]);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    try {
      await setDoc(doc(db, 'assignments', id), { ...assignment, id });
    } catch (e: any) {
      console.error("Error adding assignment", e);
      toast({ title: "Chyba při publikování práce", description: e.message, variant: "destructive" });
    }
  }, [db, toast]);

  const submitWork = useCallback(async (submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newSubmission = { 
      ...submission, 
      id,
      submittedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'submissions', id), newSubmission);
    } catch (e) {
      console.error("Error submitting work", e);
      toast({ title: "Chyba při odevzdávání", variant: "destructive" });
    }
  }, [db, toast]);

  const gradeSubmission = useCallback(async (id: string, grade: number, feedback: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'submissions', id), { grade, feedback });
    } catch (e) {
      console.error("Error grading submission", e);
      toast({ title: "Chyba při ukládání známky", variant: "destructive" });
    }
  }, [db, toast]);

  return {
    isLoaded, currentUser, classes, users, assignments, submissions,
    login, logout, addClass, addStudent, addAssignment, submitWork, gradeSubmission
  };
}
