const { ChatOpenAI } = require('@langchain/openai');

const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.2 });

/**
 * PLAN AGENT node — read the Jira ticket and decide what files to build.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function planAgentNode(state) {
  console.log('\n🧠 NODE: planAgent — planning implementation...');

  const { currentTicket } = state;
  if (!currentTicket) {
    console.log('  ⚠️  No current ticket — skipping.');
    return { ...state, plan: null };
  }

  const summary = currentTicket.fields?.summary ?? '';
  const description =
    typeof currentTicket.fields?.description === 'object'
      ? JSON.stringify(currentTicket.fields.description)
      : (currentTicket.fields?.description ?? 'No description');
  const labels = (currentTicket.fields?.labels ?? []).join(', ');

  const prompt = `You are a senior software architect planning a feature for a Student Management System built with Next.js 14 (App Router), TypeScript, and Tailwind CSS.

Jira Ticket:
- Key: ${currentTicket.key}
- Summary: ${summary}
- Labels: ${labels || 'none'}
- Description: ${description}

Based on this ticket, produce a JSON implementation plan with:
1. workType: "frontend" | "backend" | "fullstack"
2. files: array of { path: string, description: string } — every file that needs to be created or modified

Rules:
- Frontend files: app/[page]/page.tsx, components/[Name].tsx
- Backend files: app/api/[resource]/route.ts, lib/[name].ts
- Always follow App Router conventions (app/ directory)
- Be specific about file paths

Respond ONLY with valid JSON, no markdown, no explanation.

Example:
{
  "workType": "fullstack",
  "files": [
    { "path": "app/students/[id]/page.tsx", "description": "Student detail page showing all info and grades" },
    { "path": "app/api/students/[id]/grades/route.ts", "description": "GET endpoint to fetch grades for a student" }
  ]
}`;

  try {
    const response = await llm.invoke(prompt);
    const raw = response.content.toString().trim();
    const plan = JSON.parse(raw.replace(/```json|```/g, '').trim());

    console.log(`  ✅ Plan: ${plan.workType} — ${plan.files.length} file(s) to build`);
    plan.files.forEach((f) => console.log(`    - ${f.path}`));

    return { ...state, plan };
  } catch (err) {
    console.error('  ❌ planAgent failed:', err.message);
    const fallbackPlan = {
      workType: labels.includes('backend') ? 'backend' : labels.includes('frontend') ? 'frontend' : 'fullstack',
      files: [],
      error: err.message,
    };
    return { ...state, plan: fallbackPlan };
  }
}

module.exports = { planAgentNode };
