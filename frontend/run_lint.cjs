const { execSync } = require('child_process');
const fs = require('fs');
try {
  const output = execSync('npx eslint -f json .', { encoding: 'utf-8' });
  fs.writeFileSync('lint.json', output);
} catch (e) {
  fs.writeFileSync('lint.json', e.stdout);
}
