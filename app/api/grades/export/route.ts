import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const [grades, students, courses] = await Promise.all([
      db.grades.getAll(),
      db.students.getAll(),
      db.courses.getAll(),
    ]);

    if (!grades || grades.length === 0) {
      return NextResponse.json({ error: 'No grades found' }, { status: 404 });
    }

    const header = 'Student Name,Course Name,Grade,Score,Semester\n';
    const rows = grades
      .map((g) => {
        const student = students.find((s) => s.id === g.student_id)?.name ?? '';
        const course = courses.find((c) => c.id === g.course_id)?.name ?? '';
        return `"${student}","${course}","${g.grade}",${g.score},"${g.semester}"`;
      })
      .join('\n');

    return new NextResponse(header + rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="grades.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
