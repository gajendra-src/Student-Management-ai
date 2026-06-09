'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from '@/components/DataTable';

interface StudentRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrollment_date: string;
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'enrollment_date', label: 'Enrolled' },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('/api/students')
      .then((res) => setStudents(res.data.data ?? res.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Students</h1>
      <DataTable columns={columns} data={students} loading={loading} />
    </div>
  );
}
