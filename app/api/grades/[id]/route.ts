import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    const grade = await db.grades.getById(params.id);
    if (!grade) {
      return NextResponse.json({ error: 'Grade record not found' }, { status: 404 });
    }
    return NextResponse.json({ data: grade });
  } catch (error) {
    console.error('GET /api/grades/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch grade' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const db = getDb();
    const grade = await db.grades.update(params.id, body);
    if (!grade) {
      return NextResponse.json({ error: 'Grade record not found' }, { status: 404 });
    }
    return NextResponse.json({ data: grade });
  } catch (error) {
    console.error('PUT /api/grades/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    await db.grades.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/grades/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 });
  }
}
