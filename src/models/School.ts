import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchool extends Document {
  name: string;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  }
);

export const School: Model<ISchool> =
  mongoose.models.School || mongoose.model<ISchool>("School", SchoolSchema);
