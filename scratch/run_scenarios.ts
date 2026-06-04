import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://boitmxnutzsvxlbsmdow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaXRteG51dHpzdnhsYnNtZG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTQ5MzgsImV4cCI6MjA5NDM3MDkzOH0.GoezdHY1c1n4afgQrWao6C5kU2UZHZ9-InAq2VeDAn8';

const tempDir = path.resolve(process.cwd(), 'scratch/temp');

// 1. Create temp directory structure
fs.mkdirSync(path.join(tempDir, 'lib'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'store'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'services'), { recursive: true });

function copyAndReplace(srcRelPath, destRelPath) {
  const srcPath = path.resolve(process.cwd(), srcRelPath);
  const destPath = path.join(tempDir, destRelPath);
  let content = fs.readFileSync(srcPath, 'utf-8');
  
  // Replace import.meta.env references
  content = content.replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, `'${SUPABASE_URL}'`);
  content = content.replace(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/g, `'${SUPABASE_ANON_KEY}'`);
  
  fs.writeFileSync(destPath, content, 'utf-8');
}

// Copy and patch files
copyAndReplace('src/lib/supabase.ts', 'lib/supabase.ts');
copyAndReplace('src/store/settingsStore.ts', 'store/settingsStore.ts');
copyAndReplace('src/store/productsStore.ts', 'store/productsStore.ts');
copyAndReplace('src/store/faqStore.ts', 'store/faqStore.ts');
copyAndReplace('src/services/aiAgentService.ts', 'services/aiAgentService.ts');

console.log('Sandbox directory created and patched successfully.');

async function runScenarios() {
  try {
    const { processLocalMessage } = await import('./temp/services/aiAgentService.ts');
    const history = [];

    // --- Scenario 1: User requests Colibri 50 120x150 without quantity ---
    console.log('\n--- SCENARIO 1: Request Colibri 50 120x150 (No Quantity) ---');
    const userMsg1 = 'Je veux calculer le prix pour une moustiquaire Colibri 50 en 120x150';
    console.log(`User: "${userMsg1}"`);
    
    let assistantMsg1 = '';
    const res1 = await processLocalMessage(
      userMsg1,
      history,
      (chunk) => { assistantMsg1 += chunk; },
      'fr'
    );

    console.log(`Assistant:\n"${res1.text}"`);
    console.log('Awaiting Quantity metadata:', res1.awaitingQuantity);
    console.log('Awaiting Dimensions metadata:', res1.awaitingDimensions);
    
    // Add to history
    history.push({ id: '1', role: 'user', content: userMsg1, timestamp: new Date() });
    history.push({
      id: '2',
      role: 'assistant',
      content: res1.text,
      timestamp: new Date(),
      awaitingQuantity: res1.awaitingQuantity,
      awaitingDimensions: res1.awaitingDimensions
    });

    // --- Scenario 2: Reply with quantity "3 unités" ---
    console.log('\n--- SCENARIO 2: Reply with "3 unités" ---');
    const userMsg2 = '3 unités';
    console.log(`User: "${userMsg2}"`);

    let assistantMsg2 = '';
    const res2 = await processLocalMessage(
      userMsg2,
      history,
      (chunk) => { assistantMsg2 += chunk; },
      'fr'
    );

    console.log(`Assistant:\n"${res2.text}"`);
    console.log('Contains breakdown details (HT):', res2.text.toLowerCase().includes('prix ht'));
    console.log('Contains Total TTC:', res2.text.toLowerCase().includes('total ttc'));

    // Add to history
    history.push({ id: '3', role: 'user', content: userMsg2, timestamp: new Date() });
    history.push({
      id: '4',
      role: 'assistant',
      content: res2.text,
      timestamp: new Date(),
      awaitingQuantity: res2.awaitingQuantity,
      awaitingDimensions: res2.awaitingDimensions
    });

    // --- Scenario 3: Ask for the breakdown "détaille le calcul" ---
    console.log('\n--- SCENARIO 3: Request breakdown ("détaille le calcul") ---');
    const userMsg3 = 'détaille le calcul';
    console.log(`User: "${userMsg3}"`);

    let assistantMsg3 = '';
    const res3 = await processLocalMessage(
      userMsg3,
      history,
      (chunk) => { assistantMsg3 += chunk; },
      'fr'
    );

    console.log(`Assistant:\n"${res3.text}"`);
    console.log('Contains breakdown details (HT):', res3.text.toLowerCase().includes('prix ht'));
    console.log('Contains Total TTC:', res3.text.toLowerCase().includes('total ttc'));

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('\nSandbox directory cleaned up.');
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}

runScenarios();
