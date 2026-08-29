'use strict';
/* Token lint: the Generic template owns all {{TOKEN}} hooks. Spawned / legacy /
 * reference decks must be free of the four g-tokens (ARCHIVE_ID/TITLE/MODE,
 * SHOW_MANIFEST_URL); the only sanctioned `{{` leftovers are the OFF-default
 * {{RIPPLE_ENABLED}} + {{INITIAL_TRACKS}} scope comments and the {{TOKEN}} /
 * {{next}} documentation escapes. */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./lib/harness');

const G_TOKENS = ['{{ARCHIVE_ID}}', '{{ARCHIVE_TITLE}}', '{{ARCHIVE_MODE}}', '{{SHOW_MANIFEST_URL}}'];
const SPAWN_SCOPE_TOKENS = ['{{RIPPLE_ENABLED}}', '{{INITIAL_TRACKS}}'];
const ALL_SIX = [...G_TOKENS, ...SPAWN_SCOPE_TOKENS];

let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail != null && !cond ? '  [' + detail + ']' : ''));
  if (!cond) failures++;
};

const decksDir = path.join(ROOT, 'archives');
const dirs = fs.readdirSync(decksDir, { withFileTypes: true }).filter((e) => e.isDirectory());

for (const d of dirs) {
  const index = path.join(decksDir, d.name, 'index.html');
  if (!fs.existsSync(index)) continue;
  const html = fs.readFileSync(index, 'utf8');

  if (d.name === 'CyberCat-Generic') {
    for (const t of ALL_SIX) check('template has hook ' + t, html.includes(t));
    continue;
  }

  /* Spawned decks: the four g-tokens must be gone; the only sanctioned `{{`
   * leftovers are the OFF-default ripple + setlist scope comments, the generic
   * docs reference ({{TOKEN}}), the series-doc escape ({{next}}), and SPAWN_SED
   * self-documentation — all stripped below before asserting clean text. */
  for (const t of G_TOKENS) {
    check(d.name + ' has no ' + t, !html.includes(t));
  }
  const sanitized = ['{{RIPPLE_ENABLED}}', '{{INITIAL_TRACKS}}', '{{TOKEN}}', '{{next}}']
    .reduce((acc, t) => acc.split(t).join(''), html);
  check(d.name + ' is token-free (scope tokens only)', !sanitized.includes('{{'), 'found {{');
}

/* Every spawned deck must reference the generator-compatible token set in SPAWN_SED/docs */
const generic = fs.readFileSync(path.join(decksDir, 'CyberCat-Generic', 'index.html'), 'utf8');
for (const t of ALL_SIX) check('SPAWN_SED covers ' + t, generic.includes(t));

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures ? 1 : 0);