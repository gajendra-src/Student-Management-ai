import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const studentId = params.id;
  const courseId = req.nextUrl.searchParams.get('courseId');

  if (!studentId || !courseId) {
    return NextResponse.json({ error: 'Student ID and Course ID are required' }, { status: 400 });
  }

  const db = getDb();

  try {
    const student = await db.students.getById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const grades = await db.grades.getAll();
    const enrollment = grades.find(
      (g) => g.student_id === studentId && g.course_id === courseId,
    );

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    await db.grades.delete(enrollment.id);
    return NextResponse.json({ data: { message: 'Unenrolled successfully' } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
