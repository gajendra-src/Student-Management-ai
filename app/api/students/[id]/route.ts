import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  try {
    const { students, courses } = getDb();
    const student = await students.getById(id); // Assuming getById is a safe ORM method

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const enrolledCourses = await courses.getAll();
    const studentCourses = enrolledCourses.filter(course => course.studentIds.includes(id));

    const studentProfile = {
      ...student,
      courses: studentCourses,
    };

    return NextResponse.json({ data: studentProfile }, { status: 200 });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}