"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface EnrollButtonProps {
  studentId: string;
  courseId: string;
}

const EnrollButton: React.FC<EnrollButtonProps> = ({ studentId, courseId }) => {
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollmentStatus = async () => {
      try {
        const response = await axios.get(`/api/students/${encodeURIComponent(studentId)}/courses`);
        const enrolledCourses = response.data;
        setIsEnrolled(enrolledCourses.includes(courseId));
        setError(null);
      } catch (error) {
        console.error("Error fetching enrollment status", error);
        setError("Failed to fetch enrollment status.");
      }
    };

    fetchEnrollmentStatus();
  }, [studentId, courseId]);

  const handleEnrollmentToggle = async () => {
    setLoading(true);
    try {
      if (isEnrolled) {
        await axios.delete(`/api/students/${encodeURIComponent(studentId)}/courses/${encodeURIComponent(courseId)}`);
      } else {
        await axios.post(`/api/students/${encodeURIComponent(studentId)}/courses`, { courseId });
      }
      setIsEnrolled(!isEnrolled);
      setError(null);
    } catch (error) {
      console.error("Error toggling enrollment", error);
      setError("Failed to toggle enrollment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleEnrollmentToggle}
        disabled={loading || isEnrolled === null}
        className={`px-4 py-2 rounded ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : isEnrolled
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        } text-white`}
      >
        {loading ? "Processing..." : isEnrolled ? "Unenroll" : "Enroll"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default EnrollButton;