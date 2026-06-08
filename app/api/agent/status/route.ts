import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), '.agent-runs.json');

export interface AgentRun {
  id: string;
  triggeredAt: string;
  source: string;
  ticketKey: string | null;
  testScore: number | null;
  deployUrl: string | null;
  filesGenerated: number;
  error: string | null;
  durationMs: number | null;
}

export async function GET() {
  try {
    if (!existsSync(LOG_FILE)) {
      return NextResponse.json({ runs: [], total: 0 });
    }
    const raw = readFileSync(LOG_FILE, 'utf8');
    const runs: AgentRun[] = JSON.parse(raw);
    return NextResponse.json({ runs: runs.slice(-20).reverse(), total: runs.length });
  } catch {
    return NextResponse.json({ runs: [], total: 0 });
  }
}
