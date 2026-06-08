"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Course {
  id: string;
  name: string;
  grade: string;
}

interface CourseListProps {
  studentId: string;
}

const CourseList: React.FC<CourseListProps> = ({ studentId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesResponse = await axios.get(`/api/courses?studentId=${studentId}`);
        const gradesResponse = await axios.get(`/api/grades?studentId=${studentId}`);

        const coursesData = coursesResponse.data;
        const gradesData = gradesResponse.data;

        const enrolledCourses = coursesData.map((course: any) => ({
          id: course.id,
          name: course.name,
          grade: gradesData.find((grade: any) => grade.courseId === course.id)?.grade || "N/A",
        }));

        setCourses(enrolledCourses);
      } catch (err) {
        setError("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [studentId]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Enrolled Courses</h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Course Name</th>
            <th className="py-2 px-4 border-b">Grade</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td className="py-2 px-4 border-b">{course.name}</td>
              <td className="py-2 px-4 border-b">{course.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseList;