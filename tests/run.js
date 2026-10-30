'use strict';
/* Test orchestrator: `npm test` -> `node tests/run.js`. Runs the node-based
 * suites in-process-sequential; puppeteer/browser suite is self-guarding. */
const cp = require('node:child_process');
const path = require('node:path');

const TASKS = [
  ['syntax check (all extracted scripts)', path.join(__dirname, 'check-syntax.js')],
  ['generic template smoke', path.join(__dirname, 'smoke-generic.js')],
  ['manifest lifecycle smoke', path.join(__dirname, 'smoke-manifest.js')],
  ['my-tape spawned runtime', path.join(__dirname, 'smoke-mytape.js')],
  ['archive token lint', path.join(__dirname, 'token-lint.js')],
  ['save-sed-to-rave generator', path.join(__dirname, 'generator.js')],
  ['sunflower immutability', path.join(__dirname, 'sunflower.js')],
  ['routes typecheck (tsc)', null],
  ['browser validation (guarded)', path.join(__dirname, 'browser.js')],
];

const results = [];
for (const [label, file] of TASKS) {
  process.stdout.write(`\n== ${label} ==\n`);
  let code;
  let output = '';
  try {
    if (file === null) {
      const r = cp.spawnSync('npx', ['tsc', '-p', path.join(__dirname, 'tsconfig.routes.json'), '--noEmit'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      code = r.status;
      output = r.stdout + r.stderr;
    } else {
      const r = cp.spawnSync(process.execPath, [file], { encoding: 'utf8' });
      code = r.status;
      output = r.stdout + r.stderr;
    }
  } catch (err) {
    code = 1;
    output = String(err && err.stack || err);
  }
  process.stdout.write(output);
  results.push([label, code === 0]);
}

console.log('\n==================== SUMMARY ====================');
let pass = true;
for (const [label, ok] of results) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label);
  if (!ok) pass = false;
}
const alone = results.filter(([, ok]) => ok).length;
console.log(`\n${alone}/${results.length} suites passed`);
process.exit(pass ? 0 : 1);