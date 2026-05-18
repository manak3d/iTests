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

export type QuestionType = 'short_answer' | 'long_answer' | 'multiple_choice' | 'true_false';

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
  answers: Record<string, any>;
  drawings?: string[]; // Base64 canvas data
  submittedAt: string;
  grade?: number; // 1-5
  feedback?: string;
}

export const GRADES = [
  { value: 1, label: 'Excellent', emoji: '🤩' },
  { value: 2, label: 'Very Good', emoji: '😊' },
  { value: 3, label: 'Good', emoji: '😐' },
  { value: 4, label: 'Sufficient', emoji: '😟' },
  { value: 5, label: 'Failed', emoji: '😢' },
];
