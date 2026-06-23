import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiLog extends Document {
  teacherId: string;
  schoolId: string;
  prompt: string;
  contextText?: string;
  fileName?: string;
  response: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiLogSchema: Schema = new Schema(
  {
    teacherId: { type: String, required: true },
    schoolId: { type: String, required: true },
    prompt: { type: String, required: true },
    contextText: { type: String },
    fileName: { type: String },
    response: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const AiLog: Model<IAiLog> =
  mongoose.models.AiLog || mongoose.model<IAiLog>("AiLog", AiLogSchema);
