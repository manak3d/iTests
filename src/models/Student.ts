import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  firstName: string;
  lastName: string;
  email?: string; // e-mail pro žáka může být nepovinný
  username: string;
  password?: string;
  passwordPlain?: string;
  role: string;
  classroomId: string;
  schoolId: string; // přidáno pro multi-school
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    passwordPlain: { type: String },
    role: { type: String, default: "student" },
    classroomId: { type: String, required: true }, // Změněno na String pro kompatibilitu s Firebase ID
    schoolId: { type: String, required: true }, // povinné pro rozdělení škol
  },
  {
    timestamps: true,
  }
);

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
