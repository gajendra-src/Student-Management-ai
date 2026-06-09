import { getDb } from '@/lib/db';
import DataTable from '@/components/DataTable';
import { attendanceStore } from '@/lib/attendance';
import Link from 'next/link';

export default async function AttendancePage() {
  const { students } = await getDb();
  const attendanceData = attendanceStore.getAttendanceData();

  const columns: Array<{ key: string; label: string; render?: (value: any, row: any) => React.ReactNode }> = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'attendance', label: 'Attendance', render: (value) => `${value}%` },
  ];

  const data = (await students.getAll()).map((student) => ({
    ...student,
    attendance: attendanceData[student.id] || 0,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Attendance</h1>
      <DataTable columns={columns} data={data} />
      <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
        Back to Dashboard
      </Link>
    </div>
  );
}
