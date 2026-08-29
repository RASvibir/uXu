'use strict';
/* Browser validation (optional): guarded — SKIPs when puppeteer-core or a
 * local Chrome is unavailable, so the suite stays portable. When a browser
 * exists it covers: container mounting, boot states (empty / manifest-backed /
 * manifest-404-fallback), real audio wiring, dual-instance storage isolation
 * on the same origin, and zero unhandled exceptions on boot. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./lib/harness');

let puppeteer;
try { puppeteer = require('puppeteer-core'); }
catch { puppeteer = null; }

let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail != null && !cond ? '  [' + detail + ']' : ''));
  if (!cond) failures++;
};

const CHROME = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p));

if (!puppeteer || !CHROME) {
  console.log('SKIP  browser validation (puppeteer-core or Chrome unavailable)');
  process.exit(0);
}

const MANIFEST_OK = {
  tracks: [
    { title: 'Browser Track A', url: '/archives/CyberCat-My-Tape/audio/one.mp3', duration: 8 },
    { title: 'Browser Track B', url: '/archives/CyberCat-My-Tape/audio/two.mp3', duration: 12 },
  ],
};

function buildVariant() {
  let h = fs.readFileSync(path.join(ROOT, 'archives', 'CyberCat-Generic', 'index.html'), 'utf8');
  h = h.replace('manifestUrl: "{{SHOW_MANIFEST_URL}}",', 'manifestUrl: "/__manifest__/ok.json",');
  h = h.replace('/* {{INITIAL_TRACKS}} */', '{ title:"Local A", url:"/archives/CyberCat-My-Tape/audio/one.mp3", duration:8 },{ title:"Local B", url:"/archives/CyberCat-My-Tape/audio/two.mp3", duration:12 }');
  return h;
}

const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.json': 'application/json' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url || '/', 'http://localhost');
      if (u.pathname === '/__manifest__/ok.json') {
        res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(MANIFEST_OK)); return;
      }
      if (u.pathname === '/__manifest__/404') {
        res.writeHead(404); res.end('not found'); return;
      }
      if (u.pathname === '/deck-variant.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(buildVariant()); return;
      }
      const rel = u.pathname.replace(/^\/+/, '');
      const file = path.normalize(path.join(ROOT, rel));
      if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': CT[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

(async () => {
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}`;
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  } catch (err) {
    check('browser launch', false, err.message);
    server.close();
    process.exit(1);
  }

  try {
    const context = await browser.createBrowserContext();

    /* 1. Generic: empty baseline + no uncaught exceptions */
    const pageG = await context.newPage();
    const gErrors = [];
    pageG.on('pageerror', (e) => gErrors.push(String(e)));
    await pageG.goto(`${base}/archives/CyberCat-Generic/index.html`, { waitUntil: 'load' });
    const gBoot = await pageG.evaluate(() => ({
      container: !!document.querySelector('#cybercat-deck-container .chassis'),
      counter: document.querySelector('#track-counter')?.innerText || '',
      np: document.querySelector('#now-playing')?.innerText || '',
      src: document.querySelector('#main-player')?.getAttribute('src') || '',
    }));
    check('generic: #cybercat-deck-container mounted', gBoot.container);
    check('generic: empty baseline 0 / 0', /0 \/ 0/.test(gBoot.counter), gBoot.counter);
    check('generic: No Track Loaded', gBoot.np.includes('No Track Loaded'), gBoot.np);
    check('generic: zero uncaught exceptions', gErrors.length === 0, gErrors.join('; '));

    /* seed a namespaced value on the shared origin */
    await pageG.evaluate(() => localStorage.setItem('uxu_deck_CYBERCAT_GENERIC_volume', '0.4'));

    /* 2. My-Tape: real audio + manifest-404 fallback + isolation */
    const pageM = await context.newPage();
    const mErrors = [];
    pageM.on('pageerror', (e) => mErrors.push(String(e)));
    await pageM.goto(`${base}/archives/CyberCat-My-Tape/index.html`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 800)); // let fetch reject + fallback settle
    const mBoot = await pageM.evaluate(() => ({
      container: !!document.querySelector('#cybercat-deck-container'),
      counter: document.querySelector('#track-counter')?.innerText || '',
      src: document.querySelector('#main-player')?.getAttribute('src') || '',
      source: document.querySelector('#source-meta')?.innerText || '',
      genericKeys: Object.keys(localStorage).filter((k) => k.startsWith('uxu_deck_CYBERCAT_GENERIC_')),
      myKeys: Object.keys(localStorage).filter((k) => k.startsWith('uxu_deck_MY_TAPE_')),
    }));
    check('mytape: booted + container mounted', mBoot.container);
    check('mytape: fallback tape 1 / 2', /1 \/ 2/.test(mBoot.counter), mBoot.counter);
    check('mytape: real audio src = audio/one.mp3', /audio\/one\.mp3$/.test(mBoot.src), mBoot.src);
    check('mytape: inline fallback source label', /Inline seed tape · 2 tracks/.test(mBoot.source), mBoot.source);
    check('mytape: storage isolated (no generic keys reach)', mBoot.genericKeys.length === 0, mBoot.genericKeys.join(','));
    check('mytape: zero uncaught exceptions', mErrors.length === 0, mErrors.join('; '));

    /* 3. Manifest success over real HTTP */
    const pageV = await context.newPage();
    const vErrors = [];
    pageV.on('pageerror', (e) => vErrors.push(String(e)));
    await pageV.goto(`${base}/deck-variant.html`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 500));
    const vBoot = await pageV.evaluate(() => ({
      source: document.querySelector('#source-meta')?.innerText || '',
      chips: document.querySelectorAll('#show-bar .chip').length,
    }));
    check('manifest: fetched remote tracks and applied', /Manifest tape · 2 tracks/.test(vBoot.source), vBoot.source);
    check('manifest: zero uncaught exceptions', vErrors.length === 0, vErrors.join('; '));

    console.log(failures === 0 ? '\nBROWSER CHECKS PASSED' : `\n${failures} BROWSER CHECK(S) FAILED`);
  } catch (err) {
    check('browser run', false, err.stack || String(err));
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
  process.exit(failures ? 1 : 0);
})();