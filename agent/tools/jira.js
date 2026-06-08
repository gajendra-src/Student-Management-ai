const axios = require('axios');

/**
 * Jira REST API v3 client.
 * All credentials come from environment variables.
 */

const BASE_URL = () => process.env.JIRA_BASE_URL;
const AUTH = () =>
  Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

const headers = () => ({
  Authorization: `Basic ${AUTH()}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

/**
 * Fetch all TODO tickets from the SMS project.
 * @returns {Promise<Array>} Jira issues
 */
async function fetchTodoTickets() {
  const projectKey = process.env.JIRA_PROJECT_KEY ?? 'SMS';
  const jql = `project = ${projectKey} AND status = "To Do" ORDER BY created ASC`;

  const res = await axios.post(
    `${BASE_URL()}/rest/api/3/search/jql`,
    { jql, maxResults: 10, fields: ['summary', 'description', 'labels', 'assignee', 'status'] },
    { headers: headers() },
  );

  return res.data.issues ?? [];
}

/**
 * Assign a ticket to a user and move it to In Progress.
 * @param {string} issueKey e.g. "SMS-42"
 * @param {string} accountId Jira account ID
 */
async function assignAndStart(issueKey, accountId) {
  await axios.put(
    `${BASE_URL()}/rest/api/3/issue/${issueKey}/assignee`,
    { accountId },
    { headers: headers() },
  );

  // Transition to "In Progress"
  const transitionsRes = await axios.get(
    `${BASE_URL()}/rest/api/3/issue/${issueKey}/transitions`,
    { headers: headers() },
  );

  const inProgress = transitionsRes.data.transitions.find(
    (t) => t.name.toLowerCase().includes('in progress'),
  );

  if (inProgress) {
    await axios.post(
      `${BASE_URL()}/rest/api/3/issue/${issueKey}/transitions`,
      { transition: { id: inProgress.id } },
      { headers: headers() },
    );
  }
}

/**
 * Post a comment to a Jira ticket.
 * @param {string} issueKey
 * @param {string} commentText
 */
async function postComment(issueKey, commentText) {
  await axios.post(
    `${BASE_URL()}/rest/api/3/issue/${issueKey}/comment`,
    {
      body: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: commentText }] }],
      },
    },
    { headers: headers() },
  );
}

/**
 * Transition a ticket to Done.
 * @param {string} issueKey
 */
async function closeTicket(issueKey) {
  const transitionsRes = await axios.get(
    `${BASE_URL()}/rest/api/3/issue/${issueKey}/transitions`,
    { headers: headers() },
  );

  const done = transitionsRes.data.transitions.find((t) =>
    ['done', 'closed', 'resolved'].some((k) => t.name.toLowerCase().includes(k)),
  );

  if (done) {
    await axios.post(
      `${BASE_URL()}/rest/api/3/issue/${issueKey}/transitions`,
      { transition: { id: done.id } },
      { headers: headers() },
    );
  }
}

module.exports = { fetchTodoTickets, assignAndStart, postComment, closeTicket };
