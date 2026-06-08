import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  enrollment_date: string;
  created_at: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  instructor: string;
  created_at: string;
}

export interface Grade {
  id: string;
  student_id: string;
  course_id: string;
  grade: string;
  score: number;
  semester: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// In-memory fallback store (used when Supabase is not configured)
// ─────────────────────────────────────────────

const store = {
  students: [] as Student[],
  courses: [] as Course[],
  grades: [] as Grade[],
};

function makeRecord<T extends object>(data: Omit<T, 'id' | 'created_at'>): T {
  return {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...data,
  } as T;
}

function inMemoryRepo<T extends { id: string }>(collection: T[]) {
  return {
    async getAll(): Promise<T[]> {
      return [...collection];
    },
    async getById(id: string): Promise<T | null> {
      return collection.find((r) => r.id === id) ?? null;
    },
    async create(data: Omit<T, 'id' | 'created_at'>): Promise<T> {
      const record = makeRecord<T>(data);
      collection.push(record);
      return record;
    },
    async update(id: string, data: Partial<T>): Promise<T | null> {
      const idx = collection.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      collection[idx] = { ...collection[idx], ...data };
      return collection[idx];
    },
    async delete(id: string): Promise<void> {
      const idx = collection.findIndex((r) => r.id === id);
      if (idx !== -1) collection.splice(idx, 1);
    },
  };
}

// ─────────────────────────────────────────────
// Supabase-backed repository
// ─────────────────────────────────────────────

function supabaseRepo<T extends { id: string }>(
  client: SupabaseClient,
  table: string,
) {
  return {
    async getAll(): Promise<T[]> {
      const { data, error } = await client
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data as T[];
    },
    async getById(id: string): Promise<T | null> {
      const { data, error } = await client.from(table).select('*').eq('id', id).single();
      if (error) return null;
      return data as T;
    },
    async create(payload: Omit<T, 'id' | 'created_at'>): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await client.from(table).insert(payload as any).select().single();
      if (error) throw new Error(error.message);
      return data as T;
    },
    async update(id: string, payload: Partial<T>): Promise<T | null> {
      const { data, error } = await client
        .from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(payload as any)
        .eq('id', id)
        .select()
        .single();
      if (error) return null;
      return data as T;
    },
    async delete(id: string): Promise<void> {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
  };
}

// ─────────────────────────────────────────────
// DB factory — Supabase if env is set, in-memory otherwise
// ─────────────────────────────────────────────

let _db: ReturnType<typeof buildDb> | null = null;

function buildDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const client = createClient(supabaseUrl, supabaseKey);
    return {
      students: supabaseRepo<Student>(client, 'students'),
      courses: supabaseRepo<Course>(client, 'courses'),
      grades: supabaseRepo<Grade>(client, 'grades'),
    };
  }

  console.warn('⚠️  Supabase not configured — using in-memory store (data resets on restart)');
  return {
    students: inMemoryRepo<Student>(store.students),
    courses: inMemoryRepo<Course>(store.courses),
    grades: inMemoryRepo<Grade>(store.grades),
  };
}

export function getDb() {
  if (!_db) _db = buildDb();
  return _db;
}
