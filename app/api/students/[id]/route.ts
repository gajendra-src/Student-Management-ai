import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const student = await db.students.getById(id);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const grades = await db.grades.getAll();
    const courses = await db.courses.getAll();

    const enrolledCourseIds = grades
      .filter((g) => g.student_id === id)
      .map((g) => g.course_id);
    const studentCourses = courses.filter((c) => enrolledCourseIds.includes(c.id));

    return NextResponse.json({ data: { ...student, courses: studentCourses } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
