/**
 * CyberCat offline tape locker — shared by live deck + offline player.
 * Temp tapes: manifest queued instantly; audio downloads on engage; auto-expire.
 * Kept tapes: up to 13 permanent slots (user opt-in).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.CyberCatOfflineStore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DB_NAME = 'cybercat-offline';
  const DB_VERSION = 2;
  const STORE = 'tapes';
  const MAX_KEPT = 13;
  const TEMP_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const API_BASE = 'https://rasvibir-api.chrf-podcast.workers.dev';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
    });
  }

  function txPromise(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('transaction aborted'));
    });
  }

  async function listTapes() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function getTape(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function putTape(record) {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    await txPromise(tx);
    return record;
  }

  async function deleteTape(id) {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    await txPromise(tx);
  }

  function streamUrlCandidates(raw) {
    if (!raw) return [];
    const urls = [raw];
    if (!String(raw).includes('/api/stream')) {
      urls.push(`${API_BASE}/api/stream?url=${encodeURIComponent(raw)}`);
    }
    return urls;
  }

  async function fetchTrackBlob(url, onProgress) {
    let lastErr = null;
    for (const candidate of streamUrlCandidates(url)) {
      try {
        const res = await fetch(candidate);
        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status}`);
          continue;
        }
        if (!res.body || !res.body.getReader) {
          return await res.blob();
        }
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
        const total = Number(res.headers.get('Content-Length')) || 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (onProgress && total) onProgress(received / total);
        }
        return new Blob(chunks, { type: res.headers.get('Content-Type') || 'audio/mpeg' });
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('fetch failed');
  }

  function isExpired(tape) {
    if (!tape || tape.status === 'kept') return false;
    if (!tape.expiresAt) return false;
    return Date.now() > tape.expiresAt;
  }

  async function purgeExpired() {
    const all = await listTapes();
    const expired = all.filter((t) => t.status === 'temp' && isExpired(t));
    for (const t of expired) await deleteTape(t.id);
    return expired.length;
  }

  async function countKept() {
    const all = await listTapes();
    return all.filter((t) => t.status === 'kept').length;
  }

  function normalizeTape(record) {
    const now = Date.now();
    const status = record.status === 'kept' ? 'kept' : 'temp';
    return {
      id: record.id,
      showDate: record.showDate || '',
      venue: record.venue || '',
      place: record.place || '',
      sourceLabel: record.sourceLabel || '',
      status,
      queuedAt: record.queuedAt || new Date().toISOString(),
      engagedAt: record.engagedAt || null,
      expiresAt: status === 'kept' ? null : (record.expiresAt || now + TEMP_TTL_MS),
      trackCount: record.trackCount || (record.tracks && record.tracks.length) || 0,
      bytes: record.bytes || 0,
      fullyDownloaded: !!record.fullyDownloaded,
      tracks: (record.tracks || []).map((t) => ({
        title: t.title || 'Track',
        url: t.url || null,
        blob: t.blob || null,
      })),
    };
  }

  async function queueTape(record, { keep = false } = {}) {
    await purgeExpired();
    if (keep) {
      const kept = await countKept();
      if (kept >= MAX_KEPT) {
        const err = new Error(`Locker full (${MAX_KEPT} kept tapes). Remove one in Offline Player.`);
        err.code = 'LOCKER_FULL';
        throw err;
      }
    }
    const tape = normalizeTape({
      ...record,
      status: keep ? 'kept' : 'temp',
      fullyDownloaded: false,
      bytes: 0,
      tracks: (record.tracks || []).map((t) => ({ title: t.title, url: t.url, blob: null })),
      queuedAt: new Date().toISOString(),
      expiresAt: keep ? null : Date.now() + TEMP_TTL_MS,
    });
    await putTape(tape);
    return tape;
  }

  async function promoteToKept(id) {
    const tape = await getTape(id);
    if (!tape) throw new Error('Tape not found');
    if (tape.status === 'kept') return tape;
    const kept = await countKept();
    if (kept >= MAX_KEPT) {
      const err = new Error(`Locker full (${MAX_KEPT}). Un-keep a tape first.`);
      err.code = 'LOCKER_FULL';
      throw err;
    }
    tape.status = 'kept';
    tape.expiresAt = null;
    await putTape(tape);
    return tape;
  }

  async function demoteToTemp(id) {
    const tape = await getTape(id);
    if (!tape) throw new Error('Tape not found');
    tape.status = 'temp';
    tape.expiresAt = Date.now() + TEMP_TTL_MS;
    await putTape(tape);
    return tape;
  }

  async function downloadTape(id, { onProgress, signal } = {}) {
    const tape = await getTape(id);
    if (!tape) throw new Error('Tape not found');
    if (tape.fullyDownloaded && tape.tracks.every((t) => t.blob)) return tape;

    const tracks = tape.tracks || [];
    let bytes = 0;
    for (let i = 0; i < tracks.length; i++) {
      if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const tr = tracks[i];
      if (tr.blob) {
        bytes += tr.blob.size || 0;
        continue;
      }
      if (!tr.url) throw new Error(`Track ${i + 1} has no URL`);
      if (onProgress) onProgress({ phase: 'track', index: i, total: tracks.length, title: tr.title });
      const blob = await fetchTrackBlob(tr.url);
      tr.blob = blob;
      bytes += blob.size || 0;
      tape.bytes = bytes;
      tape.tracks = tracks;
      await putTape(tape);
    }
    tape.fullyDownloaded = true;
    tape.engagedAt = new Date().toISOString();
    tape.bytes = bytes;
    if (tape.status === 'temp') {
      tape.expiresAt = Date.now() + TEMP_TTL_MS;
    }
    await putTape(tape);
    return tape;
  }

  async function clearTempTapes() {
    const all = await listTapes();
    const temps = all.filter((t) => t.status === 'temp');
    for (const t of temps) await deleteTape(t.id);
    return temps.length;
  }

  function lockerSummary(tapes) {
    const kept = tapes.filter((t) => t.status === 'kept');
    const temp = tapes.filter((t) => t.status === 'temp');
    const ready = tapes.filter((t) => t.fullyDownloaded);
    const bytes = tapes.reduce((n, t) => n + (t.bytes || 0), 0);
    return { kept: kept.length, temp: temp.length, ready: ready.length, bytes, maxKept: MAX_KEPT };
  }

  return {
    API_BASE,
    MAX_KEPT,
    TEMP_TTL_MS,
    listTapes,
    getTape,
    putTape,
    deleteTape,
    queueTape,
    promoteToKept,
    demoteToTemp,
    downloadTape,
    purgeExpired,
    countKept,
    clearTempTapes,
    isExpired,
    lockerSummary,
    streamUrlCandidates,
    fetchTrackBlob,
  };
});
