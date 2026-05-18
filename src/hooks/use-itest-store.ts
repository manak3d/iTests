"use client";

import { useState, useEffect } from 'react';
import { User, Class, Assignment, Submission, Role } from '@/lib/types';

export function useITestStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('itest_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setClasses(parsed.classes || []);
      setUsers(parsed.users || []);
      setAssignments(parsed.assignments || []);
      setSubmissions(parsed.submissions || []);
      
      const sessionUser = sessionStorage.getItem('itest_session');
      if (sessionUser) setCurrentUser(JSON.parse(sessionUser));
    } else {
      // Seed initial data for demo
      const demoTeacher = { id: 't1', name: 'Dr. Smith', role: 'teacher' as Role, username: 'smith' };
      setUsers([demoTeacher]);
      localStorage.setItem('itest_data', JSON.stringify({ users: [demoTeacher], classes: [], assignments: [], submissions: [] }));
    }
    setIsLoaded(true);
  }, []);

  const saveData = (updates: any) => {
    const data = {
      classes,
      users,
      assignments,
      submissions,
      ...updates
    };
    localStorage.setItem('itest_data', JSON.stringify(data));
  };

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
    const newClass: Class = { id: Math.random().toString(36).substr(2, 9), name, teacherId: currentUser.id, studentIds: [] };
    const updated = [...classes, newClass];
    setClasses(updated);
    saveData({ classes: updated });
  };

  const addStudent = (classId: string, name: string, username: string) => {
    const studentId = Math.random().toString(36).substr(2, 9);
    const newUser: User = { id: studentId, name, username, role: 'student', classId };
    const updatedUsers = [...users, newUser];
    const updatedClasses = classes.map(c => 
      c.id === classId ? { ...c, studentIds: [...c.studentIds, studentId] } : c
    );
    setUsers(updatedUsers);
    setClasses(updatedClasses);
    saveData({ users: updatedUsers, classes: updatedClasses });
  };

  const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment = { ...assignment, id: Math.random().toString(36).substr(2, 9) };
    const updated = [...assignments, newAssignment];
    setAssignments(updated);
    saveData({ assignments: updated });
  };

  const submitWork = (submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    const newSubmission = { 
      ...submission, 
      id: Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString()
    };
    const updated = [...submissions, newSubmission];
    setSubmissions(updated);
    saveData({ submissions: updated });
  };

  const gradeSubmission = (id: string, grade: number, feedback: string) => {
    const updated = submissions.map(s => s.id === id ? { ...s, grade, feedback } : s);
    setSubmissions(updated);
    saveData({ submissions: updated });
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