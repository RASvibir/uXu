'use strict';
/* Smoke: pristine Generic template — empty-load baseline, tokens, container,
 * isolation contract. Mirrors a real boot with zero tracks and zero network. */
const { readDeck, runDeck } = require('./lib/harness');

const html = readDeck('CyberCat-Generic');
let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail != null && !cond ? '  [' + detail + ']' : ''));
  if (!cond) failures++;
};

/* ---- static markup / template-token checks ---- */
check('container #cybercat-deck-container present', html.includes('id="cybercat-deck-container"'));
check('only-child fullscreen CSS exists', html.includes('#cybercat-deck-container:only-child'));
check('embedded floor exists', html.includes('#cybercat-deck-container:not(:only-child) .chassis'));
check('hotlink titles', html.includes('{{ARCHIVE_ID}}'));
check('hotlink titles', html.includes('{{ARCHIVE_TITLE}}'));
check('hotlink titles', html.includes('{{ARCHIVE_MODE}}'));
check('ripple off-default token', html.includes('rippleSyncEnabled: false /* {{RIPPLE_ENABLED}} */'));
check('SPAWN_SED ripple flag is sed-safe', html.includes('s@false /\\* {{RIPPLE_ENABLED}} \\*/@true@'));
check('manifest token', html.includes('manifestUrl: "{{SHOW_MANIFEST_URL}}"'));
check('setlist token', html.includes('/* {{INITIAL_TRACKS}} */'));
check('seed alias = setlist', html.includes('const INITIAL_TRACKS = ARCHIVE_CONFIG.setlist;'));
check('single STORAGE_KEY definition', (html.match(/const STORAGE_KEY =/g) || []).length === 1);
check('storage prefix const uxu_deck_', html.includes("const DECK_STORAGE_PREFIX = 'uxu_deck_';"));
check('herd channel derives from archiveId', html.includes('RIPPLE_HERD_CHANNEL = `${ARCHIVE_CONFIG.archiveId.toLowerCase()}:herd-sync`'));
check('SPAWN_SED raw template present', html.includes('const SPAWN_SED = String.raw`'));
check('no stale underscore tokens', !/(__ARCHIVE|__INITIAL|__RIPPLE)/.test(html));
check('manifest hybrid lifecycle wired', html.includes('commenceManifestLoad') && html.includes('seedFallback') && html.includes('applyManifest'));
check('audio error handler present', /player\.addEventListener\('error'/.test(html));
check('static empty-state markup present', html.includes('>0 TRACKS</span>'));
check('static 0 / 0 counter', html.includes('id="track-counter">Tape <b>0 / 0</b>'));
check('static No Track Loaded', html.includes('No Track Loaded'));
check('static timers 00:00', html.includes('id="time-current">00:00</b>') && html.includes('id="time-total">00:00</b>'));

/* ---- DOM stub boot ---- */
const { ctx, E, storage } = runDeck(html);
check('boot ran without throwing', true);

/* empty-load baseline behaviors */
ctx.loadTracks([], 'GAP', 'Empty tape');
check('loadTracks([]) renders grace row', E['live-setlist-output'].innerHTML.includes('No playable tracks on this transfer.'));
check('loadTracks([]) sets 0 TRACKS', E['setlist-count'].textContent === '0 TRACKS');
check('loadTracks([]) No Track Loaded', E['now-playing'].innerHTML.includes('No Track Loaded'));
check('loadTracks([]) 0 / 0', E['track-counter'].innerHTML.includes('0 / 0'));
check('loadTracks([]) 00:00 timers', E['time-current'].textContent === '00:00' && E['time-total'].textContent === '00:00');
check('loadTracks([]) IDLE tag', E['source-tag'].textContent === 'IDLE');

ctx.togglePlay(); check('togglePlay empty -> toast', E['toast'].textContent.includes('No tape loaded'));
ctx.nextTrack(); check('nextTrack empty -> toast', E['toast'].textContent.includes('No tape loaded'));
ctx.prevTrack(); check('prevTrack empty -> toast', E['toast'].textContent.includes('No tape loaded'));
ctx.toggleRipple(); check('ripple empty -> toast', E['toast'].textContent.includes('Nothing to ripple'));
ctx.engageShow({ id: 'S1', title: 'Empty show', tracks: [] }); check('empty show -> toast', E['toast'].textContent.includes('Show has no playable tracks'));

const prefix = 'uxu_deck_CYBERCAT_GENERIC_';
const keys = Array.from(storage.keys());
check('storage keys namespaced (uxu_deck_)', keys.every((k) => k.startsWith(prefix)), keys.join(','));
check('MANIFEST line present in log', E['archive-log'].textContent.includes('MANIFEST : '));
check('HERD channel line present in log', E['archive-log'].textContent.includes(':herd-sync'));
check('ripple stays OFF at boot', ctx.audioCtxReadyForRippleRestore() === false);

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures ? 1 : 0);