import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id: studentId } = params;
  const { courseId } = await request.json();

  if (!studentId || !courseId) {
    return NextResponse.json({ error: 'Student ID and Course ID are required' }, { status: 400 });
  }

  const db = getDb();

  try {
    const student = await db.students.getById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const course = await db.courses.getById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const enrollment = await db.grades.create({
      student_id: studentId,
      course_id: courseId,
      score: 0,
      grade: '',
      semester: '',
    });

    return NextResponse.json({ data: enrollment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
