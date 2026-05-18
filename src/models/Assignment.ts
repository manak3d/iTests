import mongoose, { Schema, Document, Model } from "mongoose";

// Question Sub-Schema
export interface IQuestion {
  id: string; // Vlastní ID uvnitř testu
  type: string; // 'short_answer' | 'long_answer' | 'multiple_choice' | 'true_false' | 'drawing'
  text: string;
  options?: string[];
  correctAnswer?: mongoose.Schema.Types.Mixed;
  points?: number;
}

const QuestionSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  text: { type: String, required: true },
  options: { type: [String] },
  correctAnswer: { type: Schema.Types.Mixed },
  points: { type: Number, default: 1 }
}, { _id: false }); // Vypnutí _id pro pod-dokumenty, protože používáme vlastní id z Firebase pole

export interface IAssignment extends Document<string> {
  _id: string; // Vlastní ID kompatibilní s Firebase
  title: string;
  description: string;
  classId: string; // Vazba na Classroom
  questions: IQuestion[];
  dueDate: string;
  fileUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    classId: { type: String, required: true },
    questions: { type: [QuestionSchema], default: [] },
    dueDate: { type: String, required: true },
    fileUri: { type: String }
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
