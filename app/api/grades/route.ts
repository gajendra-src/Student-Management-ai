import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const data = await db.grades.getAll();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/grades error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, course_id, grade, score, semester } = body;

    if (!student_id || !course_id || !grade || score === undefined) {
      return NextResponse.json(
        { error: 'student_id, course_id, grade, and score are required' },
        { status: 400 },
      );
    }

    const db = getDb();
    const record = await db.grades.create({ student_id, course_id, grade, score, semester });
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error('POST /api/grades error:', error);
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 });
  }
}
