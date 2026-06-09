"use client";

import React, { useState } from 'react';
import { fetchGradesData, exportToCSV } from '../utils/gradesUtils'; // Ensure these functions are correctly defined in the specified path

const ExportGradesButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await fetchGradesData();
      exportToCSV(data);
    } catch (error) {
      console.error('Error exporting grades:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={loading}
    >
      {loading ? 'Exporting...' : 'Export Grades to CSV'}
    </button>
  );
};

export default ExportGradesButton;