import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  schoolId?: string;
  content: string;
  status: 'pending' | 'resolved';
  adminReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    teacherId: { type: String, required: true },
    teacherName: { type: String, required: true },
    teacherEmail: { type: String, required: true },
    schoolId: { type: String },
    content: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    adminReply: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);
