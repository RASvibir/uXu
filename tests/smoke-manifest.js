'use strict';
/* Smoke: hybrid manifest lifecycle — manifest-backed content applies;
 * network failure / non-200 / empty manifest gracefully falls back to the
 * inline seed; empty both stays at the baseline 0 / 0. */
const { readDeck, runDeck, settle } = require('./lib/harness');

const template = readDeck('CyberCat-Generic');
const SEED = '{ title:"Seed One", url:"seed1.mp3", duration:60 },{ title:"Seed Two", url:"seed2.mp3", duration:90 }';

function variant(manifestUrl, seedTracks) {
  let h = template;
  if (manifestUrl !== undefined) h = h.replace('manifestUrl: "{{SHOW_MANIFEST_URL}}",', `manifestUrl: "${manifestUrl}",`);
  if (seedTracks !== undefined) h = h.replace('/* {{INITIAL_TRACKS}} */', seedTracks);
  return h;
}

let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail != null && !cond ? '  [' + detail + ']' : ''));
  if (!cond) failures++;
};

async function scenario(name, html, fetchImpl, expect) {
  const { E } = runDeck(html, { fetch: fetchImpl });
  await settle();
  const r = expect(E);
  check(name, r.pass, r.detail);
}

const MANIFEST_TRACKS = { tracks: [{ title: 'Remote A', url: 'remoteA.mp3', duration: 300 }] };
const MANIFEST_SHOWS = { shows: [{ id: 's1', title: 'Live Night', tracks: [{ title: 'Show Track', url: 'show1.mp3', duration: 420 }] }] };

(async () => {
  await scenario('manifest-tracks apply over inline seed',
    variant('https://x/shows.json', SEED),
    () => Promise.resolve({ ok: true, json: () => Promise.resolve(MANIFEST_TRACKS) }),
    (E) => ({ pass: /Manifest tape · 1 tracks/.test(E['source-meta'].textContent), detail: E['source-meta'].textContent }));

  await scenario('network failure -> inline seed fallback',
    variant('https://x/shows.json', SEED),
    () => Promise.reject(new Error('offline')),
    (E) => ({ pass: /Inline seed tape · 2 tracks/.test(E['source-meta'].textContent), detail: E['source-meta'].textContent }));

  await scenario('HTTP 404 -> inline seed fallback',
    variant('https://x/shows.json', SEED),
    () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
    (E) => ({ pass: /Inline seed tape · 2 tracks/.test(E['source-meta'].textContent), detail: E['source-meta'].textContent }));

  await scenario('manifest shows populate chip bar + load',
    variant('https://x/shows.json', SEED),
    () => Promise.resolve({ ok: true, json: () => Promise.resolve(MANIFEST_SHOWS) }),
    (E) => ({ pass: E['show-bar'].children.length === 1 && /Live Night · 1 tracks/.test(E['source-meta'].textContent), detail: 'chips=' + E['show-bar'].children.length + ' ' + E['source-meta'].textContent }));

  await scenario('empty manifest object -> inline seed fallback',
    variant('https://x/shows.json', SEED),
    () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    (E) => ({ pass: /Inline seed tape · 2 tracks/.test(E['source-meta'].textContent), detail: E['source-meta'].textContent }));

  await scenario('empty manifest + no seed -> baseline 0 / 0',
    variant('https://x/shows.json', ''),
    () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    (E) => ({ pass: E['track-counter'].innerHTML.includes('0 / 0') && E['now-playing'].innerHTML.includes('No Track Loaded') && E['source-tag'].textContent === 'IDLE', detail: E['track-counter'].innerHTML + ' | ' + E['now-playing'].innerHTML }));

  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures ? 1 : 0);
})();