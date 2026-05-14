const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src', 'i18n', 'locales');
const fr = JSON.parse(fs.readFileSync(path.join(localesPath, 'fr.json'), 'utf8'));
const ar = JSON.parse(fs.readFileSync(path.join(localesPath, 'ar.json'), 'utf8'));
const tn = JSON.parse(fs.readFileSync(path.join(localesPath, 'tn.json'), 'utf8'));

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const frKeys = getKeys(fr);
const arKeys = getKeys(ar);
const tnKeys = getKeys(tn);

console.log('Missing in ar.json:');
frKeys.forEach(k => {
  if (!arKeys.includes(k)) console.log(`- ${k}`);
});

console.log('\nMissing in tn.json:');
frKeys.forEach(k => {
  if (!tnKeys.includes(k)) console.log(`- ${k}`);
});
