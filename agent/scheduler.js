require('dotenv').config({ path: '.env.local' });
const cron = require('node-cron');
const { runAgentPipeline } = require('./graph');

console.log('🕐 SMS Agent Scheduler started — will trigger at 9:00 AM daily');

// Run every day at 9:00 AM (server local time)
cron.schedule('0 9 * * *', async () => {
  console.log('\n⏰ CRON TRIGGER — Starting agent pipeline...');
  try {
    const result = await runAgentPipeline();
    console.log('✅ Pipeline completed:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Pipeline failed:', err.message);
  }
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Scheduler stopped.');
  process.exit(0);
});
