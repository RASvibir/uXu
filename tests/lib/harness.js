'use strict';
/* Shared headless DOM-stub harness for CyberCat deck scripts.
 * Runs a deck's <script> in a VM context with a minimal DOM model and a
 * namespaced localStorage map. Real-browser behavior is covered separately
 * by tests/browser.js (Playwright/Puppeteer, when a browser is available). */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');
const DECK_IDS = [
  'main-player', 'now-playing', 'source-tag', 'source-meta', 'live-setlist-output',
  'setlist-count', 'set-jumps', 'track-counter', 'time-current', 'time-total', 'toast',
  'btn-play', 'btn-next', 'btn-prev', 'btn-ripple', 'deck-col', 'volume', 'vol-label',
  'show-bar', 'shows-panel', 'shows-count', 'archive-log', 'specs-block', 'manual-body',
  'brand', 'path', 'catalog-foot', 'live-clock',
  'eq-60', 'eq-230', 'eq-910', 'eq-4k', 'eq-14k', 'v-60', 'v-230', 'v-910', 'v-4k', 'v-14k',
];

function element(tag) {
  const el = {
    tagName: tag || 'div',
    children: [], listeners: {}, attrs: {}, _class: new Set(), dataset: {},
    textContent: '', innerHTML: '', value: '', hidden: false, title: '', style: {},
    paused: true, readyState: 0, currentTime: 0, duration: 0, volume: 1, src: '',
    load() {}, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; },
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    fire(t, ev) { (this.listeners[t] || []).forEach((fn) => fn.call(el, ev || {})); },
    appendChild(c) { this.children.push(c); return c; },
    append(...cs) { cs.forEach((c) => this.children.push(c)); },
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
    scrollIntoView() {}, querySelector() { return null; },
    classList: {
      add(c) { el._class.add(c); }, remove(c) { el._class.delete(c); },
      toggle(c, force) { const has = force !== undefined ? !force : !el._class.has(c); if (has) el._class.add(c); else el._class.delete(c); return has; },
      contains(c) { return el._class.has(c); },
    },
  };
  return el;
}

function applyMarkupDefaults(E) {
  if (E['now-playing']) E['now-playing'].innerHTML = '<span class="idle">No Track Loaded</span>';
  if (E['track-counter']) E['track-counter'].innerHTML = 'Tape <b>0 / 0</b>';
  if (E['time-current']) E['time-current'].textContent = '00:00';
  if (E['time-total']) E['time-total'].textContent = '00:00';
  if (E['source-tag']) E['source-tag'].textContent = 'IDLE';
  if (E['source-meta']) E['source-meta'].textContent = 'No tape loaded';
}

function readDeck(name) {
  return fs.readFileSync(path.join(ROOT, 'archives', name, 'index.html'), 'utf8');
}

function runDeck(html, opts) {
  const o = opts || {};
  const E = {};
  for (const id of DECK_IDS) E[id] = element(id === 'main-player' ? 'audio' : 'div');
  E['main-player'] = element('audio');
  E['volume'] = element('input');
  applyMarkupDefaults(E);

  const storage = new Map();
  const fetchImpl = o.fetch !== undefined
    ? o.fetch
    : () => Promise.reject(new Error('no fetch in harness'));
  const ctx = {
    document: {
      title: '',
      getElementById(id) { return E[id] || (E[id] = element('div')); },
      createElement(t) { return element(t); },
      addEventListener() {},
    },
    window: { AudioContext: undefined, webkitAudioContext: undefined },
    localStorage: {
      getItem(k) { return storage.has(k) ? storage.get(k) : null; },
      setItem(k, v) { storage.set(k, String(v)); },
      removeItem(k) { storage.delete(k); },
    },
    fetch: fetchImpl,
    console, Date, Math, Number, String, Object, Array, JSON, RegExp, Set, Map, Promise,
    setInterval: o.setInterval || (() => 0),
    clearInterval: () => {},
    setTimeout: (fn) => { o.pendingTimeouts = o.pendingTimeouts || []; o.pendingTimeouts.push(fn); return o.pendingTimeouts.length - 1; },
    clearTimeout: () => {},
  };
  ctx.globalThis = ctx;
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('deck has no <script> block');
  vm.createContext(ctx);
  vm.runInContext(m[1], ctx);
  return { ctx, E, storage, pendingTimeouts: o.pendingTimeouts };
}

/* Await the microtask queue so async manifest/fetch lifecycle settles. */
function settle(then) {
  return new Promise((resolve) => {
    const done = () => setTimeout(() => resolve(), 15);
    Promise.resolve().then(done);
  });
}

module.exports = { ROOT, DECK_IDS, element, readDeck, runDeck, applyMarkupDefaults, settle };