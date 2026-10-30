'use strict';
/* Generator integrity: ./save-sed-to-rave spawns a full archive room into a
 * temp dir (index.html + data.json + data.schema.json + song-index.json),
 * honoring ripple/manifest/tracks. Also enforces the token-sync invariant
 * between the template (#canonical source), the CLI, and SPAWN_SED. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const { ROOT } = require('./lib/harness');

let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail != null && !cond ? '  [' + detail + ']' : ''));
  if (!cond) failures++;
};

function runGen(args) {
  const r = cp.spawnSync('/bin/bash', [path.join(ROOT, 'save-sed-to-rave'), ...args], {
    cwd: ROOT, encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error('generator exited ' + r.status + ': ' + (r.stderr || r.stdout));
  return r.stdout;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uxu-gen-'));
const SPAWN = {
  id: 'GENCHECK', title: 'Gen Check Tape', mode: 'STANDALONE', number: '0012',
  manifest: 'api/gencheck/shows.json',
  tracks: 'audio/check-a.wav:7,audio/check-b.wav:11',
};

(async () => {
  try {
    const out = runGen(['--id', SPAWN.id, '--title', SPAWN.title, '--mode', SPAWN.mode,
      '--number', SPAWN.number, '--manifest', SPAWN.manifest,
      '--tracks', SPAWN.tracks, '--out', path.join(tmp, 'out', 'index.html')]);
    const deckDir = path.join(tmp, 'out');
    const html = fs.readFileSync(path.join(deckDir, 'index.html'), 'utf8');

    check('spawn created index.html + data.json + schema + song-index',
      ['index.html', 'data.json', 'data.schema.json', 'song-index.json'].every((f) => fs.existsSync(path.join(deckDir, f))));

    const meta = JSON.parse(fs.readFileSync(path.join(deckDir, 'data.json'), 'utf8'));
    check('data.json identity', meta.archiveId === SPAWN.id && meta.archiveName === SPAWN.title);
    check('data.json schema-conformant archiveName', typeof meta.archiveName === 'string');
    check('data.json isolated uxu.ini optIn=false', meta.uxu.ini.optIn === false);
    check('data.json storagePrefix uxu_deck_', meta.storagePrefix === 'uxu_deck_');
    check('schema copied conforms', JSON.parse(fs.readFileSync(path.join(deckDir, 'data.schema.json'), 'utf8')).required.includes('archiveName'));
    const songs = JSON.parse(fs.readFileSync(path.join(deckDir, 'song-index.json'), 'utf8'));
    check('song-index has 2 seeded', Object.keys(songs.songs).length === 2);

    for (const t of ['{{ARCHIVE_ID}}', '{{ARCHIVE_TITLE}}', '{{ARCHIVE_MODE}}', '{{SHOW_MANIFEST_URL}}']) {
      check('spawn free of ' + t, !html.includes(t));
    }
    check('spawn config ripple off-default retained', html.includes('rippleSyncEnabled: false /* {{RIPPLE_ENABLED}} */'));
    check('spawn setlist seeded real tracks', html.includes('check-a.wav'));
    check('spawn manifestUrl wired', html.includes('api/gencheck/shows.json'));
    check('generator reports id-number', out.includes(SPAWN.id + '.uXu.' + SPAWN.number));

    // --ripple on flips the config; no manifest => baseline; no song-index
    const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'uxu-gen2-'));
    runGen(['--id', 'ZIP', '--title', 'Zip', '--ripple', 'on',
      '--out', path.join(tmp2, 'out', 'index.html')]);
    const html2 = fs.readFileSync(path.join(tmp2, 'out', 'index.html'), 'utf8');
    check('ripple on -> rippleSyncEnabled: true', html2.includes('rippleSyncEnabled: true,'));
    check('no manifest -> baseline keeps setlist comment', html2.includes('/* {{INITIAL_TRACKS}} */'));
    check('no tracks -> no song-index.json', !fs.existsSync(path.join(tmp2, 'out', 'song-index.json')));

    /* ---- token-sync invariant (template = CLI = SPAWN_SED) ---- */
    const template = fs.readFileSync(path.join(ROOT, 'archives', 'CyberCat-Generic', 'index.html'), 'utf8');
    const cli = fs.readFileSync(path.join(ROOT, 'save-sed-to-rave'), 'utf8');
    const spawnSed = (template.match(/const SPAWN_SED = String\.raw`([\s\S]*?)`;/) || [])[1] || '';
    check('sync: SPAWN_SED block extractable', spawnSed.length > 0);
    const tokens = ['{{ARCHIVE_ID}}', '{{ARCHIVE_TITLE}}', '{{ARCHIVE_MODE}}', '{{RIPPLE_ENABLED}}', '{{SHOW_MANIFEST_URL}}', '{{INITIAL_TRACKS}}'];
    for (const t of tokens) {
      check('sync: template config exposes ' + t, template.includes(t));
      check('sync: CLI handles ' + t, cli.includes(t));
      check('sync: SPAWN_SED covers ' + t, spawnSed.includes(t));
    }
  } catch (err) {
    check('generator run', false, err.message);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures ? 1 : 0);
})();