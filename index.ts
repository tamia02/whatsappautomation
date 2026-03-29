import { runGrowthAgent } from './agents/main_agent.js';

const niche = process.argv[2] || 'Dentist';
const location = process.argv[3] || 'Noida';

runGrowthAgent(niche, location).then(() => {
    console.log('✅ Growth Agent Cycle Completed.');
}).catch(err => {
    console.error('❌ Growth Agent Cycle Failed:', err);
});
