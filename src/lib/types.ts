export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  password?: string;
  classId?: string;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
}

export type QuestionType = 'short_answer' | 'long_answer' | 'multiple_choice' | 'true_false' | 'drawing';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string | number | boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  questions: Question[];
  dueDate: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: Record<string, any>; // Stores text or drawing data per question ID
  questionDrawings: Record<string, string>; // Maps questionId to base64 drawing
  submittedAt: string;
  grade?: number; // 1-5
  feedback?: string;
}

export const GRADES = [
  { value: 1, label: 'Výborně', emoji: '🤩' },
  { value: 2, label: 'Chvalitebně', emoji: '😊' },
  { value: 3, label: 'Dobře', emoji: '😐' },
  { value: 4, label: 'Dostatečně', emoji: '😟' },
  { value: 5, label: 'Nedostatečně', emoji: '😢' },
];
