'use strict';
/* Smoke: CyberCat-My-Tape — the checked-in spawned archive. Boots with its
 * manifest URL (fetch fails in the headless context) and must fall back to
 * the inline WAV seed and play. Also asserts the generated data files and
 * real audio assets exist. */
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, readDeck, runDeck, settle } = require('./lib/harness');

let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail != null && !cond ? '  [' + detail + ']' : ''));
  if (!cond) failures++;
};

(async () => {
  const html = readDeck('CyberCat-My-Tape');
  const { ctx, E, storage } = runDeck(html); // fetch rejects -> inline fallback
  check('spawned deck booted without throwing', true);

  await settle();

  const player = E['main-player'];
  check('fallback autoloaded 2 tracks (1 / 2)', E['track-counter'].innerHTML.includes('1 / 2'), E['track-counter'].innerHTML);
  check('now-playing shows track title', /ONE/.test(E['now-playing'].innerHTML), E['now-playing'].innerHTML);
  check('setlist rendered 2 rows', E['live-setlist-output'].children.length === 2, String(E['live-setlist-output'].children.length));
  check('setlist counter 2 TRACKS', E['setlist-count'].textContent === '2 TRACKS');
  check('source meta 2 tracks', /2 tracks/.test(E['source-meta'].textContent), E['source-meta'].textContent);
  check('player src = audio/one.mp3', player.src === 'audio/one.mp3', player.src);
  check('brand uses spawned id', String(E['brand'].textContent) === 'MY TAPE', E['brand'].textContent);
  check('title is My Tape Archive', ctx.document.title.includes('My Tape Archive'), ctx.document.title);
  check('manifest state = offline fallback', E['archive-log'].textContent.includes('offline — inline fallback'), E['archive-log'].textContent.split('\n').find((l) => l.includes('MANIFEST')));
  check('manifest URL surfaced in log', E['archive-log'].textContent.includes('api/my_tape/shows.json'));

  ctx.nextTrack();
  check('nextTrack -> track 2', E['track-counter'].innerHTML.includes('2 / 2'));
  ctx.togglePlay(); check('togglePlay toggles', player.paused === true);
  ctx.togglePlay(); check('togglePlay resumes', player.paused === false);
  ctx.toggleRipple(); check('ripple with playlist starts', E['deck-col']._class.has('ripple-on'));
  ctx.toggleRipple(); check('ripple toggles off', !E['deck-col']._class.has('ripple-on'));

  player.currentTime = 60;
  player.fire('timeupdate');
  const last = JSON.parse(storage.get('uxu_deck_MY_TAPE_last-play') || '{}');
  check('last-play persisted under uxu_deck_MY_TAPE_', storage.has('uxu_deck_MY_TAPE_last-play'));
  check('last-play persisted with real time', last.t === 60, JSON.stringify(last));

  /* P1: generated data files + real audio */
  const deckDir = path.join(ROOT, 'archives', 'CyberCat-My-Tape');
  const mustHave = ['data.json', 'data.schema.json', 'song-index.json'];
  for (const f of mustHave) {
    const ok = fs.existsSync(path.join(deckDir, f));
    check('generated file present: ' + f, ok);
  }
  const meta = JSON.parse(fs.readFileSync(path.join(deckDir, 'data.json'), 'utf8'));
  check('data.json archiveId = MY_TAPE', meta.archiveId === 'MY_TAPE', String(meta.archiveId));
  check('data.json uxu.ini optIn default false (isolated)', meta.uxu && meta.uxu.ini && meta.uxu.ini.optIn === false);
  const schema = JSON.parse(fs.readFileSync(path.join(deckDir, 'data.schema.json'), 'utf8'));
  check('data.json conforms to schema (archiveName)', typeof meta.archiveName === 'string' && schema.required.includes('archiveName'));
  const songs = JSON.parse(fs.readFileSync(path.join(deckDir, 'song-index.json'), 'utf8'));
  check('song-index has seeded tracks', Object.keys(songs.songs).length === 2, JSON.stringify(songs.songs));
  for (const a of ['one.mp3', 'two.mp3']) {
    const p = path.join(deckDir, 'audio', a);
    const ok = fs.existsSync(p) && fs.statSync(p).size > 1000;
    check('real audio asset plays back: ' + a, ok);
  }

  console.log(failures === 0 ? '\nMY_TAPE RUNTIME CHECKS PASSED' : `\n${failures} FAILED`);
  process.exit(failures ? 1 : 0);
})();