import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeacher extends Document {
  firstName: string;
  lastName: string;
  email: string;
  username: string; // přidáno pro login
  password?: string; // přidáno pro login (hashované heslo)
  role: string; // "teacher"
  subjects?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Heslo nebude standardně zasíláno při dotazech do DB
    role: { type: String, default: "teacher" },
    subjects: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Teacher: Model<ITeacher> =
  mongoose.models.Teacher || mongoose.model<ITeacher>("Teacher", TeacherSchema);
