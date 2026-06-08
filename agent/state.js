const { Annotation } = require('@langchain/langgraph');

/**
 * Shared state schema for the entire LangGraph pipeline.
 * Each field uses a last-write-wins reducer (y ?? x).
 */
const AgentStateAnnotation = Annotation.Root({
  /** Raw tickets fetched from Jira */
  tickets: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  /** { user1: ticket, user2: ticket } after assignment */
  assignedTickets: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),

  /** The ticket currently being processed */
  currentTicket: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  /**
   * Plan produced by planAgent:
   * { workType: 'frontend'|'backend'|'fullstack', files: [{ path, description }] }
   */
  plan: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  /** Files written by frontendAgent and/or backendAgent: [{ path, content }] */
  generatedFiles: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  /** Score (0–100) from testAgent */
  testScore: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),

  /** Issues list from testAgent */
  testIssues: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),

  /** Number of fix retries attempted */
  retryCount: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),

  /** Live URL after Vercel deploy */
  deployUrl: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  /** Any error string from the pipeline */
  error: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

module.exports = { AgentStateAnnotation };
