const axios = require('axios');

const VERCEL_API = 'https://api.vercel.com';

const headers = () => ({
  Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
  'Content-Type': 'application/json',
});

/**
 * Trigger a Vercel deploy for a given branch.
 * @param {string} branch  GitHub branch to deploy
 * @returns {Promise<string>} Deploy URL
 */
async function triggerDeploy(branch) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const orgId = process.env.VERCEL_ORG_ID;

  if (!projectId || !orgId) {
    throw new Error('VERCEL_PROJECT_ID and VERCEL_ORG_ID must be set');
  }

  const repoId = process.env.GITHUB_REPO_ID
    ? parseInt(process.env.GITHUB_REPO_ID, 10)
    : undefined;

  const res = await axios.post(
    `${VERCEL_API}/v13/deployments`,
    {
      name: 'student-management-ai-wpx8',
      gitSource: {
        type: 'github',
        ref: branch,
        repoId,
      },
    },
    { headers: { ...headers(), 'x-vercel-team-id': orgId } },
  );

  const deployId = res.data.id;
  console.log(`  🚀 Deploy triggered: ${deployId}`);

  return waitForDeploy(deployId, orgId);
}

/**
 * Poll until the deployment is ready or fails.
 * @param {string} deployId
 * @param {string} teamId
 * @returns {Promise<string>} Live URL
 */
async function waitForDeploy(deployId, teamId) {
  const maxAttempts = 30;
  const delayMs = 10_000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, delayMs));

    const res = await axios.get(`${VERCEL_API}/v13/deployments/${deployId}`, {
      headers: { ...headers(), 'x-vercel-team-id': teamId },
    });

    const { readyState, url } = res.data;
    console.log(`  ⏳ Deploy status: ${readyState} (attempt ${attempt + 1}/${maxAttempts})`);

    if (readyState === 'READY') {
      return `https://${url}`;
    }
    if (['ERROR', 'CANCELED'].includes(readyState)) {
      throw new Error(`Deploy failed with state: ${readyState}`);
    }
  }

  throw new Error('Deploy timed out after 5 minutes');
}

/**
 * Get the latest deployment URL for the project (used as fallback).
 * @returns {Promise<string|null>}
 */
async function getLatestDeployUrl() {
  try {
    const res = await axios.get(`${VERCEL_API}/v6/deployments`, {
      headers: headers(),
      params: {
        projectId: process.env.VERCEL_PROJECT_ID,
        teamId: process.env.VERCEL_ORG_ID,
        limit: 1,
        state: 'READY',
      },
    });
    const latest = res.data.deployments?.[0];
    return latest ? `https://${latest.url}` : null;
  } catch {
    return null;
  }
}

module.exports = { triggerDeploy, getLatestDeployUrl };
