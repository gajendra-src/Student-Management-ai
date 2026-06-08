const { assignAndStart } = require('../tools/jira');

/**
 * ASSIGN TICKETS node — assign user1 → first ticket, user2 → second ticket.
 * Picks the first unprocessed ticket as the currentTicket for this run.
 * @param {import('../state').AgentStateAnnotation} state
 */
async function assignTicketsNode(state) {
  console.log('\n👥 NODE: assignTickets — assigning tickets to users...');

  const { tickets } = state;
  if (!tickets || tickets.length === 0) {
    console.log('  ⚠️  No tickets to assign.');
    return { ...state, currentTicket: null };
  }

  const user1Id = process.env.JIRA_USER1_ACCOUNT_ID;
  const user2Id = process.env.JIRA_USER2_ACCOUNT_ID;

  const assignedTickets = {};

  // Assign ticket 0 to user1, ticket 1 to user2
  const pairs = [
    { ticket: tickets[0], userId: user1Id, userKey: 'user1' },
    { ticket: tickets[1], userId: user2Id, userKey: 'user2' },
  ].filter((p) => p.ticket && p.userId);

  for (const { ticket, userId, userKey } of pairs) {
    try {
      await assignAndStart(ticket.key, userId);
      assignedTickets[userKey] = ticket;
      console.log(`  ✅ ${ticket.key} assigned to ${userKey}`);
    } catch (err) {
      console.error(`  ❌ Failed to assign ${ticket.key}:`, err.message);
      assignedTickets[userKey] = ticket;
    }
  }

  // Process user1's ticket first
  const currentTicket = assignedTickets.user1 ?? assignedTickets.user2 ?? null;
  console.log(`  🎯 Processing ticket: ${currentTicket?.key}`);

  return { ...state, assignedTickets, currentTicket };
}

module.exports = { assignTicketsNode };
