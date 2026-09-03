'use strict';
/* Sunflower baseline: the reference deck must remain byte-identical to its
 * committed state — no modified, staged, or untracked files. */
const cp = require('node:child_process');
const { ROOT } = require('./lib/harness');

let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail != null && !cond ? '  [' + detail + ']' : ''));
  if (!cond) failures++;
};

let status = '';
try {
  status = cp.execSync('git status --porcelain -- archives/CyberCat-Sunflower', { cwd: ROOT, encoding: 'utf8' });
} catch (err) {
  check('git status runs', false, err.message);
  process.exit(1);
}
check('Sunflower has zero working-tree changes', status.trim() === '', status.trim() || '(clean)');

let diff = '';
try {
  diff = cp.execSync('git diff --stat -- archives/CyberCat-Sunflower', { cwd: ROOT, encoding: 'utf8' });
} catch (err) {
  check('git diff runs', false, err.message);
  process.exit(1);
}
check('Sunflower diff against HEAD empty', diff.trim() === '', diff.trim() || '(no diff)');

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures ? 1 : 0);