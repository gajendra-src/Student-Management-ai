import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  const db = getDb();

  try {
    const student = await db.students.getById(id); // Assuming getById is a safe ORM method
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const grades = await db.grades.getAll(); // Assuming getAll is a safe ORM method
    const courses = await db.courses.getAll(); // Assuming getAll is a safe ORM method

    const enrolledCourses = grades
      .filter(grade => grade.studentId === id)
      .map(grade => {
        const course = courses.find(course => course.id === grade.courseId);
        if (course) {
          return {
            courseId: course.id,
            courseName: course.name,
            grade: grade.grade,
          };
        }
        return null;
      })
      .filter(course => course !== null);

    return NextResponse.json({ data: enrolledCourses }, { status: 200 });
  } catch (error) {
    // Ideally, log the error to a logging service
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}