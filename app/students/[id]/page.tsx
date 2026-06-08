import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FC } from 'react';
import { StudentProfile } from '@/components/StudentProfile';
import { DataTable } from '@/components/DataTable';

interface Student {
  id: string;
  name: string;
  age: number;
  email: string;
  courses: Course[];
  grades: Grade[];
  // Add other student properties as needed
}

interface Course {
  id: string;
  name: string;
  instructor: string;
  description: string;
  // Add other course properties as needed
}

interface Grade {
  courseId: string;
  grade: string;
  courseName: string;
  // Add other grade properties as needed
}

interface StudentDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Student Detail',
};

const StudentDetailPage: FC<StudentDetailPageProps> = async ({ params }) => {
  const studentId = params.id;
  
  const [student, courses, grades] = await Promise.all([
    fetchStudent(studentId),
    fetchCourses(studentId),
    fetchGrades(studentId),
  ]);

  if (!student) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <StudentProfile student={student} />
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Enrolled Courses</h2>
        <DataTable data={courses} columns={['Course Name', 'Instructor']} />
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Grades</h2>
        <DataTable data={grades} columns={['Course Name', 'Grade']} />
      </div>
    </div>
  );
};

async function fetchStudent(id: string): Promise<Student | null> {
  const res = await fetch(`/api/students/${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchCourses(studentId: string): Promise<Course[]> {
  const res = await fetch(`/api/courses?studentId=${studentId}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchGrades(studentId: string): Promise<Grade[]> {
  const res = await fetch(`/api/grades?studentId=${studentId}`);
  if (!res.ok) return [];
  return res.json();
}

export default StudentDetailPage;