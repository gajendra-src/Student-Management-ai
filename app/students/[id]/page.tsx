import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import DataTable from '@/components/DataTable';

interface Props {
  params: { id: string };
}

export default async function StudentDetailPage({ params }: Props) {
  const db = getDb();
  const student = await db.students.getById(params.id);
  if (!student) notFound();

  const [grades, courses] = await Promise.all([db.grades.getAll(), db.courses.getAll()]);

  const enrolledCourses = grades
    .filter((g) => g.student_id === params.id)
    .map((g) => {
      const course = courses.find((c) => c.id === g.course_id);
      return { id: g.id, name: course?.name ?? '—', grade: g.grade, score: g.score, semester: g.semester };
    });

  const courseColumns = [
    { key: 'name', label: 'Course' },
    { key: 'grade', label: 'Grade' },
    { key: 'score', label: 'Score' },
    { key: 'semester', label: 'Semester' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="card mb-6">
        <h1 className="text-2xl font-bold mb-2">{student.name}</h1>
        <p className="text-gray-600">{student.email}</p>
        <p className="text-gray-600">{student.phone}</p>
        <p className="text-gray-500 text-sm mt-1">Enrolled: {student.enrollment_date}</p>
      </div>
      <h2 className="text-xl font-semibold mb-4">Enrolled Courses</h2>
      <DataTable columns={courseColumns} data={enrolledCourses} emptyMessage="No courses enrolled." />
    </div>
  );
}
