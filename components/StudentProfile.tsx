"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Course {
  id: string;
  name: string;
  description: string;
}

interface Grade {
  courseId: string;
  grade: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  courses: Course[];
  grades: Grade[];
}

interface StudentProfileProps {
  studentData: Student;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ studentData }) => {
  const { id: studentId } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!studentId) return;

    const fetchStudentData = async () => {
      try {
        // Assuming studentData is passed as a prop and contains all necessary information
        setStudent(studentData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId, studentData]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!student) {
    return <div className="text-center py-10">Student not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">{student.firstName} {student.lastName}</h1>
      <p className="text-gray-700 mb-2"><strong>Email:</strong> {student.email}</p>
      <h2 className="text-xl font-semibold mt-6 mb-4">Enrolled Courses</h2>
      <ul className="list-disc list-inside">
        {student.courses.map(course => (
          <li key={course.id} className="mb-2">
            <div className="font-medium">{course.name}</div>
            <div className="text-gray-600">{course.description}</div>
            <div className="text-gray-800">
              <strong>Grade:</strong> {student.grades.find(grade => grade.courseId === course.id)?.grade || 'N/A'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentProfile;