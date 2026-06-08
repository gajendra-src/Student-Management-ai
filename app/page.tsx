import StatCard from '@/components/StatCard';
import Link from 'next/link';

interface AgentRun {
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

async function getStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const [studentsRes, coursesRes, gradesRes] = await Promise.all([
      fetch(`${baseUrl}/api/students`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/courses`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/grades`, { cache: 'no-store' }),
    ]);

    const students = studentsRes.ok ? await studentsRes.json() : { data: [] };
    const courses = coursesRes.ok ? await coursesRes.json() : { data: [] };
    const grades = gradesRes.ok ? await gradesRes.json() : { data: [] };

    const avgScore =
      grades.data?.length > 0
        ? (
            grades.data.reduce((sum: number, g: { score: number }) => sum + (g.score || 0), 0) /
            grades.data.length
          ).toFixed(1)
        : '—';

    return {
      totalStudents: students.data?.length ?? 0,
      totalCourses: courses.data?.length ?? 0,
      totalGrades: grades.data?.length ?? 0,
      avgScore,
    };
  } catch {
    return { totalStudents: 0, totalCourses: 0, totalGrades: 0, avgScore: '—' };
  }
}

async function getAgentRuns(): Promise<AgentRun[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/agent/status`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.runs ?? [];
  } catch {
    return [];
  }
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-gray-400';
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-yellow-600';
  return 'text-red-600';
}

export default async function Dashboard() {
  const [stats, agentRuns] = await Promise.all([getStats(), getAgentRuns()]);
  const lastRun = agentRuns[0] ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to the Student Management System</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.totalStudents} icon="👨‍🎓" color="blue" />
        <StatCard title="Total Courses" value={stats.totalCourses} icon="📚" color="green" />
        <StatCard title="Grade Records" value={stats.totalGrades} icon="📊" color="purple" />
        <StatCard title="Avg Score" value={stats.avgScore} icon="⭐" color="yellow" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/students" className="card hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="text-4xl">👨‍🎓</div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Students</h3>
              <p className="text-sm text-gray-500">Register, view, and manage students</p>
            </div>
          </div>
        </Link>

        <Link href="/courses" className="card hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📚</div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Courses</h3>
              <p className="text-sm text-gray-500">Create and manage course catalog</p>
            </div>
          </div>
        </Link>

        <Link href="/grades" className="card hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Grades</h3>
              <p className="text-sm text-gray-500">Track and enter student grades</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Agent Pipeline Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Agent Pipeline</h2>
          <span className="text-xs text-gray-400">
            {agentRuns.length} run{agentRuns.length !== 1 ? 's' : ''} logged
          </span>
        </div>

        {lastRun ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Last run: </span>
                <span className="font-medium">
                  {new Date(lastRun.triggeredAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Source: </span>
                <span className="font-medium capitalize">{lastRun.source}</span>
              </div>
              {lastRun.ticketKey && (
                <div>
                  <span className="text-gray-500">Ticket: </span>
                  <span className="font-medium">{lastRun.ticketKey}</span>
                </div>
              )}
              {lastRun.testScore !== null && (
                <div>
                  <span className="text-gray-500">Score: </span>
                  <span className={`font-bold ${scoreColor(lastRun.testScore)}`}>
                    {lastRun.testScore}/100
                  </span>
                </div>
              )}
              {lastRun.filesGenerated > 0 && (
                <div>
                  <span className="text-gray-500">Files: </span>
                  <span className="font-medium">{lastRun.filesGenerated}</span>
                </div>
              )}
              {lastRun.durationMs !== null && (
                <div>
                  <span className="text-gray-500">Duration: </span>
                  <span className="font-medium">{Math.round(lastRun.durationMs / 1000)}s</span>
                </div>
              )}
            </div>

            {lastRun.deployUrl && (
              <div className="text-sm">
                <span className="text-gray-500">Deploy: </span>
                <a
                  href={lastRun.deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {lastRun.deployUrl}
                </a>
              </div>
            )}

            {lastRun.error && (
              <div className="text-sm text-red-600 bg-red-50 rounded p-2">
                Error: {lastRun.error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No agent runs yet. Trigger via{' '}
            <code className="bg-gray-100 px-1 rounded text-xs">POST /api/agent/trigger</code> or{' '}
            <code className="bg-gray-100 px-1 rounded text-xs">npm run agent</code>.
          </p>
        )}
      </div>
    </div>
  );
}
