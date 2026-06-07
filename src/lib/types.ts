export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  password?: string;
  classId?: string;
  schoolId?: string; // přidáno pro multi-school
  isPremium?: boolean;
  premiumExpiresAt?: string;
  createdAt?: string; // přidáno pro výpočet trialu
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  schoolId?: string; // přidáno pro multi-school
}

export type QuestionType = 'short_answer' | 'long_answer' | 'multiple_choice' | 'axis' | 'number_line' | 'true_false' | 'drawing' | 'graph' | 'matching';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: any; // mixed type for graph and other questions
  points?: number; // Body za otázku
  graphType?: 'pie' | 'bar' | 'linear';
  graphData?: any;
  numPracticeQuestions?: number;
  useAiForPractice?: boolean;
  practiceQuestions?: Question[];
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
  startTime?: string;
  endTime?: string;
  studentIds?: string[];
  sharedWithClassIds?: string[]; // Sdílení do dalších tříd
  gradeThresholds?: number[]; // [t1, t2, t3, t4] např. [85, 65, 45, 25]
  isDraft?: boolean; // Koncept — není viditelný pro žáky
  schoolId?: string; // přidáno pro multi-school
  isPublicTemplate?: boolean;
  timeLimit?: number; // v minutách
  isPractice?: boolean; // Typ úkolu: Procvičování (neznámkované)
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answers: Record<string, any>;
  questionDrawings: Record<string, string>;
  mainWorkDrawing?: string; // Drawing on the main document
  submittedAt: string;
  startedAt?: string;
  tabFocusLostCount?: number;
  lastActiveAt?: string;
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
