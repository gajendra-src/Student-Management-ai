const { fetchTodoTickets } = require('../tools/jira');

/**
 * FETCH TICKETS node — pull TODO tickets from Jira.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function fetchTicketsNode(state) {
  console.log('\n📋 NODE: fetchTickets — fetching TODO tickets from Jira...');

  try {
    const tickets = await fetchTodoTickets();
    console.log(`  ✅ Found ${tickets.length} ticket(s)`);
    tickets.forEach((t) => console.log(`    - ${t.key}: ${t.fields?.summary}`));

    return { ...state, tickets };
  } catch (err) {
    console.error('  ❌ fetchTickets failed:', err.message);
    return { ...state, tickets: [], error: `fetchTickets: ${err.message}` };
  }
}

module.exports = { fetchTicketsNode };
