import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmission extends Document<string> {
  _id: string; // Vlastní ID kompatibilní s Firebase
  assignmentId: string; // Vazba na Assignment
  studentId: string; // Vazba na Student
  answers: Map<string, any>; // Record<string, any> mapovaný jako Map
  questionDrawings: Map<string, string>; // Kresby k otázkám
  mainWorkDrawing?: string; // Hlavní nákres
  submittedAt: string;
  grade?: number; // 1-5
  feedback?: string;
  questionScores?: Map<string, number>; // Body za konkrétne otázky
  schoolId: string; // přidáno pro multi-school
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    assignmentId: { type: String, required: true },
    studentId: { type: String, required: true },
    answers: { type: Map, of: Schema.Types.Mixed, default: {} },
    questionDrawings: { type: Map, of: String, default: {} },
    mainWorkDrawing: { type: String },
    submittedAt: { type: String, required: true },
    grade: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    questionScores: { type: Map, of: Number, default: {} },
    schoolId: { type: String, required: true } // povinné pro rozdělení škol
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Submission) {
  delete mongoose.models.Submission;
}
export const Submission: Model<ISubmission> =
  mongoose.model<ISubmission>("Submission", SubmissionSchema);
