import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Teacher } from '@/models/Teacher';
import { getUserSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession();
    if (!session || (session.id !== params.id && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, prompt } = await request.json();

    if (!title || !prompt) {
      return NextResponse.json({ error: 'Missing title or prompt' }, { status: 400 });
    }

    await connectToDatabase();

    const teacher = await Teacher.findById(params.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    teacher.customAiTemplates = teacher.customAiTemplates || [];
    teacher.customAiTemplates.push({ title, prompt });

    await teacher.save();

    return NextResponse.json({ success: true, customAiTemplates: teacher.customAiTemplates });
  } catch (error: any) {
    console.error('Error saving template:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
