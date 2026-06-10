import { getDb } from '@/lib/db';
import DataTable from '@/components/DataTable';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  enrollment_date: string;
  created_at: string;
};

type Grade = {
  id: string;
  student_id: string;
  course_id: string;
  grade: string;
  score: number;
  semester: string;
  created_at: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  instructor: string;
  created_at: string;
};

export default async function StudentPage({ params }: { params: { id: string } }) {
  const { students, grades, courses } = await getDb();
  const student = await students.getById(params.id);
  const allGrades = await grades.getAll();
  const allCourses = await courses.getAll();
  const studentGrades = allGrades.filter((g: Grade) => g.student_id === params.id);

  const columns = [
    { key: 'course', label: 'Course' },
    { key: 'grade', label: 'Grade' },
    { key: 'score', label: 'Score' },
    { key: 'semester', label: 'Semester' },
  ];

  const data = studentGrades.map((grade: Grade) => {
    const course = allCourses.find((c: Course) => c.id === grade.course_id);
    return {
      course: course ? course.name : 'Unknown',
      grade: grade.grade,
      score: grade.score,
      semester: grade.semester,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <h1 className="text-2xl font-bold mb-4">{student?.name}</h1>
        <p className="mb-2">Email: {student?.email}</p>
        <p className="mb-2">Phone: {student?.phone}</p>
        <p className="mb-2">Address: {student?.address}</p>
        <p className="mb-2">Enrolled: {student?.enrollment_date}</p>
        <DataTable columns={columns} data={data} />
      </div>
      <Footer />
    </div>
  );
}
