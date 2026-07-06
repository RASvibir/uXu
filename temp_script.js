<script>
    const player = document.getElementById('main-player');
    let audioCtx = null, filters = [], initialized = false;

    async function initAudioEngine() {
        if (initialized) {
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            return;
        }
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        player.crossOrigin = "anonymous";
        const source = audioCtx.createMediaElementSource(player);
        
        const freqs = [60, 230, 910, 4000, 14000];
        filters = freqs.map((freq, idx) => {
            let filter = audioCtx.createBiquadFilter();
            filter.type = (idx === 0) ? 'lowshelf' : (idx === freqs.length - 1) ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.gain.value = 0;
            return filter;
        });

        source.connect(filters[0]);
        for(let i=0; i<filters.length - 1; i++) {
            filters[i].connect(filters[i+1]);
        }
        filters[filters.length - 1].connect(audioCtx.destination);
        
        initialized = true;
    }

    function bindSlider(id, node, labelId) {
        const slider = document.getElementById(id);
        const label = document.getElementById(labelId);
        slider.addEventListener('input', (e) => {
            node.gain.setValueAtTime(e.target.value, audioCtx.currentTime);
            label.textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}dB`;
        });
    }

    // Initialize EQ binding after engine starts
    player.addEventListener('play', async () => {
        await initAudioEngine();
        bindSlider('eq-60', filters[0], 'v-60');
        bindSlider('eq-230', filters[1], 'v-230');
        bindSlider('eq-910', filters[2], 'v-910');
        bindSlider('eq-4k', filters[3], 'v-4k');
        bindSlider('eq-14k', filters[4], 'v-14k');
    });

    function queueTapeTrack(url, setlistString) {
        initAudioEngine();
        player.src = url;
        player.play().catch(e => console.error("Playback blocked:", e));
        
        const monitor = document.getElementById('live-setlist-output');
        monitor.innerHTML = '';
        setlistString.split(',').forEach((song, idx) => {
            const div = document.createElement('div');
            div.textContent = `${(idx + 1).toString().padStart(2, '0')} - ${song.trim().toUpperCase()}`;
            monitor.appendChild(div);
        });
    }

    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            document.getElementById('manifesto-text-block').textContent = `--- ARCHIVE COLLECTION MANIFESTO ---\n\n${data.description.toUpperCase()}`;
            const list = document.getElementById('tapes-injection-zone');
            list.innerHTML = '';
            data.shows.forEach(show => {
                const card = document.createElement('div');
                card.className = 'tape-card';
                let streamUrl = show.audioSources ? `https://archive.org/download/${show.audioSources[0].archiveOrgId}` : '#';
                let setlistEscaped = show.setlist.join(',').replace(/'/g, "\\'");
                card.innerHTML = `<h4>${show.date} // ${show.venue.toUpperCase()}</h4>
                                  <p>${show.city.toUpperCase()}</p>
                                  <button class="action-btn" onclick="queueTapeTrack('${streamUrl}', '${setlistEscaped}')">⚡ ENGAGE TAPE CONSOLE</button>`;
                list.appendChild(card);
            });
        }).catch(() => {
            document.getElementById('tapes-injection-zone').textContent = "[ERROR: Load via localhost:8080]";
        });
</script>
