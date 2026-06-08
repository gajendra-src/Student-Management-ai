const { StateGraph, END, START } = require('@langchain/langgraph');
const { AgentStateAnnotation } = require('./state');
const { fetchTicketsNode } = require('./nodes/fetchTickets');
const { assignTicketsNode } = require('./nodes/assignTickets');
const { planAgentNode } = require('./nodes/planAgent');
const { frontendAgentNode } = require('./nodes/frontendAgent');
const { backendAgentNode } = require('./nodes/backendAgent');
const { testAgentNode, PASS_THRESHOLD } = require('./nodes/testAgent');
const { fixAgentNode } = require('./nodes/fixAgent');
const { devopsAgentNode } = require('./nodes/devopsAgent');

const MAX_RETRIES = 3;

// ─────────────────────────────────────────────
// Conditional edge routing functions
// ─────────────────────────────────────────────

/**
 * After planAgent: route to frontend, backend, or frontend (then backend).
 */
function routeAfterPlan(state) {
  if (!state.currentTicket) return 'devops';

  const workType = state.plan?.workType ?? 'fullstack';
  if (workType === 'backend') return 'backend';
  return 'frontend'; // frontend or fullstack: start with frontend
}

/**
 * After frontendAgent: if fullstack, go to backend; else go to test.
 */
function routeAfterFrontend(state) {
  const workType = state.plan?.workType ?? 'fullstack';
  return workType === 'fullstack' ? 'backend' : 'test';
}

/**
 * After testAgent: pass → devops, fail → fix (if retries left) or devops.
 */
function routeAfterTest(state) {
  const { testScore, retryCount } = state;
  if (testScore >= PASS_THRESHOLD) return 'devops';
  if ((retryCount ?? 0) >= MAX_RETRIES) {
    console.log(`  ⚠️  Max retries (${MAX_RETRIES}) reached — deploying anyway.`);
    return 'devops';
  }
  return 'fix';
}

// ─────────────────────────────────────────────
// Build the LangGraph StateGraph
// ─────────────────────────────────────────────

function buildGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    // ── Nodes ──────────────────────────────────────────────
    .addNode('fetchTickets', fetchTicketsNode)
    .addNode('assignTickets', assignTicketsNode)
    .addNode('planAgent', planAgentNode)
    .addNode('frontendAgent', frontendAgentNode)
    .addNode('backendAgent', backendAgentNode)
    .addNode('testAgent', testAgentNode)
    .addNode('fixAgent', fixAgentNode)
    .addNode('devopsAgent', devopsAgentNode)

    // ── Linear edges ───────────────────────────────────────
    .addEdge(START, 'fetchTickets')
    .addEdge('fetchTickets', 'assignTickets')
    .addEdge('assignTickets', 'planAgent')

    // ── Conditional: plan → frontend | backend ─────────────
    .addConditionalEdges('planAgent', routeAfterPlan, {
      frontend: 'frontendAgent',
      backend: 'backendAgent',
      devops: 'devopsAgent',
    })

    // ── Conditional: frontend → backend | test ─────────────
    .addConditionalEdges('frontendAgent', routeAfterFrontend, {
      backend: 'backendAgent',
      test: 'testAgent',
    })

    .addEdge('backendAgent', 'testAgent')

    // ── Conditional: test → devops | fix ───────────────────
    .addConditionalEdges('testAgent', routeAfterTest, {
      devops: 'devopsAgent',
      fix: 'fixAgent',
    })

    .addEdge('fixAgent', 'testAgent')
    .addEdge('devopsAgent', END);

  return graph.compile();
}

const compiledGraph = buildGraph();

/**
 * Run the full agent pipeline once.
 * @returns {Promise<object>} Final pipeline state summary
 */
async function runAgentPipeline() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🤖 SMS Agent Pipeline — Starting');
  console.log('═'.repeat(60));

  const finalState = await compiledGraph.invoke({});

  console.log('\n' + '═'.repeat(60));
  console.log('  🏁 Pipeline Complete');
  console.log(`  Ticket:   ${finalState.currentTicket?.key ?? 'none'}`);
  console.log(`  Score:    ${finalState.testScore}/100`);
  console.log(`  Deploy:   ${finalState.deployUrl ?? 'n/a'}`);
  console.log(`  Retries:  ${finalState.retryCount ?? 0}`);
  if (finalState.error) console.log(`  Error:    ${finalState.error}`);
  console.log('═'.repeat(60) + '\n');

  return {
    ticketKey: finalState.currentTicket?.key,
    testScore: finalState.testScore,
    deployUrl: finalState.deployUrl,
    retryCount: finalState.retryCount,
    filesGenerated: finalState.generatedFiles?.length ?? 0,
    error: finalState.error,
  };
}

module.exports = { runAgentPipeline, compiledGraph };
