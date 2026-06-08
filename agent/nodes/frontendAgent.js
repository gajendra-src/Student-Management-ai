const { ChatOpenAI } = require('@langchain/openai');

const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.2 });

/**
 * FRONTEND AGENT node — generate Next.js pages and React components.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function frontendAgentNode(state) {
  console.log('\n🎨 NODE: frontendAgent — generating frontend files...');

  const { currentTicket, plan, generatedFiles } = state;
  if (!plan) {
    console.log('  ⚠️  No plan — skipping frontend.');
    return state;
  }

  const frontendFiles = plan.files.filter(
    (f) =>
      f.path.endsWith('.tsx') &&
      !f.path.includes('/api/') &&
      !f.path.includes('route.ts'),
  );

  if (frontendFiles.length === 0) {
    console.log('  ⚠️  No frontend files in plan — skipping.');
    return state;
  }

  const newFiles = [...(generatedFiles ?? [])];

  for (const fileSpec of frontendFiles) {
    console.log(`  🔨 Generating: ${fileSpec.path}`);

    const isClientComponent =
      fileSpec.path.includes('components/') ||
      fileSpec.description?.toLowerCase().includes('interactive') ||
      fileSpec.description?.toLowerCase().includes('form') ||
      fileSpec.description?.toLowerCase().includes('client');

    const prompt = `You are a senior Next.js developer building a Student Management System.

Task: Generate the file at path: ${fileSpec.path}
Description: ${fileSpec.description}
Ticket: ${currentTicket?.key} — ${currentTicket?.fields?.summary}

Rules:
- Use Next.js 14 App Router (app/ directory)
- TypeScript strict mode
- Tailwind CSS only (no inline styles, no CSS modules)
- ${isClientComponent ? '"use client" directive at the top (interactive component)' : 'Server component (no "use client" unless needed)'}
- Import paths use @/ alias (e.g., @/components/DataTable)
- Fetch data from API routes (/api/students, /api/courses, /api/grades)
- Clean, production-quality code
- No placeholder comments like "// TODO" or "// implement this"

Respond ONLY with the complete file content. No explanation, no markdown code blocks.`;

    try {
      const response = await llm.invoke(prompt);
      let content = response.content.toString().trim();

      // Strip markdown code blocks if model included them
      content = content.replace(/^```(?:tsx?|javascript|js)?\n?/, '').replace(/\n?```$/, '');

      newFiles.push({ path: fileSpec.path, content });
      console.log(`  ✅ Generated: ${fileSpec.path} (${content.length} chars)`);

      // 1s delay between Claude API calls
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ❌ Failed to generate ${fileSpec.path}:`, err.message);
    }
  }

  return { ...state, generatedFiles: newFiles };
}

module.exports = { frontendAgentNode };
