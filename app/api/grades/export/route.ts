import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    // Ensure getAll uses parameterized queries internally
    const grades = await db.grades.getAll();

    if (!grades || grades.length === 0) {
      return NextResponse.json({ error: 'No grades found' }, { status: 404 });
    }

    const csvHeaders = 'Student ID,Course ID,Grade\n';
    const csvRows = grades.map((grade) => `${grade.studentId},${grade.courseId},${grade.grade}`).join('\n');
    const csvContent = csvHeaders + csvRows;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="grades.csv"',
      },
    });
  } catch (error) {
    // Log the error appropriately in a real-world scenario
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}