import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  const db = getDb();

  try {
    const student = await db.students.getById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const grades = await db.grades.getAll();
    const courses = await db.courses.getAll();

    const enrolledCourses = grades
      .filter((grade) => grade.student_id === id)
      .map((grade) => {
        const course = courses.find((c) => c.id === grade.course_id);
        if (course) {
          return { courseId: course.id, courseName: course.name, grade: grade.grade };
        }
        return null;
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    return NextResponse.json({ data: enrolledCourses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
