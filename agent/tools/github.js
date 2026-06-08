const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

const REPO_DIR = path.resolve(process.cwd());

/**
 * Write generated files to disk in the project directory.
 * @param {Array<{path: string, content: string}>} files
 */
async function writeFiles(files) {
  for (const file of files) {
    const fullPath = path.join(REPO_DIR, file.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content, 'utf8');
    console.log(`  📝 Written: ${file.path}`);
  }
}

/**
 * Create a feature branch, commit generated files, and push to GitHub.
 * @param {string} branchName  e.g. "feature/SMS-42-student-form"
 * @param {string} commitMsg   e.g. "feat(SMS-42): add student registration form"
 * @param {Array<{path: string, content: string}>} files
 */
async function pushToGitHub(branchName, commitMsg, files) {
  const repoUrl = process.env.GITHUB_REPO_URL;
  const token = process.env.GITHUB_TOKEN;

  if (!repoUrl || !token) {
    throw new Error('GITHUB_REPO_URL and GITHUB_TOKEN must be set');
  }

  // Embed token in remote URL for push auth
  const authenticatedUrl = repoUrl.replace('https://', `https://${token}@`);

  const git = simpleGit(REPO_DIR);

  // Ensure remote is set with auth
  const remotes = await git.getRemotes(true);
  const hasOrigin = remotes.some((r) => r.name === 'origin');
  if (hasOrigin) {
    await git.remote(['set-url', 'origin', authenticatedUrl]);
  } else {
    await git.addRemote('origin', authenticatedUrl);
  }

  // Try to fetch remote — sets up tracking for main/master
  await git.fetch('origin').catch(() => {});

  // Determine default branch (main or master)
  const remoteInfo = await git.listRemote(['--heads', 'origin']).catch(() => '');
  const defaultBranch = remoteInfo.includes('refs/heads/main') ? 'main' : 'master';

  // Checkout default branch — from remote if local doesn't exist yet
  try {
    await git.checkout(defaultBranch);
  } catch {
    await git.checkoutBranch(defaultBranch, `origin/${defaultBranch}`).catch(async () => {
      // Remote is empty — create initial commit on default branch
      await git.checkout(['-b', defaultBranch]).catch(() => {});
      await git.commit('chore: initial commit', { '--allow-empty': null });
      await git.push('origin', defaultBranch);
    });
  }

  await git.pull('origin', defaultBranch).catch(() => {});

  // Create and switch to feature branch
  await git.checkoutLocalBranch(branchName).catch(() => git.checkout(branchName));

  // Write files to disk
  await writeFiles(files);

  // Stage all written files
  const filePaths = files.map((f) => f.path);
  await git.add(filePaths);

  // Commit
  await git.commit(commitMsg, { '--author': 'SMS Agent <agent@sms.local>' });

  // Push
  await git.push(authenticatedUrl, branchName);

  console.log(`  ✅ Pushed branch: ${branchName}`);
  return branchName;
}

module.exports = { writeFiles, pushToGitHub };
