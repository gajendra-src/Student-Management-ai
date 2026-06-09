import { getDb } from '@/lib/db';
import DataTable from '@/components/DataTable';

export default async function ReportsPage() {
  const db = await getDb();
  const students = await db.students.getAll();
  const courses = await db.courses.getAll();
  const grades = await db.grades.getAll();

  const totalStudents = students.length;
  const totalCourses = courses.length;
  const averageGradeScore = grades.reduce((acc: number, grade: { score: number }) => acc + grade.score, 0) / grades.length;

  const columns: Array<{ key: string; label: string }> = [
    { key: 'totalStudents', label: 'Total Students' },
    { key: 'totalCourses', label: 'Total Courses' },
    { key: 'averageGradeScore', label: 'Average Grade Score' },
  ];

  const data = [
    {
      totalStudents,
      totalCourses,
      averageGradeScore: averageGradeScore.toFixed(2),
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
