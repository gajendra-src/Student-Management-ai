import { getDb } from '@/lib/db';
import DataTable from '@/components/DataTable';

export default async function GradesPage() {
  const db = getDb();
  const [grades, students, courses] = await Promise.all([
    db.grades.getAll(),
    db.students.getAll(),
    db.courses.getAll(),
  ]);

  const data = grades.map((grade) => ({
    id: grade.id,
    studentName: students.find((s) => s.id === grade.student_id)?.name ?? 'Unknown',
    courseName: courses.find((c) => c.id === grade.course_id)?.name ?? 'Unknown',
    grade: grade.grade,
    score: grade.score,
    semester: grade.semester,
  }));

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'courseName', label: 'Course' },
    { key: 'grade', label: 'Grade' },
    { key: 'score', label: 'Score' },
    { key: 'semester', label: 'Semester' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Grades</h1>
        <a
          href="/api/grades/export"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Export CSV
        </a>
      </div>
      <DataTable columns={columns} data={data} emptyMessage="No grades found." />
    </div>
  );
}
