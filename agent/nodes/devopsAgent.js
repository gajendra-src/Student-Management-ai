const { pushToGitHub } = require('../tools/github');
const { triggerDeploy, getLatestDeployUrl } = require('../tools/vercel');
const { postComment, closeTicket } = require('../tools/jira');

/**
 * DEVOPS AGENT node — push to GitHub, deploy to Vercel, close Jira ticket.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function devopsAgentNode(state) {
  console.log('\n🚀 NODE: devopsAgent — deploying to production...');

  const { currentTicket, generatedFiles, testScore } = state;

  if (!currentTicket) {
    console.log('  ⚠️  No current ticket — skipping deploy.');
    return state;
  }

  if (!generatedFiles || generatedFiles.length === 0) {
    console.log('  ⚠️  No files to deploy — closing ticket anyway.');
    await closeTicketSafely(currentTicket.key, null);
    return { ...state, deployUrl: null };
  }

  const ticketKey = currentTicket.key;
  const summary = currentTicket.fields?.summary ?? ticketKey;
  const slug = summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);

  const branchName = `feature/${ticketKey}-${slug}`;
  const commitMsg = `feat(${ticketKey}): ${summary}`;

  let deployUrl = null;

  // ── Step 1: Push to GitHub ──────────────────────────────
  try {
    await pushToGitHub(branchName, commitMsg, generatedFiles);
    console.log(`  ✅ Pushed branch: ${branchName}`);
  } catch (err) {
    console.error('  ❌ GitHub push failed:', err.message);
    await closeTicketSafely(ticketKey, null, `Deploy failed (git push): ${err.message}`);
    return { ...state, deployUrl: null, error: err.message };
  }

  // ── Step 2: Deploy to Vercel ────────────────────────────
  try {
    deployUrl = await triggerDeploy(branchName);
    console.log(`  ✅ Deploy live: ${deployUrl}`);
  } catch (err) {
    console.error('  ❌ Vercel deploy failed:', err.message);
    deployUrl = await getLatestDeployUrl();
  }

  // ── Step 3: Comment + close Jira ────────────────────────
  await closeTicketSafely(ticketKey, deployUrl, null, testScore);

  return { ...state, deployUrl };
}

async function closeTicketSafely(ticketKey, deployUrl, errorMsg, testScore) {
  try {
    const commentLines = [
      `✅ SMS Agent completed ticket ${ticketKey}`,
      testScore !== undefined ? `Test score: ${testScore}/100` : '',
      deployUrl ? `🌐 Live URL: ${deployUrl}` : '',
      errorMsg ? `⚠️ Note: ${errorMsg}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await postComment(ticketKey, commentLines);
    await closeTicket(ticketKey);
    console.log(`  ✅ Jira ticket ${ticketKey} closed`);
  } catch (err) {
    console.error(`  ❌ Failed to close Jira ticket ${ticketKey}:`, err.message);
  }
}

module.exports = { devopsAgentNode };
