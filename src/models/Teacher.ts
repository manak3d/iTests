import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeacher extends Document {
  firstName: string;
  lastName: string;
  email: string;
  username: string; // přidáno pro login
  password?: string; // přidáno pro login (hashované heslo)
  role: string; // "teacher"
  subjects?: string[];
  schoolId?: string; // přidáno pro multi-school
  isPremium?: boolean;
  premiumExpiresAt?: Date;
  passwordPlain?: string;
  aiCredits?: number;
  aiCreditsMax?: number;
  aiExtraCredits?: number;
  premiumType?: string; // 'monthly' | 'yearly' | 'trial'
  aiCreditsResetDate?: Date | null;
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
    passwordPlain: { type: String }, // Čitelné heslo pro admina
    role: { type: String, default: "teacher" },
    subjects: { type: [String], default: [] },
    schoolId: { type: String }, // nepovinné (admin nemá, učitel má)
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date },
    aiCredits: { type: Number, default: 30 },
    aiCreditsMax: { type: Number, default: 30 },
    aiExtraCredits: { type: Number, default: 0 },
    premiumType: { type: String, enum: ['monthly', 'yearly', 'trial'], default: 'trial' },
    aiCreditsResetDate: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const Teacher: Model<ITeacher> =
  mongoose.models.Teacher || mongoose.model<ITeacher>("Teacher", TeacherSchema);
