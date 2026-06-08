'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/DataTable';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  instructor: string;
  created_at: string;
}

const EMPTY_FORM = { code: '', name: '', description: '', credits: 3, instructor: '' };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const json = await res.json();
      setCourses(json.data ?? []);
    } catch {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowForm(true);
  };

  const openEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({
      code: course.code,
      name: course.name,
      description: course.description ?? '',
      credits: course.credits,
      instructor: course.instructor ?? '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/courses/${editingId}` : '/api/courses';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Save failed');
      }
      setShowForm(false);
      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      fetchCourses();
    } catch {
      setError('Delete failed.');
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Course Name' },
    { key: 'instructor', label: 'Instructor' },
    { key: 'credits', label: 'Credits' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 mt-1">{courses.length} courses available</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Add Course
        </button>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onEdit={(row) => openEdit(row as Course)}
        onDelete={(row) => handleDelete(row.id as string)}
        emptyMessage="No courses found. Add one to get started."
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Course' : 'Add Course'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Course Code *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="input"
                    placeholder="CS101"
                  />
                </div>
                <div>
                  <label className="label">Credits *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={6}
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Course Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Introduction to Computer Science"
                />
              </div>
              <div>
                <label className="label">Instructor</label>
                <input
                  value={form.instructor}
                  onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                  className="input"
                  placeholder="Dr. Jane Smith"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Brief course description..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
