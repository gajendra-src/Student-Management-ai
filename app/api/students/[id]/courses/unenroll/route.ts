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

    const course = await db.courses.getById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Assuming there's a method to unenroll a student from a course
    const updatedStudent = await db.students.update(studentId, {
      courses: student.courses.filter((id: string) => id !== courseId),
    });

    return NextResponse.json({ data: updatedStudent }, { status: 200 });
  } catch (error) {
    // Log the error appropriately in a real-world scenario
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}