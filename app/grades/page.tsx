import React, { FC } from 'react';
import { fetchGrades, fetchStudents, fetchCourses } from '@/lib/api';
import { parseToCSV } from '@/lib/csvParser';
import { Button } from '@/components/Button';

interface Grade {
  // Define the structure of a grade object
}

interface Student {
  // Define the structure of a student object
}

interface Course {
  // Define the structure of a course object
}

const GradesPage: FC = () => {
  const [grades, setGrades] = React.useState<Grade[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const [gradesData, studentsData, coursesData] = await Promise.all([
        fetchGrades(),
        fetchStudents(),
        fetchCourses(),
      ]);
      setGrades(gradesData);
      setStudents(studentsData);
      setCourses(coursesData);
    };
    fetchData();
  }, []);

  const sanitizeData = (data: string): string => {
    return data.replace(/"/g, '""');
  };

  const exportToCSV = () => {
    const sanitizedGrades = grades.map(grade => ({
      ...grade,
      // Sanitize each field as necessary
    }));
    const sanitizedStudents = students.map(student => ({
      ...student,
      // Sanitize each field as necessary
    }));
    const sanitizedCourses = courses.map(course => ({
      ...course,
      // Sanitize each field as necessary
    }));
    const csvData = parseToCSV(sanitizedGrades, sanitizedStudents, sanitizedCourses);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'grades.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Grades</h1>
      <Button onClick={exportToCSV} className="bg-blue-500 text-white px-4 py-2 rounded">
        Export Grades as CSV
      </Button>
    </div>
  );
};

export default GradesPage;