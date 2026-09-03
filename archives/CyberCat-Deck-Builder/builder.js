/* CyberCat Deck Builder — cosmetics + plug-in sources. Isolated from Sunflower. */
(function () {
  const BRAND_PREFIX = 'CyberCat';
  const LIBRARY_KEY = 'uxu_deck_DECK_BUILDER_library';
  const ACTIVE_KEY = 'uxu_deck_DECK_BUILDER_active';
  const IDB_NAME = 'uxu_deck_DECK_BUILDER_blobs';
  const AUDIO_EXT = /\.(mp3|wav|flac|ogg|m4a|aac)(\?|$)/i;
  let objectUrls = [];

  const LOOKS = {
    Lathe: {
      chassis: '#1c2228', hi: '#2e3842', void: '#0e1216', phosphor: '#4aa3d9',
      display: '#c5d4de', accent: '#e07a3d', amber: '#d4c4a8', text: '#dce4ea',
      room: '#1a2830', glow: 0.22, scan: 0.04, radius: 4, font: "'IBM Plex Sans', sans-serif",
    },
    Graphite: {
      chassis: '#222426', hi: '#3a3d42', void: '#121314', phosphor: '#9aa3ad',
      display: '#e6eaee', accent: '#6b8f71', amber: '#c4b8a4', text: '#e8eaed',
      room: '#1c1e20', glow: 0.18, scan: 0.02, radius: 3, font: "'Share Tech Mono', monospace",
    },
    Cipher: {
      chassis: '#1a1410', hi: '#2c2418', void: '#0a0908', phosphor: '#e8b923',
      display: '#f4e8d0', accent: '#c41e3a', amber: '#ffd76a', text: '#f4e8d0',
      room: '#3d1f14', glow: 0.45, scan: 0.12, radius: 8, font: "'Oswald', sans-serif",
    },
    Brick: {
      chassis: '#1c1010', hi: '#3a1818', void: '#0c0606', phosphor: '#e8b923',
      display: '#f7e4d4', accent: '#9b1b30', amber: '#f0c14b', text: '#f7e4d4',
      room: '#4a1810', glow: 0.5, scan: 0.08, radius: 6, font: "'Archivo Black', sans-serif",
    },
    Cream: {
      chassis: '#cfc4a8', hi: '#e8dfc8', void: '#1a1810', phosphor: '#2a6b3c',
      display: '#1e4d8c', accent: '#8c2a2a', amber: '#8a5a10', text: '#efe6d0',
      room: '#8a7a58', glow: 0.25, scan: 0.15, radius: 28, font: "'Share Tech Mono', monospace",
    },
  };

  const DEFAULT_LOOK = LOOKS.Lathe;

  function looksLikeSunflowerTheme(t) {
    if (!t) return false;
    const blob = [t.phosphor, t.display, t.accent, t.chassis, t.hi, t.void, t.font, t.room]
      .map((v) => String(v || '').toLowerCase()).join(' ');
    if (/5dff8a|39ff14|4de8ff|7af0ff|ff3dce|ff6adf|1a1424|05030a|orbitron|vt323|press start/.test(blob)) {
      return true;
    }
    return Number(t.scan) >= 0.4;
  }

  function sanitizeTheme(t) {
    if (!t || looksLikeSunflowerTheme(t)) return { ...DEFAULT_LOOK };
    return t;
  }

  function canonicalTitle(userName) {
    const rest = String(userName || '').replace(/^\s*cybercat\s+/i, '').trim();
    return rest ? `${BRAND_PREFIX} ${rest}` : BRAND_PREFIX;
  }

  function slugFromName(userName) {
    const rest = String(userName || '').replace(/^\s*cybercat\s+/i, '').trim();
    const slug = rest.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
    return slug ? `U_${slug}` : '';
  }

  function nameKey(userName) {
    return String(userName || '').replace(/^\s*cybercat\s+/i, '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function currentDeckId() {
    const id = ARCHIVE_CONFIG.archiveId;
    return (!id || id === 'DECK_BUILDER') ? '' : id;
  }

  function deckExistsConflict(userName, exceptId) {
    const key = nameKey(userName);
    const slug = slugFromName(userName);
    if (!key) return false;
    return readLibrary().some((d) => {
      if (exceptId && d.id === exceptId) return false;
      const otherKey = nameKey(d.userName || String(d.title || '').replace(/^CyberCat\s+/i, ''));
      return otherKey === key || (!!slug && d.id === slug);
    });
  }

  function showDeckExistsError(on) {
    const el = document.getElementById('deck-name-error');
    const input = document.getElementById('deck-name');
    if (el) el.hidden = !on;
    if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  function readLibrary() {
    try {
      const list = JSON.parse(globalThis.localStorage.getItem(LIBRARY_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }

  function writeLibrary(list) {
    try {
      globalThis.localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
      return true;
    } catch {
      toast('Could not save — this browser’s storage is full');
      return false;
    }
  }

  async function fetchTimed(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      return await fetch(url, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  function openBlobDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains('files')) req.result.createObjectStore('files');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function putBlob(key, blob) {
    const db = await openBlobDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(blob, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getBlob(key) {
    const db = await openBlobDb();
    return new Promise((resolve, reject) => {
      const q = db.transaction('files', 'readonly').objectStore('files').get(key);
      q.onsuccess = () => resolve(q.result || null);
      q.onerror = () => reject(q.error);
    });
  }

  async function deleteBlob(key) {
    if (!key) return;
    const db = await openBlobDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function revokeAllObjectUrls() {
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    objectUrls = [];
  }

  function currentUserName() {
    return document.getElementById('deck-name').value.trim();
  }

  function paintCanonical() {
    document.getElementById('canonical-title').textContent = canonicalTitle(currentUserName());
  }

  function readTheme() {
    return {
      chassis: document.getElementById('theme-chassis').value,
      hi: document.getElementById('theme-hi').value,
      void: document.getElementById('theme-void').value,
      phosphor: document.getElementById('theme-phosphor').value,
      display: document.getElementById('theme-display').value,
      accent: document.getElementById('theme-accent').value,
      amber: document.getElementById('theme-amber').value,
      text: document.getElementById('theme-text').value,
      room: document.getElementById('theme-room').value,
      glow: Number(document.getElementById('theme-glow').value),
      scan: Number(document.getElementById('theme-scan').value),
      radius: Number(document.getElementById('theme-radius').value),
      ripple: Number(document.getElementById('theme-ripple')?.value || 1),
      font: document.getElementById('face-font').value,
    };
  }

  function writeThemeInputs(t) {
    const map = {
      'theme-chassis': t.chassis, 'theme-hi': t.hi, 'theme-void': t.void,
      'theme-phosphor': t.phosphor, 'theme-display': t.display, 'theme-accent': t.accent,
      'theme-amber': t.amber, 'theme-text': t.text, 'theme-room': t.room,
    };
    Object.entries(map).forEach(([id, v]) => { if (v) document.getElementById(id).value = v; });
    if (t.glow != null) document.getElementById('theme-glow').value = String(t.glow);
    if (t.scan != null) document.getElementById('theme-scan').value = String(t.scan);
    if (t.radius != null) document.getElementById('theme-radius').value = String(t.radius);
    if (t.ripple != null && document.getElementById('theme-ripple')) {
      document.getElementById('theme-ripple').value = String(t.ripple);
    }
    if (t.font) document.getElementById('face-font').value = t.font;
  }

  function applyTheme(t) {
    const theme = t || readTheme();
    const root = document.documentElement;
    root.style.setProperty('--bezel', theme.chassis);
    root.style.setProperty('--bezel-hi', theme.hi || theme.chassis);
    root.style.setProperty('--void', theme.void);
    root.style.setProperty('--phosphor', theme.phosphor);
    root.style.setProperty('--cyan', theme.display);
    root.style.setProperty('--magenta', theme.accent);
    root.style.setProperty('--amber', theme.amber);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--room', theme.room);
    root.style.setProperty('--glow', String(theme.glow));
    root.style.setProperty('--scan', String(theme.scan));
    root.style.setProperty('--radius', `${theme.radius}px`);
    root.style.setProperty('--ripple-scale', String(theme.ripple != null ? theme.ripple : 1));
    root.style.setProperty('--display', theme.font);
    root.style.setProperty('--phosphor-dim', theme.phosphor);
  }

  function refreshDeckSelect(activeId) {
    const sel = document.getElementById('saved-decks');
    const lib = readLibrary();
    sel.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = lib.length ? '— choose a saved deck —' : '— none saved yet —';
    sel.appendChild(blank);
    lib.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.title;
      if (d.id === activeId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function serializePlaylist() {
    return playlist.map((t, i) => ({
      title: t.title || `Track ${i + 1}`,
      kind: t.kind || (t.blobKey ? 'file' : 'link'),
      url: t.kind === 'file' ? '' : (t.url || t.src || ''),
      blobKey: t.blobKey || '',
      duration: Number(t.duration) || 0,
    }));
  }

  const DEFAULT_FAVICON = '';
  let currentFavicon = { kind: 'default' };
  let faviconObjectUrl = '';

  function applyFaviconHref(href) {
    const link = document.getElementById('deck-favicon');
    const preview = document.getElementById('favicon-preview');
    if (!href) {
      if (link) link.removeAttribute('href');
      if (preview) preview.removeAttribute('src');
      return;
    }
    if (link) link.setAttribute('href', href);
    if (preview) preview.src = href;
  }

  async function applyFavicon(spec) {
    currentFavicon = spec && spec.kind ? spec : { kind: 'default' };
    if (faviconObjectUrl) {
      URL.revokeObjectURL(faviconObjectUrl);
      faviconObjectUrl = '';
    }
    if (currentFavicon.kind === 'url' && currentFavicon.url) {
      applyFaviconHref(currentFavicon.url);
      const urlInput = document.getElementById('favicon-url');
      if (urlInput) urlInput.value = currentFavicon.url;
      return;
    }
    if (currentFavicon.kind === 'data' && currentFavicon.dataUrl) {
      applyFaviconHref(currentFavicon.dataUrl);
      return;
    }
    if (currentFavicon.kind === 'file' && currentFavicon.blobKey) {
      const blob = await getBlob(currentFavicon.blobKey).catch(() => null);
      if (blob) {
        faviconObjectUrl = URL.createObjectURL(blob);
        applyFaviconHref(faviconObjectUrl);
        return;
      }
    }
    currentFavicon = { kind: 'default' };
    applyFaviconHref(DEFAULT_FAVICON);
    const urlInput = document.getElementById('favicon-url');
    if (urlInput) urlInput.value = '';
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function setFaviconFromFile(file) {
    if (!file) return;
    if (!/^image\//i.test(file.type) && !/\.(ico|png|svg|webp|gif|jpe?g)$/i.test(file.name || '')) {
      toast('Use an image file (.png .svg .ico .webp)');
      return;
    }
    if (file.size > 512 * 1024) {
      toast('Favicon must be 512 KB or smaller');
      return;
    }
    await ensureNamedDeck();
    if (ARCHIVE_CONFIG.archiveId === 'DECK_BUILDER') return;
    const blobKey = `${ARCHIVE_CONFIG.archiveId}:favicon`;
    await putBlob(blobKey, file);
    let dataUrl = '';
    try { dataUrl = await fileToDataUrl(file); } catch { /* IDB is enough */ }
    currentFavicon = dataUrl
      ? { kind: 'data', dataUrl, blobKey }
      : { kind: 'file', blobKey };
    await applyFavicon(currentFavicon);
    persistActiveDeck();
    toast('Favicon on this deck');
  }

  async function setFaviconFromUrl(raw) {
    const url = String(raw || '').trim();
    if (!url) { toast('Paste an image URL'); return; }
    if (!/^https?:\/\//i.test(url) && !url.startsWith('data:image/')) {
      toast('Use http(s) or a data:image URL');
      return;
    }
    await ensureNamedDeck();
    if (ARCHIVE_CONFIG.archiveId === 'DECK_BUILDER') return;
    currentFavicon = { kind: 'url', url };
    await applyFavicon(currentFavicon);
    persistActiveDeck();
    toast('Favicon URL set');
  }

  async function clearFavicon() {
    currentFavicon = { kind: 'default' };
    await applyFavicon(currentFavicon);
    persistActiveDeck();
    toast('Default tab icon');
  }

  async function downloadOneTrack(track, i) {
    if (!track) return;
    if (track.kind === 'file' && track.blobKey) {
      toast('Already on this device');
      return track;
    }
    const src = track.url || track.src;
    if (!src || src.startsWith('blob:')) {
      toast('Nothing to download');
      return track;
    }
    const res = await fetchTimed(src);
    if (!res.ok) throw new Error('download HTTP ' + res.status);
    const blob = await res.blob();
    const blobKey = `${ARCHIVE_CONFIG.archiveId}:dl:${i}:${Date.now()}`;
    await putBlob(blobKey, blob);
    const url = URL.createObjectURL(blob);
    objectUrls.push(url);
    track.url = url;
    track.kind = 'file';
    track.blobKey = blobKey;
    return track;
  }

  async function downloadTracks(scope) {
    if (!playlist.length) { toast('Load a tape first'); return; }
    await ensureNamedDeck();
    if (ARCHIVE_CONFIG.archiveId === 'DECK_BUILDER') return;
    toast(scope === 'all' ? 'Downloading tape…' : 'Downloading track…');
    try {
      if (scope === 'all') {
        for (let i = 0; i < playlist.length; i++) await downloadOneTrack(playlist[i], i);
      } else {
        await downloadOneTrack(playlist[Math.max(0, trackIndex)], Math.max(0, trackIndex));
      }
      persistActiveDeck();
      if (trackIndex >= 0) playTrack(trackIndex);
      toast(scope === 'all' ? 'Tape stored locally' : 'Track stored locally');
    } catch (err) {
      toast('Download failed — try a file drop or a CORS-open URL');
    }
  }

  async function sendDeckSupport() {
    const body = (document.getElementById('support-text')?.value || '').trim();
    const email = (document.getElementById('support-email')?.value || '').trim();
    if (!body) { toast('Write what broke'); return; }
    const payload = [
      `DECK: ${ARCHIVE_CONFIG.archiveTitle} [${ARCHIVE_CONFIG.archiveId}]`,
      `HREF: ${location.href}`,
      email ? `REPLY: ${email}` : 'REPLY: (none)',
      '',
      body,
    ].join('\n');
    try {
      const res = await fetch('https://rasvibir-api.chrf-podcast.workers.dev/api/archives/DECK_BUILDER.uXu.0006/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'anonymous', message: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'send failed');
      toast('Message sent to 0?0 inbox');
      document.getElementById('support-text').value = '';
    } catch (err) {
      toast('Could not reach 0?0 — try MESSAGE at the root console');
    }
  }

  function persistActiveDeck() {
    const id = ARCHIVE_CONFIG.archiveId;
    if (!id || id === 'DECK_BUILDER') return false;
    if (deckExistsConflict(currentUserName(), id)) {
      showDeckExistsError(true);
      return false;
    }
    showDeckExistsError(false);
    const rec = {
      id,
      userName: currentUserName(),
      title: canonicalTitle(currentUserName()),
      theme: sanitizeTheme(readTheme()),
      favicon: currentFavicon && currentFavicon.kind !== 'default' ? currentFavicon : { kind: 'default' },
      tracks: serializePlaylist(),
    };
    const lib = readLibrary();
    const idx = lib.findIndex((d) => d.id === id);
    if (idx >= 0) lib[idx] = rec;
    else lib.push(rec);
    if (!writeLibrary(lib)) return false;
    try { globalThis.localStorage.setItem(ACTIVE_KEY, id); } catch { /* ignore */ }
    refreshDeckSelect(id);
    return true;
  }

  function renderBuilderTracks() {
    const box = document.getElementById('builder-tracks');
    box.innerHTML = '';
    playlist.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'track-edit';
      const label = document.createElement('input');
      label.type = 'text';
      label.value = t.title || '';
      label.addEventListener('change', () => {
        t.title = label.value.trim() || `Track ${i + 1}`;
        renderSetlist();
        paintNowPlaying();
        persistActiveDeck();
      });
      const up = document.createElement('button');
      up.type = 'button'; up.className = 'ghost-btn tiny'; up.textContent = '↑';
      up.addEventListener('click', () => moveTrack(i, -1));
      const down = document.createElement('button');
      down.type = 'button'; down.className = 'ghost-btn tiny'; down.textContent = '↓';
      down.addEventListener('click', () => moveTrack(i, 1));
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'ghost-btn tiny'; del.textContent = '×';
      del.addEventListener('click', () => removeTrack(i));
      row.append(label, up, down, del);
      box.appendChild(row);
    });
  }

  function moveTrack(idx, dir) {
    const next = idx + dir;
    if (next < 0 || next >= playlist.length) return;
    const [row] = playlist.splice(idx, 1);
    playlist.splice(next, 0, row);
    if (trackIndex === idx) trackIndex = next;
    else if (trackIndex === next) trackIndex = idx;
    renderSetlist();
    renderBuilderTracks();
    paintNowPlaying();
    persistActiveDeck();
  }

  function removeTrack(idx) {
    const gone = playlist[idx];
    if (gone && gone.blobKey) deleteBlob(gone.blobKey).catch(() => {});
    if (gone && gone.url && gone.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(gone.url); } catch { /* ignore */ }
      objectUrls = objectUrls.filter((u) => u !== gone.url);
    }
    playlist.splice(idx, 1);
    if (trackIndex >= playlist.length) trackIndex = playlist.length - 1;
    renderSetlist();
    renderBuilderTracks();
    if (playlist.length && trackIndex >= 0) playTrack(trackIndex);
    else loadTracks([], 'BUILDER', 'Empty tape');
    persistActiveDeck();
  }

  async function ensureNamedDeck() {
    if (ARCHIVE_CONFIG.archiveId !== 'DECK_BUILDER') return true;
    if (!currentUserName()) {
      toast('Name the deck first');
      return false;
    }
    await saveNamedDeck(false);
    return ARCHIVE_CONFIG.archiveId !== 'DECK_BUILDER';
  }

  async function saveNamedDeck(announce = true) {
    const userName = currentUserName();
    if (!userName) { toast('Name the deck first'); return false; }
    if (deckExistsConflict(userName, currentDeckId())) {
      showDeckExistsError(true);
      toast('deck exists');
      return false;
    }
    showDeckExistsError(false);
    const id = slugFromName(userName);
    if (!id) {
      toast('Name needs a letter or number');
      return false;
    }
    const oldId = currentDeckId();
    if (oldId && oldId !== id) {
      const lib = readLibrary();
      const idx = lib.findIndex((d) => d.id === oldId);
      if (idx >= 0) {
        lib.splice(idx, 1);
        if (!writeLibrary(lib)) return false;
      }
    }
    ARCHIVE_CONFIG.archiveId = id;
    ARCHIVE_CONFIG.archiveTitle = canonicalTitle(userName);
    if (!persistActiveDeck()) return false;
    setBrandLabel(ARCHIVE_CONFIG.archiveTitle.toUpperCase());
    path.textContent = `STANDALONE · ${ARCHIVE_CONFIG.archiveTitle.toUpperCase()}`;
    document.title = `${ARCHIVE_CONFIG.archiveTitle} · CyberCat Deck`;
    catalogFoot.textContent = ARCHIVE_CONFIG.archiveTitle;
    if (announce) toast(`Saved ${ARCHIVE_CONFIG.archiveTitle}`);
    return true;
  }

  function commitTracks(tracks, label) {
    const next = playlist.concat(tracks.filter((t) => t && (t.url || t.src)));
    loadTracks(next, ARCHIVE_CONFIG.archiveId, label || ARCHIVE_CONFIG.archiveTitle);
    renderBuilderTracks();
    persistActiveDeck();
  }

  function parseM3u(text) {
    const lines = String(text).split(/\r?\n/);
    const tracks = [];
    let pending = '';
    lines.forEach((line) => {
      const s = line.trim();
      if (!s || s.startsWith('#EXTM3U')) return;
      if (s.startsWith('#EXTINF:')) {
        pending = s.replace(/^#EXTINF:[^,]*,/, '').trim();
        return;
      }
      if (s.startsWith('#')) return;
      tracks.push({ title: pending || s.split('/').pop(), url: s, kind: 'link' });
      pending = '';
    });
    return tracks;
  }

  function parsePls(text) {
    const tracks = [];
    const files = {};
    const titles = {};
    String(text).split(/\r?\n/).forEach((line) => {
      const m = line.match(/^(File|Title)(\d+)=(.+)$/i);
      if (!m) return;
      const n = m[2];
      if (/file/i.test(m[1])) files[n] = m[3].trim();
      else titles[n] = m[3].trim();
    });
    Object.keys(files).sort((a, b) => Number(a) - Number(b)).forEach((n) => {
      tracks.push({ title: titles[n] || files[n], url: files[n], kind: 'link' });
    });
    return tracks;
  }

  function tracksFromJson(data) {
    if (!data || typeof data !== 'object') return [];
    if (Array.isArray(data.tracks)) {
      return data.tracks.map((t) => ({
        title: t.title || t.name || 'Track',
        url: t.url || t.src || t.file || '',
        kind: 'link',
        duration: t.duration,
      })).filter((t) => t.url);
    }
    if (data.songs && typeof data.songs === 'object') {
      return Object.values(data.songs).map((t) => ({
        title: t.title || 'Track',
        url: t.url || t.src || '',
        kind: 'link',
        duration: t.duration,
      })).filter((t) => t.url);
    }
    if (Array.isArray(data.shows)) {
      return data.shows.flatMap((s) => (s.tracks || []).map((t) => ({
        title: t.title || t.name || 'Track',
        url: t.url || t.src || '',
        kind: 'link',
      }))).filter((t) => t.url);
    }
    if (Array.isArray(data)) {
      return data.map((t) => ({
        title: t.title || t.name || 'Track',
        url: t.url || t.src || t,
        kind: 'link',
      })).filter((t) => typeof t.url === 'string' && t.url);
    }
    return [];
  }

  function archiveItemId(url) {
    const m = String(url).match(/archive\.org\/(?:details|download)\/([^/?#]+)/i);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function relistenPath(url) {
    const u = String(url);
    let m = u.match(/relisten\.net\/(?:api\/v2\/)?artists\/([^/]+)\/(?:shows\/)?(\d{4})\/(\d{1,2})\/(\d{1,2})/i);
    if (m) return { artist: m[1], y: m[2], mo: m[3], d: m[4] };
    m = u.match(/relisten\.net\/([^/]+)\/(\d{4})\/(\d{1,2})\/(\d{1,2})/i);
    if (m) return { artist: m[1], y: m[2], mo: m[3], d: m[4] };
    return null;
  }

  async function fetchArchiveItem(id) {
    const res = await fetchTimed(`https://archive.org/metadata/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('archive.org ' + res.status);
    const meta = await res.json();
    const files = Array.isArray(meta.files) ? meta.files : [];
    const audio = files.filter((f) => /mp3|ogg|vbr/i.test(String(f.format || f.name || '')) && AUDIO_EXT.test(f.name || ''));
    const pick = audio.length ? audio : files.filter((f) => AUDIO_EXT.test(f.name || ''));
    return pick.map((f) => ({
      title: (f.title || f.name || 'Track').replace(/\.[^.]+$/, ''),
      url: `https://archive.org/download/${id}/${encodeURIComponent(f.name)}`,
      kind: 'link',
    }));
  }

  async function fetchRelisten(parts) {
    const pad = (n) => String(n).padStart(2, '0');
    const url = `https://api.relisten.net/api/v2/artists/${parts.artist}/years/${parts.y}/${pad(parts.mo)}/${pad(parts.d)}`;
    const res = await fetchTimed(url);
    if (!res.ok) throw new Error('relisten ' + res.status);
    const data = await res.json();
    const show = Array.isArray(data) ? data[0] : data;
    const sources = (show && show.sources) || (show && show.shows && show.shows[0] && show.shows[0].sources) || [];
    const src = sources[0];
    const sets = (src && src.sets) || [];
    const tracks = [];
    sets.forEach((set) => {
      (set.tracks || []).forEach((t) => {
        const mp3 = t.mp3_url || t.track_url || t.slug;
        if (!mp3) return;
        tracks.push({ title: t.title || t.slug || 'Track', url: mp3, kind: 'link', duration: t.duration });
      });
    });
    return tracks;
  }

  async function ingestText(raw) {
    const text = String(raw || '').trim();
    if (!text) { toast('Paste a link, playlist, or JSON'); return; }
    await ensureNamedDeck();
    if (ARCHIVE_CONFIG.archiveId === 'DECK_BUILDER') return;
    let tracks = [];
    if (text.startsWith('{') || text.startsWith('[')) {
      try { tracks = tracksFromJson(JSON.parse(text)); } catch { toast('JSON did not parse'); return; }
    } else if (/^\[playlist\]/i.test(text) || /^File\d+=/im.test(text)) {
      tracks = parsePls(text);
    } else if (/#EXTM3U|#EXTINF:/i.test(text)) {
      tracks = parseM3u(text);
    } else {
      const lines = text.split(/\s+/).filter(Boolean);
      for (const line of lines) {
        const item = archiveItemId(line);
        const rl = relistenPath(line);
        if (item && !AUDIO_EXT.test(line)) {
          toast('Loading Internet Archive item…');
          tracks = tracks.concat(await fetchArchiveItem(item));
        } else if (rl) {
          toast('Loading Relisten show…');
          tracks = tracks.concat(await fetchRelisten(rl));
        } else if (/^https?:\/\//i.test(line)) {
          try {
            if (/\.json(\?|$)/i.test(line)) {
              const data = await (await fetchTimed(line)).json();
              tracks = tracks.concat(tracksFromJson(data));
            } else if (/\.m3u8?(\?|$)/i.test(line) || /\.pls(\?|$)/i.test(line)) {
              const body = await (await fetchTimed(line)).text();
              tracks = tracks.concat(/\.pls/i.test(line) ? parsePls(body) : parseM3u(body));
            } else {
              tracks.push({ title: document.getElementById('link-title').value.trim() || line.split('/').pop(), url: line, kind: 'link' });
            }
          } catch (err) {
            toast('Could not fetch that source');
          }
        }
      }
    }
    if (!tracks.length) { toast('No playable tracks in that source'); return; }
    commitTracks(tracks, 'Plugged-in source');
    toast(`${tracks.length} tracks on the tape`);
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    await ensureNamedDeck();
    if (ARCHIVE_CONFIG.archiveId === 'DECK_BUILDER') return;
    const extra = [];
    for (const file of files) {
      const name = file.name || '';
      if (/\.(m3u8?|pls|txt)$/i.test(name)) {
        extra.push(...( /\.pls/i.test(name) ? parsePls(await file.text()) : parseM3u(await file.text()) ));
        continue;
      }
      if (/\.json$/i.test(name)) {
        try { extra.push(...tracksFromJson(JSON.parse(await file.text()))); } catch { toast(name + ' is not a track list'); }
        continue;
      }
      const blobKey = `${ARCHIVE_CONFIG.archiveId}:${Date.now()}:${name}`;
      await putBlob(blobKey, file);
      const url = URL.createObjectURL(file);
      objectUrls.push(url);
      extra.push({ title: name.replace(/\.[^.]+$/, ''), url, kind: 'file', blobKey });
    }
    if (!extra.length) return;
    commitTracks(extra, ARCHIVE_CONFIG.archiveTitle);
    toast(`${extra.length} item${extra.length === 1 ? '' : 's'} added`);
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  }

  async function hydrateTracks(saved) {
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    objectUrls = [];
    const out = [];
    for (const t of saved || []) {
      if (t.kind === 'file' && t.blobKey) {
        const blob = await getBlob(t.blobKey).catch(() => null);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        out.push({ title: t.title, url, kind: 'file', blobKey: t.blobKey, duration: t.duration });
      } else if (t.url) {
        out.push({ title: t.title, url: t.url, kind: 'link', duration: t.duration });
      }
    }
    return out;
  }

  async function activateDeck(rec) {
    if (!rec) return;
    if (rippleActive) stopRipple();
    player.pause();
    ARCHIVE_CONFIG.archiveId = rec.id;
    ARCHIVE_CONFIG.archiveTitle = rec.title;
    document.getElementById('deck-name').value = rec.userName || '';
    paintCanonical();
    writeThemeInputs(sanitizeTheme(rec.theme));
    applyTheme(sanitizeTheme(rec.theme));
    applyFavicon(rec.favicon);
    setBrandLabel(rec.title.toUpperCase());
    path.textContent = `STANDALONE · ${rec.title.toUpperCase()}`;
    document.title = `${rec.title} · CyberCat Deck`;
    catalogFoot.textContent = rec.title;
    const tracks = await hydrateTracks(rec.tracks);
    loadTracks(tracks, rec.id, rec.title, false);
    renderBuilderTracks();
    refreshDeckSelect(rec.id);
    renderCatalogInfo();
    renderSpecs();
    const savedVol = readStorage('volume');
    if (savedVol != null) {
      const v = Number(savedVol);
      if (Number.isFinite(v) && v >= 0 && v <= 1) {
        player.volume = v;
        volumeSlider.value = String(v);
        volLabel.textContent = `${Math.round(v * 100)}%`;
      }
    }
    try {
      const last = JSON.parse(readStorage('last-play') || 'null');
      if (last && Number.isInteger(last.idx) && last.idx >= 0 && last.idx < playlist.length) {
        playTrack(last.idx);
        pendingSeek = Number(last.t) || 0;
        player.pause();
      }
    } catch { /* ignore */ }
  }

  function mountPresets() {
    const box = document.getElementById('theme-presets');
    box.innerHTML = '';
    Object.keys(LOOKS).forEach((name) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset';
      btn.textContent = name;
      btn.addEventListener('click', () => {
        writeThemeInputs(LOOKS[name]);
        applyTheme(LOOKS[name]);
        persistActiveDeck();
        toast(`${name} look`);
      });
      box.appendChild(btn);
    });
  }

  function initBuilder() {
    paintCanonical();
    refreshDeckSelect(null);
    mountPresets();
    writeThemeInputs(DEFAULT_LOOK);
    applyTheme(DEFAULT_LOOK);
    applyFavicon(currentFavicon);
    document.getElementById('btn-favicon-file').addEventListener('click', () => {
      document.getElementById('favicon-file').click();
    });
    document.getElementById('favicon-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) setFaviconFromFile(file);
    });
    document.getElementById('btn-favicon-url').addEventListener('click', () => {
      setFaviconFromUrl(document.getElementById('favicon-url').value);
    });
    document.getElementById('btn-favicon-clear').addEventListener('click', () => clearFavicon());
    document.getElementById('btn-send-support')?.addEventListener('click', sendDeckSupport);
    document.getElementById('btn-download-track')?.addEventListener('click', () => downloadTracks('one'));
    document.getElementById('btn-download-tape')?.addEventListener('click', () => downloadTracks('all'));
    document.getElementById('deck-name').addEventListener('input', () => {
      paintCanonical();
      setBrandLabel(canonicalTitle(currentUserName()).toUpperCase());
      document.title = `${canonicalTitle(currentUserName())} · CyberCat Deck`;
      const name = currentUserName();
      showDeckExistsError(!!name && deckExistsConflict(name, currentDeckId()));
    });
    ['theme-chassis', 'theme-hi', 'theme-void', 'theme-phosphor', 'theme-display',
      'theme-accent', 'theme-amber', 'theme-text', 'theme-room', 'theme-glow',
      'theme-scan', 'theme-radius', 'theme-ripple', 'face-font'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => {
        applyTheme();
        persistActiveDeck();
      });
    });
    const drop = document.getElementById('file-drop');
    const fileInput = document.getElementById('file-input');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag');
      addFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => addFiles(fileInput.files));
    document.getElementById('btn-ingest').addEventListener('click', () => {
      ingestText(document.getElementById('source-paste').value).catch((err) => toast(String(err.message || err)));
    });
    document.getElementById('btn-add-link').addEventListener('click', async () => {
      const url = document.getElementById('link-url').value.trim();
      if (!url) { toast('Paste a stream URL'); return; }
      await ingestText(url);
      document.getElementById('link-url').value = '';
    });
    document.getElementById('btn-save-deck').addEventListener('click', () => saveNamedDeck(true));
    document.getElementById('btn-new-deck').addEventListener('click', () => {
      if (rippleActive) stopRipple();
      player.pause();
      player.removeAttribute('src');
      revokeAllObjectUrls();
      ARCHIVE_CONFIG.archiveId = 'DECK_BUILDER';
      ARCHIVE_CONFIG.archiveTitle = 'CyberCat Deck Builder';
      document.getElementById('deck-name').value = '';
      paintCanonical();
      showDeckExistsError(false);
      playlist = [];
      loadTracks([], 'BUILDER', 'Empty tape');
      renderBuilderTracks();
      setBrandLabel('CYBERCAT DECK BUILDER');
      path.textContent = 'STANDALONE · YOUR TAPE';
      document.title = 'CyberCat Deck Builder';
      refreshDeckSelect('');
      writeThemeInputs(DEFAULT_LOOK);
      applyTheme(DEFAULT_LOOK);
      clearFavicon();
    });
    document.getElementById('saved-decks').addEventListener('change', (e) => {
      const rec = readLibrary().find((d) => d.id === e.target.value);
      if (rec) activateDeck(rec);
    });
    let activeId = null;
    try { activeId = globalThis.localStorage.getItem(ACTIVE_KEY); } catch { /* ignore */ }
    const rec = readLibrary().find((d) => d.id === activeId);
    if (rec) activateDeck(rec);
  }

  initBuilder();
})();
