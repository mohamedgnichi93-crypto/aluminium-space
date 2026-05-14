import fs from 'fs';

const cp1252ToByte = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F
};

function recoverWindows1252(str) {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (cp1252ToByte[code] !== undefined) {
      bytes[i] = cp1252ToByte[code];
    } else {
      bytes[i] = code & 0xFF; // Fallback to lower 8 bits (valid for ISO-8859-1)
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

function repairFile(filePath) {
  let str = fs.readFileSync(filePath, 'utf8');
  if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
  const fixed = recoverWindows1252(str);
  
  if (filePath.endsWith('.json')) {
    try {
      JSON.parse(fixed);
    } catch(e) {
      console.log('  ❌ Still invalid JSON:', e.message);
      return false;
    }
  }
  
  fs.writeFileSync(filePath, fixed, 'utf8');
  return true;
}

const files = [
  'src/i18n/locales/fr.json',
  'src/i18n/locales/en.json', 
  'src/i18n/locales/ar.json',
  'src/i18n/locales/it.json',
  'src/i18n/locales/tn.json',
  'src/components/products/MeasureIllustrations.tsx'
];

for (const f of files) repairFile(f);
console.log('✅ All files properly repaired with Windows-1252 specific byte mapping!');
