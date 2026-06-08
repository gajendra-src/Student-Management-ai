const { ChatOpenAI } = require('@langchain/openai');

const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.1 });

/**
 * FIX AGENT node — apply fixes from testAgent, increment retry counter.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function fixAgentNode(state) {
  const { retryCount, testIssues, generatedFiles } = state;
  const attempt = (retryCount ?? 0) + 1;
  console.log(`\n🔧 NODE: fixAgent — fixing issues (attempt ${attempt}/3)...`);

  if (!testIssues || testIssues.length === 0) {
    console.log('  ✅ No issues to fix.');
    return { ...state, retryCount: attempt };
  }

  const issuesByFile = testIssues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {});

  const newFiles = [...(generatedFiles ?? [])];

  for (const [filePath, issues] of Object.entries(issuesByFile)) {
    const original = newFiles.find((f) => f.path === filePath);
    if (!original) {
      console.log(`  ⚠️  File not found for fixing: ${filePath}`);
      continue;
    }

    console.log(`  🔨 Fixing: ${filePath} (${issues.length} issue(s))`);

    const issueList = issues
      .map((i) => `- Line ~${i.line}: ${i.issue}\n  Fix: ${i.fix}`)
      .join('\n');

    const prompt = `You are fixing TypeScript/Next.js code issues.

File: ${filePath}

Current content:
\`\`\`
${original.content}
\`\`\`

Issues to fix:
${issueList}

Return ONLY the complete corrected file content. No explanation, no markdown code blocks.`;

    try {
      const response = await llm.invoke(prompt);
      let fixed = response.content.toString().trim();
      fixed = fixed.replace(/^```(?:tsx?|typescript|ts)?\n?/, '').replace(/\n?```$/, '');

      const idx = newFiles.findIndex((f) => f.path === filePath);
      newFiles[idx] = { path: filePath, content: fixed };
      console.log(`  ✅ Fixed: ${filePath}`);

      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ❌ Failed to fix ${filePath}:`, err.message);
    }
  }

  return { ...state, generatedFiles: newFiles, retryCount: attempt };
}

module.exports = { fixAgentNode };
