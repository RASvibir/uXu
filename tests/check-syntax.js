'use strict';
/* Syntax-check every sticky HTML deck <script> block in the repo
 * (archives deck index.html + root index.html + docs). Fails on parse errors. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const os = require('node:os');
const { ROOT } = require('./lib/harness');

const dirs = ['archives', '', 'docs', 'templates'];
const files = [];
for (const d of dirs) {
  const abs = d ? path.join(ROOT, d) : ROOT;
  let entries = [];
  try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { continue; }
  if (d === 'archives') {
    for (const e of entries) {
      if (e.isDirectory()) {
        const f = path.join(abs, e.name, 'index.html');
        if (fs.existsSync(f)) files.push(f);
      } else if (e.name.endsWith('.html')) {
        files.push(path.join(abs, e.name));
      }
    }
  } else {
    for (const e of entries) {
      if (e.isDirectory()) continue;
      if (e.name.endsWith('.html')) files.push(path.join(abs, e.name));
    }
  }
}

const tmp = path.join(os.tmpdir(), 'uxu-syntax-' + process.pid + '.js');
let failures = 0;
let htmlCount = 0, checked = 0;

for (const f of files) {
  htmlCount++;
  let html;
  try { html = fs.readFileSync(f, 'utf8'); } catch (err) { console.log('FAIL  cannot read ' + f + ' [' + err.message + ']'); failures++; continue; }
  let m;
  let remainder = html;
  while ((m = remainder.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)) !== null) {
    const code = m[1];
    if (!code.trim()) { remainder = remainder.slice(m.index + m[0].length); continue; }
    fs.writeFileSync(tmp, code);
    const r = cp.spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
    checked++;
    if (r.status !== 0) {
      console.log('FAIL  syntax ' + f);
      console.log(r.stderr.trim());
      failures++;
    }
    remainder = remainder.slice(m.index + m[0].length);
  }
}

if (failures === 0) {
  console.log('PASS  syntax: ' + checked + ' <script> blocks across ' + htmlCount + ' html files');
} else {
  console.log('FAIL  syntax: ' + failures + ' bad block(s)');
}
fs.rmSync(tmp, { force: true });
process.exit(failures === 0 ? 0 : 1);