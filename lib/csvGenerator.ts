import { Grade, Student, Course } from '@/lib/db';

export function generateGradesCSV(
  grades: Grade[],
  students: Student[],
  courses: Course[],
): string {
  const header = 'Student Name,Course Name,Grade,Score,Semester\n';
  const rows = grades
    .map((g) => {
      const student = students.find((s) => s.id === g.student_id)?.name ?? '';
      const course = courses.find((c) => c.id === g.course_id)?.name ?? '';
      return `"${student}","${course}","${g.grade}",${g.score},"${g.semester}"`;
    })
    .join('\n');
  return header + rows;
}
