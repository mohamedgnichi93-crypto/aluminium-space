const fs = require('fs');
const path = require('path');

const files = [
  'src/i18n/locales/tn.json',
  'src/pages/Home.tsx',
  'src/pages/About.tsx',
  'src/pages/ClientPortal.tsx',
  'src/services/aiAgentService.ts'
];

let totalReplacements = 0;

for (const relPath of files) {
  const filePath = path.join(process.cwd(), relPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We are replacing "موستيكار" with "مستيكار"
    const matches = content.match(/موستيكار/g);
    if (matches && matches.length > 0) {
      totalReplacements += matches.length;
      console.log(`Found ${matches.length} occurrences in ${relPath}`);
      content = content.replace(/موستيكار/g, 'مستيكار');
      fs.writeFileSync(filePath, content, 'utf8');
    } else {
      console.log(`Found 0 occurrences in ${relPath}`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
}

console.log(`\nTotal replacements made: ${totalReplacements}`);
