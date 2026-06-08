import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const data = await db.courses.getAll();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, description, credits, instructor } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    const db = getDb();
    const course = await db.courses.create({ code, name, description, credits, instructor });
    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    console.error('POST /api/courses error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
