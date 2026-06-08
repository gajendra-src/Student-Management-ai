require('dotenv').config({ path: '.env.local' });

const { runAgentPipeline } = require('./graph');

(async () => {
  console.log('🚀 Running SMS agent pipeline manually...\n');
  try {
    const result = await runAgentPipeline();
    console.log('\n✅ Pipeline finished:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Pipeline error:', err.message);
    process.exit(1);
  }
})();
