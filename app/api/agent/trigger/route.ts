import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const LOG_FILE = join(process.cwd(), '.agent-runs.json');

function appendRun(run: object) {
  let runs: object[] = [];
  if (existsSync(LOG_FILE)) {
    try { runs = JSON.parse(readFileSync(LOG_FILE, 'utf8')); } catch { runs = []; }
  }
  runs.push(run);
  writeFileSync(LOG_FILE, JSON.stringify(runs, null, 2), 'utf8');
}

export async function POST(request: NextRequest) {
  const triggeredAt = new Date().toISOString();
  const body = await request.json().catch(() => ({}));
  const source = (body.source as string) ?? 'manual';
  const runId = randomUUID();
  const start = Date.now();

  console.log(`\n🚀 Agent trigger received — source: ${source}, run: ${runId}`);

  try {
    const { runAgentPipeline } = await import('@/agent/graph');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await runAgentPipeline() as any;

    const run = {
      id: runId,
      triggeredAt,
      source,
      ticketKey: result.ticketKey ?? null,
      testScore: result.testScore ?? null,
      deployUrl: result.deployUrl ?? null,
      filesGenerated: result.filesGenerated ?? 0,
      error: result.error ?? null,
      durationMs: Date.now() - start,
    };
    appendRun(run);

    return NextResponse.json({ success: true, source, result, triggeredAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Agent trigger failed:', message);
    appendRun({ id: runId, triggeredAt, source, error: message, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
