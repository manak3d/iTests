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
  points?: number; // Body za otázku
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  teacherId?: string; // ID of the teacher who created the assignment
  subject?: string;
  questions: Question[];
  dueDate: string;
  fileUri?: string; // Original document as data URI (PDF snapshot or Image)
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: Record<string, any>;
  questionDrawings: Record<string, string>;
  mainWorkDrawing?: string; // Drawing on the main document
  submittedAt: string;
  grade?: number; // 1-5
  feedback?: string;
  questionScores?: Record<string, number>; // Udelené body učiteľom
}

export const GRADES = [
  { value: 1, label: 'Výborně', emoji: '🤩' },
  { value: 2, label: 'Chvalitebně', emoji: '😊' },
  { value: 3, label: 'Dobře', emoji: '😐' },
  { value: 4, label: 'Dostatečně', emoji: '😟' },
  { value: 5, label: 'Nedostatečně', emoji: '😢' },
];
