import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface GradeRecord {
  studentId: string;
  courseId: string;
  grade: string;
}

export async function generateCSV(): Promise<NextResponse> {
  try {
    const { grades } = getDb();

    // Fetch all grade records using parameterized queries internally
    const gradeRecords: GradeRecord[] = await grades.getAll();

    if (!gradeRecords || gradeRecords.length === 0) {
      return NextResponse.json({ error: 'No grade records found' }, { status: 404 });
    }

    // Convert grade records to CSV format
    const csvHeader = 'Student ID,Course ID,Grade\n';
    const csvRows = gradeRecords.map(record => `${record.studentId},${record.courseId},${record.grade}`).join('\n');
    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="grades.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}