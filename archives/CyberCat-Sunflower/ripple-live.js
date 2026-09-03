/**
 * CyberCat Ripple live engine — UTC herd-sync for offline player (and embeds).
 * Requires network; streams via commons relay when direct URLs are blocked.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CyberCatRippleLive = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const RELISTEN = 'https://api.relisten.net/api/v2/artists/grateful-dead';
  const API_BASE = 'https://rasvibir-api.chrf-podcast.workers.dev';
  const RIPPLE_EPOCH = Date.parse('2026-01-01T00:00:00Z');
  const RIPPLE_WINDOW_MS = 13 * 24 * 60 * 60 * 1000;
  const RIPPLE_DEFAULT_SHOW_MS = 2.5 * 60 * 60 * 1000;
  const RIPPLE_DEFAULT_TRACK_SEC = 420;

  function showDate(s) {
    const raw = String((s && (s.display_date || s.date)) || '');
    const m = raw.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : raw.slice(0, 10);
  }

  function venueName(s) {
    return (s && s.venue && s.venue.name) || s.venueName || 'Unknown Venue';
  }

  function venuePlace(s) {
    return (s && s.venue && s.venue.location) || s.location || '';
  }

  function sourceTracks(source) {
    const tracks = [];
    for (const set of (source.sets || [])) {
      for (const t of (set.tracks || [])) {
        if (!t.mp3_url) continue;
        tracks.push({
          title: t.title || 'Track',
          url: t.mp3_url,
          duration: t.duration,
        });
      }
    }
    return tracks;
  }

  function scoreSource(source) {
    const tracks = sourceTracks(source);
    if (!tracks.length) return -1;
    let score = 0;
    if (source.is_soundboard) score += 100000;
    if (source.is_remaster) score += 5000;
    score += Math.round((Number(source.avg_rating) || 0) * 1000);
    score += Math.min(Number(source.num_reviews) || 0, 500) * 10;
    score += Math.min(tracks.length, 80);
    if (source.upstream_identifier) score += 25;
    return score;
  }

  function rankSources(sources) {
    return (sources || [])
      .map((s) => ({ source: s, score: scoreSource(s), tracks: sourceTracks(s) }))
      .filter((x) => x.score >= 0 && x.tracks.length)
      .sort((a, b) => b.score - a.score || (b.source.avg_rating || 0) - (a.source.avg_rating || 0));
  }

  function rippleShowScore(show) {
    const rating = Number(show.avg_rating) || 0;
    const sources = Number(show.source_count) || 0;
    const sbd = show.has_soundboard_source ? 1.45 : 1;
    return rating * (1 + Math.log1p(sources) * 0.18) * sbd;
  }

  function rippleWindowAt(now = Date.now()) {
    return Math.floor((now - RIPPLE_EPOCH) / RIPPLE_WINDOW_MS);
  }

  function rippleSeedIndex(seed, len) {
    if (!len) return 0;
    let h = (seed >>> 0) ^ 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
    h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
    h ^= h >>> 16;
    return (h >>> 0) % len;
  }

  function buildRippleSchedule(catalog, windowId) {
    const byYear = new Map();
    for (const show of catalog) {
      const year = String(show.year || showDate(show).slice(0, 4));
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(show);
    }
    const schedule = [];
    const years = [...byYear.keys()].sort();
    const used = new Set();
    for (const year of years) {
      const ranked = byYear.get(year).slice().sort((a, b) => rippleShowScore(b) - rippleShowScore(a));
      const top = ranked.slice(0, Math.min(8, ranked.length));
      let pick = null;
      for (let attempt = 0; attempt < top.length + 3; attempt++) {
        const idx = rippleSeedIndex(windowId * 9973 + Number(year) * 131 + attempt, top.length);
        const candidate = top[idx];
        const d = showDate(candidate);
        if (!used.has(d)) {
          pick = candidate;
          used.add(d);
          break;
        }
      }
      if (pick) schedule.push({ year, show: pick, estMs: RIPPLE_DEFAULT_SHOW_MS });
    }
    return schedule;
  }

  function rippleScheduleTotalMs(sched) {
    return sched.reduce((sum, slot) => sum + (slot.actualMs || slot.estMs || RIPPLE_DEFAULT_SHOW_MS), 0) || RIPPLE_DEFAULT_SHOW_MS;
  }

  function ripplePlaylistTotalMs(playlist) {
    return playlist.reduce((sum, tr) => sum + Math.max(1, Number(tr.duration) || RIPPLE_DEFAULT_TRACK_SEC) * 1000, 0);
  }

  function rippleTrackFromOffset(playlist, offsetMs) {
    let t = offsetMs;
    for (let i = 0; i < playlist.length; i++) {
      const dur = Math.max(1, (Number(playlist[i].duration) || RIPPLE_DEFAULT_TRACK_SEC)) * 1000;
      if (t < dur) return { trackIndex: i, seekSec: t / 1000 };
      t -= dur;
    }
    return { trackIndex: Math.max(0, playlist.length - 1), seekSec: 0 };
  }

  function create(options) {
    const {
      player,
      toast = () => {},
      streamUrlCandidates,
      onLockChange = () => {},
      onNowPlaying = () => {},
      onPlaylist = () => {},
      onCatalogProgress = () => {},
    } = options;

    if (!player) throw new Error('player element required');

    const getStreamUrls = streamUrlCandidates || ((raw) => {
      if (!raw) return [];
      const urls = [raw];
      if (!String(raw).includes('/api/stream')) {
        urls.push(`${API_BASE}/api/stream?url=${encodeURIComponent(raw)}`);
      }
      return urls;
    });

    let shows = [];
    let catalogReady = false;
    let catalogLoading = false;
    let rippleActive = false;
    let rippleStarting = false;
    let rippleBoundaryTimer = null;
    let rippleSchedule = [];
    let rippleWindowId = -1;
    const rippleShowCache = new Map();

    let playlist = [];
    let trackIndex = -1;
    let activeShow = null;
    let currentLoadController = null;

    async function api(path, { timeoutMs = 12000 } = {}) {
      const p = path.startsWith('/') ? path : `/${path}`;
      const urls = [
        `${API_BASE}/api/relisten?path=${encodeURIComponent(p)}`,
        `${RELISTEN}${p}`,
      ];
      let lastErr = null;
      for (const url of urls) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) return res.json();
          lastErr = new Error(`Catalog ${res.status}`);
        } catch (err) {
          lastErr = (err && err.name === 'AbortError') ? new Error(`Catalog timeout for ${path}`) : err;
        } finally {
          clearTimeout(timer);
        }
      }
      throw lastErr || new Error('Catalog unreachable');
    }

    async function bootstrapCatalog() {
      if (catalogReady || catalogLoading) return catalogReady;
      catalogLoading = true;
      try {
        const years = await api('/years');
        years.sort((a, b) => Number(a.year) - Number(b.year));
        const all = [];
        const queue = years.slice();
        let completed = 0;
        let failed = 0;
        const concurrency = 4;

        const update = () => onCatalogProgress({ completed, total: years.length, shows: all.length, failed });

        async function worker() {
          while (queue.length) {
            const y = queue.shift();
            if (!y) break;
            try {
              const detail = await api(`/years/${y.year}`, { timeoutMs: 12000 });
              for (const s of (detail.shows || [])) {
                all.push({
                  ...s,
                  year: y.year,
                  venueName: venueName(s),
                  location: venuePlace(s),
                });
              }
            } catch {
              failed++;
            }
            completed++;
            update();
          }
        }
        await Promise.all(Array.from({ length: concurrency }, worker));
        shows = all;
        catalogReady = shows.length > 0;
        update();
        return catalogReady;
      } finally {
        catalogLoading = false;
      }
    }

    async function rippleLoadShow(show) {
      const d = showDate(show);
      if (rippleShowCache.has(d)) return rippleShowCache.get(d);
      const detail = await api(`/shows/${d}`);
      const ranked = rankSources(detail.sources || []);
      if (!ranked.length) throw new Error('no stream');
      const best = ranked[0];
      const pack = {
        playlist: best.tracks,
        totalMs: ripplePlaylistTotalMs(best.tracks),
        ranked,
        detail,
        best,
      };
      rippleShowCache.set(d, pack);
      return pack;
    }

    async function hydrateRippleSchedule(windowId) {
      if (windowId !== rippleWindowId || !rippleSchedule.length) {
        rippleWindowId = windowId;
        rippleSchedule = buildRippleSchedule(shows, windowId);
      }
      const pending = rippleSchedule.filter((slot) => !slot.actualMs);
      if (!pending.length) return rippleSchedule;
      await Promise.all(pending.map(async (slot) => {
        try {
          const pack = await rippleLoadShow(slot.show);
          slot.actualMs = pack.totalMs;
        } catch {
          slot.actualMs = slot.estMs || RIPPLE_DEFAULT_SHOW_MS;
        }
      }));
      return rippleSchedule;
    }

    function ripplePosition(now = Date.now()) {
      const windowId = rippleWindowAt(now);
      if (windowId !== rippleWindowId || !rippleSchedule.length) {
        rippleWindowId = windowId;
        rippleSchedule = buildRippleSchedule(shows, windowId);
      }
      const windowStart = RIPPLE_EPOCH + windowId * RIPPLE_WINDOW_MS;
      const elapsed = now - windowStart;
      const total = rippleScheduleTotalMs(rippleSchedule);
      let acc = 0;
      for (let i = 0; i < rippleSchedule.length; i++) {
        const slot = rippleSchedule[i];
        const dur = slot.actualMs || slot.estMs || RIPPLE_DEFAULT_SHOW_MS;
        if (elapsed < acc + dur) {
          return { windowId, slotIndex: i, slot, offsetMs: elapsed - acc, elapsedInWindow: elapsed };
        }
        acc += dur;
      }
      const last = rippleSchedule[rippleSchedule.length - 1];
      return {
        windowId,
        slotIndex: rippleSchedule.length - 1,
        slot: last,
        offsetMs: 0,
        elapsedInWindow: elapsed,
      };
    }

    function clearRippleBoundaryTimer() {
      if (rippleBoundaryTimer !== null) {
        clearTimeout(rippleBoundaryTimer);
        rippleBoundaryTimer = null;
      }
    }

    function scheduleRippleBoundaryFromPosition(pos, actualSlotMs) {
      clearRippleBoundaryTimer();
      if (!rippleActive || !pos?.slot) return;
      const slotDurationMs = actualSlotMs || pos.slot.actualMs || pos.slot.estMs || RIPPLE_DEFAULT_SHOW_MS;
      const remainingMs = Math.max(1000, slotDurationMs - pos.offsetMs);
      rippleBoundaryTimer = setTimeout(() => {
        rippleBoundaryTimer = null;
        if (rippleActive) rippleSync(true, 'scheduled-slot-boundary');
      }, remainingMs);
    }

    function playRippleTrack(idx, seekSec = 0) {
      if (!rippleActive || idx < 0 || idx >= playlist.length) return;
      if (currentLoadController) currentLoadController.abort();
      currentLoadController = new AbortController();
      const { signal } = currentLoadController;

      trackIndex = idx;
      const track = playlist[idx];
      const urls = getStreamUrls(track.url);
      let urlAttempt = 0;

      const startPlayback = () => {
        if (signal.aborted || !rippleActive) return;
        if (seekSec > 0.5) {
          try { player.currentTime = seekSec; } catch (_) {}
        }
        player.play().catch(() => toast('Press play to join Ripple'));
        onNowPlaying({
          ripple: true,
          show: activeShow,
          track,
          trackIndex: idx,
          total: playlist.length,
        });
        onPlaylist(playlist, idx);
      };

      const loadAttempt = () => {
        player.src = urls[urlAttempt];
        player.load();
        const onErr = () => {
          urlAttempt += 1;
          if (urlAttempt < urls.length) loadAttempt();
          else {
            toast('Stream blocked — retrying herd sync…');
            setTimeout(() => rippleSync(true, 'stream-error'), 400);
          }
        };
        player.addEventListener('error', onErr, { once: true });
        if (player.readyState >= 2) startPlayback();
        else player.addEventListener('canplay', startPlayback, { once: true, signal });
      };
      loadAttempt();
    }

    function rippleApplyPack(show, pack, trackIdx, seekSec) {
      if (!rippleActive) return false;
      activeShow = Object.assign({}, show, pack.detail);
      playlist = pack.playlist;
      playRippleTrack(trackIdx, seekSec);
      return true;
    }

    async function rippleSync(force = false, reason = null) {
      if (!rippleActive || !shows.length) return false;
      const windowId = rippleWindowAt(Date.now());
      try {
        await hydrateRippleSchedule(windowId);
        if (!rippleActive) return false;
        const pos = ripplePosition(Date.now());
        const slot = pos?.slot;
        if (!slot) throw new Error('No herd slot');
        const d = showDate(slot.show);
        const pack = await rippleLoadShow(slot.show);
        if (!rippleActive) return false;
        slot.actualMs = pack.totalMs;
        const target = rippleTrackFromOffset(pack.playlist, pos.offsetMs);
        const sameShow = activeShow && showDate(activeShow) === d;
        const sameTrack = sameShow && trackIndex === target.trackIndex;
        const drift = sameTrack ? Math.abs((player.currentTime || 0) - target.seekSec) : Infinity;
        if (force || !sameShow || drift > 18) {
          rippleApplyPack(slot.show, pack, target.trackIndex, target.seekSec);
        }
        scheduleRippleBoundaryFromPosition(pos, pack.totalMs);
        if (force && reason === 'enter-ripple') {
          toast(`Herd lock · ${d} · track ${String(target.trackIndex + 1).padStart(2, '0')}`);
        }
        pingHerd(showDate(slot.show));
        return true;
      } catch (err) {
        console.warn('ripple sync', err);
        clearRippleBoundaryTimer();
        return false;
      }
    }

    async function pingHerd(dateStr) {
      if (!dateStr) return;
      try {
        await fetch(`${API_BASE}/api/herd/ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr, active: rippleActive }),
        });
      } catch (_) { /* offline */ }
    }

    async function startRipple() {
      if (!catalogReady) {
        toast('Indexing catalog for Ripple…');
        const ok = await bootstrapCatalog();
        if (!ok) {
          toast('Catalog unavailable — Ripple needs network');
          return;
        }
      }
      if (rippleActive || rippleStarting) return;
      rippleStarting = true;
      rippleActive = true;
      onLockChange(true);
      try {
        const joined = await rippleSync(true, 'enter-ripple');
        if (!joined || !rippleActive) {
          rippleActive = false;
          clearRippleBoundaryTimer();
          onLockChange(false);
          toast('Could not join Ripple — check connection');
        } else {
          toast('Ripple live — UTC herd sync');
        }
      } finally {
        rippleStarting = false;
      }
    }

    function stopRipple() {
      if (!rippleActive && !rippleStarting) return;
      rippleActive = false;
      rippleStarting = false;
      clearRippleBoundaryTimer();
      if (currentLoadController) currentLoadController.abort();
      onLockChange(false);
    }

    function toggleRipple() {
      if (rippleStarting) return;
      if (rippleActive) {
        stopRipple();
        toast('Ripple off — locker deck');
        return;
      }
      startRipple();
    }

    function onEnded() {
      if (!rippleActive) return;
      if (trackIndex >= 0 && trackIndex < playlist.length - 1) {
        playRippleTrack(trackIndex + 1, 0);
      } else {
        rippleSync(true, 'set-end');
      }
    }

    function onError() {
      if (!rippleActive) return;
      setTimeout(() => rippleSync(true, 'stream-error'), 350);
    }

    function onVisibility() {
      if (!document.hidden && rippleActive) rippleSync(false, 'visibility');
    }

    player.addEventListener('ended', onEnded);
    player.addEventListener('error', onError);
    document.addEventListener('visibilitychange', onVisibility);

    bootstrapCatalog().catch(() => {});

    return {
      bootstrapCatalog,
      toggleRipple,
      stopRipple,
      playTrackAt(idx) {
        if (!rippleActive || idx < 0 || idx >= playlist.length) return;
        playRippleTrack(idx, 0);
      },
      isActive: () => rippleActive,
      isCatalogReady: () => catalogReady,
      isCatalogLoading: () => catalogLoading,
      destroy() {
        stopRipple();
        player.removeEventListener('ended', onEnded);
        player.removeEventListener('error', onError);
        document.removeEventListener('visibilitychange', onVisibility);
      },
    };
  }

  return { create, API_BASE, RELISTEN };
});
