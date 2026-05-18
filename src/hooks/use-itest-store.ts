
"use client";

import { useState, useEffect, useCallback } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';

export function useITestStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    const savedData = localStorage.getItem('itest_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setClasses(parsed.classes || []);
        setUsers(parsed.users || []);
        setAssignments(parsed.assignments || []);
        setSubmissions(parsed.submissions || []);
      } catch (e) {
        console.error("Failed to parse itest_data", e);
      }
    } else {
      // Seed initial data for demo
      const demoTeacher = { id: 't1', name: 'Dr. Smith', role: 'teacher' as Role, username: 'smith' };
      setUsers([demoTeacher]);
    }

    const sessionUser = sessionStorage.getItem('itest_session');
    if (sessionUser) {
      try {
        setCurrentUser(JSON.parse(sessionUser));
      } catch (e) {
        console.error("Failed to parse itest_session", e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Persistent sync to localStorage whenever data changes
  useEffect(() => {
    if (!isLoaded) return;
    const data = {
      classes,
      users,
      assignments,
      submissions
    };
    localStorage.setItem('itest_data', JSON.stringify(data));
  }, [classes, users, assignments, submissions, isLoaded]);

  const login = (role: Role, username: string) => {
    const user = users.find(u => u.username === username && u.role === role);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('itest_session', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('itest_session');
  };

  const addClass = (name: string) => {
    if (!currentUser) return;
    const newClass: Class = { 
      id: Math.random().toString(36).substr(2, 9), 
      name, 
      teacherId: currentUser.id, 
      studentIds: [] 
    };
    setClasses(prev => [...prev, newClass]);
  };

  const addStudent = (classId: string, name: string, username: string) => {
    const studentId = Math.random().toString(36).substr(2, 9);
    const newUser: User = { id: studentId, name, username, role: 'student', classId };
    
    setUsers(prev => [...prev, newUser]);
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, studentIds: [...c.studentIds, studentId] } : c
    ));
  };

  const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment = { ...assignment, id: Math.random().toString(36).substr(2, 9) };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const submitWork = (submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    const newSubmission = { 
      ...submission, 
      id: Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString()
    };
    setSubmissions(prev => [...prev, newSubmission]);
  };

  const gradeSubmission = (id: string, grade: number, feedback: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, grade, feedback } : s));
  };

  return {
    isLoaded,
    currentUser,
    classes,
    users,
    assignments,
    submissions,
    login,
    logout,
    addClass,
    addStudent,
    addAssignment,
    submitWork,
    gradeSubmission
  };
}
