import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClassroom extends Document<string> {
  _id: string; // Vlastní ID kompatibilní s Firebase
  name: string; // např. "1.A", "3.B"
  teacherId: string; // Třídní učitel
  year: number; // Školní rok (např. 2024 pro 2024/2025)
  studentIds: string[]; // Odkazy na žáky
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    teacherId: { type: String, required: true },
    year: { type: Number, required: true },
    studentIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Classroom: Model<IClassroom> =
  mongoose.models.Classroom ||
  mongoose.model<IClassroom>("Classroom", ClassroomSchema);
