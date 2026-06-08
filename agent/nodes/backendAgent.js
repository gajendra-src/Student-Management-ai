const { ChatOpenAI } = require('@langchain/openai');

const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.2 });

/**
 * BACKEND AGENT node — generate Next.js API routes and lib utilities.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function backendAgentNode(state) {
  console.log('\n⚙️  NODE: backendAgent — generating backend files...');

  const { currentTicket, plan, generatedFiles } = state;
  if (!plan) {
    console.log('  ⚠️  No plan — skipping backend.');
    return state;
  }

  const backendFiles = plan.files.filter(
    (f) =>
      f.path.includes('/api/') ||
      f.path.includes('route.ts') ||
      (f.path.startsWith('lib/') && !f.path.endsWith('.tsx')),
  );

  if (backendFiles.length === 0) {
    console.log('  ⚠️  No backend files in plan — skipping.');
    return state;
  }

  const newFiles = [...(generatedFiles ?? [])];

  for (const fileSpec of backendFiles) {
    console.log(`  🔨 Generating: ${fileSpec.path}`);

    const prompt = `You are a senior Next.js backend developer building a Student Management System.

Task: Generate the file at path: ${fileSpec.path}
Description: ${fileSpec.description}
Ticket: ${currentTicket?.key} — ${currentTicket?.fields?.summary}

DB client is at lib/db.ts and exports:
  getDb() → { students, courses, grades }
  Each repo has: getAll(), getById(id), create(data), update(id, data), delete(id)

Rules:
- Next.js 14 App Router API routes use NextRequest / NextResponse
- TypeScript strict mode
- Import getDb from @/lib/db
- Input validation with early returns and 400 responses
- try/catch on all DB calls with 500 responses
- RESTful response format: { data: ... } on success, { error: string } on failure
- No authentication required (public API for this system)
- No console.log in production code (use try/catch error logging only)

Respond ONLY with the complete file content. No explanation, no markdown code blocks.`;

    try {
      const response = await llm.invoke(prompt);
      let content = response.content.toString().trim();

      content = content.replace(/^```(?:tsx?|typescript|ts)?\n?/, '').replace(/\n?```$/, '');

      newFiles.push({ path: fileSpec.path, content });
      console.log(`  ✅ Generated: ${fileSpec.path} (${content.length} chars)`);

      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ❌ Failed to generate ${fileSpec.path}:`, err.message);
    }
  }

  return { ...state, generatedFiles: newFiles };
}

module.exports = { backendAgentNode };
