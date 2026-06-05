import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export interface UserSession {
  id: string;
  username: string;
  role: string;
  name: string;
  schoolId?: string;
  classId?: string;
}

export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    
    const secret = process.env.JWT_SECRET || "default_secret_key";
    return jwt.verify(token, secret) as UserSession;
  } catch (error) {
    return null;
  }
}
