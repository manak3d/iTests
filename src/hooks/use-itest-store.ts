
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, setDoc, updateDoc, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function useITestStore() {
  const db = useFirestore();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Real-time sync with Firestore collections
  useEffect(() => {
    if (!db) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const fetchedUsers = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
      setUsers(fetchedUsers);
      
      // Sync currentUser if already logged in via session
      const sessionUserStr = sessionStorage.getItem('itest_session');
      if (sessionUserStr) {
        try {
          const sessionUser = JSON.parse(sessionUserStr);
          const freshUser = fetchedUsers.find(u => u.id === sessionUser.id);
          if (freshUser) {
            setCurrentUser(freshUser);
          }
        } catch (e) {}
      }
      
      setLoadingStates(prev => ({ ...prev, users: false }));
    }, (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' }));
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
  }, [db]);

  // Seeding initial teacher if DB is empty (only if confirmed empty after load)
  useEffect(() => {
    if (!db || !isLoaded) return;

    if (users.length === 0) {
      const defaultTeacherId = 'default-teacher';
      const defaultTeacher: User = {
        id: defaultTeacherId,
        name: 'Hlavní učitel',
        role: 'teacher',
        username: 'ucitel',
        password: '123'
      };
      setDoc(doc(db, 'users', defaultTeacherId), defaultTeacher)
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${defaultTeacherId}`, operation: 'create', requestResourceData: defaultTeacher }));
        });
    }
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
    
    setDoc(doc(db, 'classes', classId), newClass)
      .then(() => {
        toast({ title: "Třída vytvořena", description: "Třída byla uložena do cloudu." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `classes/${classId}`, operation: 'create', requestResourceData: newClass }));
      });
  }, [db, currentUser, toast]);

  const addStudent = useCallback((classId: string, name: string, username: string, password?: string) => {
    if (!db) return;
    const studentId = Math.random().toString(36).substring(2, 11);
    const newUser: User = { id: studentId, name, username, role: 'student', classId, password };
    
    setDoc(doc(db, 'users', studentId), newUser)
      .then(() => {
        const cls = classes.find(c => c.id === classId);
        if (cls) {
          updateDoc(doc(db, 'classes', classId), {
            studentIds: [...(cls.studentIds || []), studentId]
          }).catch(async (err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `classes/${classId}`, operation: 'update' }));
          });
        }
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${studentId}`, operation: 'create', requestResourceData: newUser }));
      });
  }, [db, classes]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newAssignment = { ...assignment, id };
    
    setDoc(doc(db, 'assignments', id), newAssignment)
      .then(() => {
        toast({ title: "Práce publikována", description: "Úkol je nyní dostupný pro žáky v cloudu." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `assignments/${id}`, operation: 'create', requestResourceData: newAssignment }));
      });
  }, [db, toast]);

  const submitWork = useCallback((submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 11);
    const newSubmission = { 
      ...submission, 
      id,
      submittedAt: new Date().toISOString()
    };
    
    setDoc(doc(db, 'submissions', id), newSubmission)
      .then(() => {
        toast({ title: "Odevzdáno", description: "Vaše práce byla uložena do cloudu." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${id}`, operation: 'create', requestResourceData: newSubmission }));
      });
  }, [db, toast]);

  const gradeSubmission = useCallback((id: string, grade: number, feedback: string) => {
    if (!db) return;
    updateDoc(doc(db, 'submissions', id), { grade, feedback })
      .then(() => {
        toast({ title: "Oznámkováno", description: "Hodnocení bylo uloženo v cloudu." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `submissions/${id}`, operation: 'update' }));
      });
  }, [db, toast]);

  return {
    isLoaded, currentUser, classes, users, assignments, submissions,
    login, logout, addClass, addStudent, addAssignment, submitWork, gradeSubmission
  };
}
