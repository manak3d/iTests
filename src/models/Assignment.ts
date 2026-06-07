import mongoose, { Schema, Document, Model } from "mongoose";

// Question Sub-Schema
export interface IQuestion {
  id: string; // Vlastní ID uvnitř testu
  type: string; // 'short_answer' | 'long_answer' | 'multiple_choice' | 'axis' | 'number_line' | 'true_false' | 'drawing' | 'graph' | 'matching'
  text: string;
  options?: string[];
  correctAnswer?: mongoose.Schema.Types.Mixed;
  points?: number;
  graphType?: string; // 'pie' | 'bar' | 'linear'
  graphData?: any;
  numPracticeQuestions?: number;
  useAiForPractice?: boolean;
  practiceQuestions?: IQuestion[];
}

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  text: { type: String, default: "" },
  options: { type: [String] },
  correctAnswer: { type: Schema.Types.Mixed },
  points: { type: Number, default: 1 },
  graphType: { type: String },
  graphData: { type: Schema.Types.Mixed },
  numPracticeQuestions: { type: Number, default: 0 },
  useAiForPractice: { type: Boolean, default: false },
  practiceQuestions: { type: [Schema.Types.Mixed], default: [] }
}, { _id: false }); // Vypnutí _id pro pod-dokumenty, protože používáme vlastní id z Firebase pole

export interface IAssignment extends Document<string> {
  _id: string; // Vlastní ID kompatibilní s Firebase
  title: string;
  description: string;
  classId: string; // Vazba na Classroom
  teacherId?: string; // Vazba na učitele (vlastník zadání)
  subject?: string;
  questions: IQuestion[];
  dueDate: string;
  fileUri?: string;
  startTime?: string;
  endTime?: string;
  studentIds?: string[];
  sharedWithClassIds?: string[]; // Sdílení do dalších tříd (původní classId zůstává)
  gradeThresholds?: number[];
  isDraft?: boolean; // Koncept — není viditelný pro žáky
  schoolId: string; // přidáno pro multi-school
  isPublicTemplate?: boolean;
  timeLimit?: number; // v minutách, 0 = bez limitu
  isPractice?: boolean; // Typ úkolu: Procvičování (neznámkované)
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    classId: { type: String, required: true },
    teacherId: { type: String }, // Vazba na učitele, nepovinné kvůli kompatibilitě
    subject: { type: String, default: "Jiný" },
    questions: { type: [QuestionSchema], default: [] },
    dueDate: { type: String, required: true },
    fileUri: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    studentIds: { type: [String], default: [] },
    sharedWithClassIds: { type: [String], default: [] },
    gradeThresholds: { type: [Number], default: [85, 65, 45, 25] },
    isDraft: { type: Boolean, default: false },
    isPublicTemplate: { type: Boolean, default: false },
    timeLimit: { type: Number, default: 0 },
    isPractice: { type: Boolean, default: false },
    schoolId: { type: String, required: true } // povinné pro rozdělení škol
  },
  {
    timestamps: true,
  }
);

// Delete cached model to pick up schema changes during hot-reload
if (mongoose.models.Assignment) {
  delete mongoose.models.Assignment;
}
export const Assignment: Model<IAssignment> =
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);
