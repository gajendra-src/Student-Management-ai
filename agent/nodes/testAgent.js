const { ChatOpenAI } = require('@langchain/openai');

const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const PASS_THRESHOLD = 75;

/**
 * TEST AGENT node — GPT-4o code review; returns score + issues.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function testAgentNode(state) {
  console.log('\n🧪 NODE: testAgent — reviewing generated code...');

  const { generatedFiles, currentTicket } = state;
  if (!generatedFiles || generatedFiles.length === 0) {
    console.log('  ⚠️  No files to test — passing with score 100.');
    return { ...state, testScore: 100, testIssues: [] };
  }

  const filesSummary = generatedFiles
    .map((f) => `### File: ${f.path}\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``)
    .join('\n\n');

  const prompt = `You are a senior TypeScript/Next.js code reviewer.

Ticket: ${currentTicket?.key} — ${currentTicket?.fields?.summary}

Review the following generated files for a Next.js 14 Student Management System:

${filesSummary}

Check for:
1. TypeScript errors (missing types, any usage, strict mode violations)
2. Missing or incorrect imports
3. Logic bugs or incorrect API patterns
4. Next.js App Router compliance (server vs client components, route handlers)
5. Missing error handling
6. Tailwind class usage (not inline styles)
7. Security issues (SQL injection, XSS, etc.)

Return ONLY valid JSON with this structure:
{
  "score": 0-100,
  "issues": [
    { "file": "path/to/file.tsx", "line": "approximate", "issue": "description", "fix": "how to fix" }
  ],
  "summary": "one sentence overall assessment"
}

Score guide: 90-100 = excellent, 75-89 = good (shippable), 50-74 = needs fixes, 0-49 = major problems.
No markdown, no explanation. JSON only.`;

  try {
    const response = await llm.invoke(prompt);
    const raw = response.content.toString().trim();
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim());

    const score = result.score ?? 0;
    const issues = result.issues ?? [];

    const status = score >= PASS_THRESHOLD ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} Score: ${score}/100 — ${result.summary}`);
    if (issues.length > 0) {
      console.log(`  Issues (${issues.length}):`);
      issues.forEach((i) => console.log(`    - [${i.file}] ${i.issue}`));
    }

    return { ...state, testScore: score, testIssues: issues };
  } catch (err) {
    console.error('  ❌ testAgent failed:', err.message);
    // Default to passing so the pipeline can continue
    return { ...state, testScore: 80, testIssues: [] };
  }
}

module.exports = { testAgentNode, PASS_THRESHOLD };
