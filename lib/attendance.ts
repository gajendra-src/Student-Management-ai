export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
}

const store: AttendanceRecord[] = [];

export const attendanceStore = {
  getAll(): AttendanceRecord[] {
    return [...store];
  },

  getByDate(date: string): AttendanceRecord[] {
    return store.filter((r) => r.date === date);
  },

  getByStudent(student_id: string): AttendanceRecord[] {
    return store.filter((r) => r.student_id === student_id);
  },

  // Returns a map of student_id → attendance percentage (0-100)
  getAttendanceData(): Record<string, number> {
    const byStudent: Record<string, AttendanceRecord[]> = {};
    for (const r of store) {
      if (!byStudent[r.student_id]) byStudent[r.student_id] = [];
      byStudent[r.student_id].push(r);
    }
    const result: Record<string, number> = {};
    for (const [id, records] of Object.entries(byStudent)) {
      const present = records.filter((r) => r.status === 'present').length;
      result[id] = Math.round((present / records.length) * 100);
    }
    return result;
  },

  create(data: Omit<AttendanceRecord, 'id' | 'created_at'>): AttendanceRecord {
    const record: AttendanceRecord = {
      ...data,
      id: Math.random().toString(36).slice(2),
      created_at: new Date().toISOString(),
    };
    store.push(record);
    return record;
  },
};
