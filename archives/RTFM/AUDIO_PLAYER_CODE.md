# 🎛️ Interactive Audio Player with Web Audio API

A complete, reusable HTML/CSS/JavaScript audio player with 5-band equalizer and track controls.

**Tags:** audio, player, web-audio-api, interactive, equalizer, controls, beginner-friendly

**Source:** CyberCat Sunflower archive

---

## What This Does

- HTML5 `<audio>` element with browser controls
- Web Audio API integration for real-time EQ filtering
- 5-band equalizer (60Hz, 230Hz, 910Hz, 4kHz, 14kHz)
- Real-time gain adjustment (-12dB to +12dB)
- Dynamic setlist display
- Minimal dependencies—vanilla JS, no frameworks

## Demo Structure

```
Your Archive
├── index.html          (HTML + CSS + JS)
├── data.json          (show metadata, audio URLs)
└── [optional] styles.css, player.js (if separating concerns)
```

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Audio Archive</title>
    <style>
        /* CSS here */
    </style>
</head>
<body>

    <div class="player-container">
        <!-- Audio element -->
        <audio id="main-player" controls crossorigin="anonymous"></audio>
        
        <!-- Equalizer controls -->
        <div class="eq-container">
            <h3>5-Band Equalizer</h3>
            <div class="eq-grid">
                <div class="eq-band">
                    <label>60Hz</label>
                    <input type="range" id="eq-60" min="-12" max="12" value="0">
                    <span id="val-60">0dB</span>
                </div>
                <!-- Repeat for 230Hz, 910Hz, 4kHz, 14kHz -->
            </div>
        </div>

        <!-- Setlist display -->
        <div class="setlist-container">
            <h3>Now Playing</h3>
            <div id="setlist-display"></div>
        </div>
    </div>

    <script>
        // JavaScript here
    </script>
</body>
</html>
```

---

## JavaScript: Setting Up the Audio Context

```javascript
const player = document.getElementById('main-player');
let audioCtx = null;
let filters = [];
let initialized = false;

// Initialize Web Audio API on first play
function initAudioEngine() {
    if (initialized) return;
    
    // Create audio context
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create media source from audio element
    const source = audioCtx.createMediaElementSource(player);
    
    // Define EQ frequencies
    const freqs = [60, 230, 910, 4000, 14000];
    
    // Create biquad filters for each frequency band
    filters = freqs.map((freq, idx) => {
        const filter = audioCtx.createBiquadFilter();
        
        // Set filter type
        if (idx === 0) filter.type = 'lowshelf';           // 60Hz - bass boost
        else if (idx === freqs.length - 1) filter.type = 'highshelf'; // 14kHz - treble boost
        else filter.type = 'peaking';                      // Mid frequencies
        
        // Set frequency
        filter.frequency.value = freq;
        
        // Start at neutral (0 gain)
        filter.gain.value = 0;
        
        return filter;
    });
    
    // Connect the audio chain: source → filter1 → filter2 → ... → destination
    source.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
    }
    filters[filters.length - 1].connect(audioCtx.destination);
    
    // Bind sliders to filters
    bindSlider('eq-60', filters[0], 'val-60');
    bindSlider('eq-230', filters[1], 'val-230');
    bindSlider('eq-910', filters[2], 'val-910');
    bindSlider('eq-4k', filters[3], 'val-4k');
    bindSlider('eq-14k', filters[4], 'val-14k');
    
    initialized = true;
}

// Listen for play event to initialize
player.addEventListener('play', initAudioEngine);
```

---

## JavaScript: Binding Sliders to Filters

```javascript
function bindSlider(sliderId, filterNode, valueDisplayId) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valueDisplayId);
    
    slider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        
        // Update filter gain in real-time
        filterNode.gain.setValueAtTime(value, audioCtx.currentTime);
        
        // Update display
        display.textContent = `${value > 0 ? '+' : ''}${value}dB`;
    });
}
```

---

## JavaScript: Loading Tracks and Displaying Setlist

```javascript
// Store track data globally
let currentShow = null;

function loadTrack(showIndex) {
    if (!currentShow || !currentShow.shows[showIndex]) return;
    
    const show = currentShow.shows[showIndex];
    
    // Get audio URL (first available source)
    const audioUrl = show.audioSources && show.audioSources[0] && show.audioSources[0].url;
    if (!audioUrl) {
        alert('No audio available for this show');
        return;
    }
    
    // Set player source and play
    player.src = audioUrl;
    player.play().catch(err => console.error('Playback error:', err));
    
    // Display setlist
    const setlistDiv = document.getElementById('setlist-display');
    setlistDiv.innerHTML = '';
    
    show.setlist.forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = 'setlist-item';
        item.textContent = `${(idx + 1).toString().padStart(2, '0')} - ${song.toUpperCase()}`;
        setlistDiv.appendChild(item);
    });
}

// Fetch and load data
fetch('data.json')
    .then(res => res.json())
    .then(data => {
        currentShow = data;
        
        // Generate UI buttons for each show
        const showList = document.getElementById('show-list');
        data.shows.forEach((show, idx) => {
            const button = document.createElement('button');
            button.textContent = `${show.date} - ${show.venue}`;
            button.onclick = () => loadTrack(idx);
            showList.appendChild(button);
        });
    })
    .catch(err => console.error('Error loading data:', err));
```

---

## CSS: Basic Styling

```css
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
}

.player-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

audio {
    width: 100%;
    margin-bottom: 20px;
}

.eq-container h3 {
    margin-top: 0;
}

.eq-grid {
    display: flex;
    gap: 10px;
    justify-content: space-around;
    margin: 20px 0;
}

.eq-band {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.eq-band label {
    font-size: 12px;
    font-weight: bold;
}

.eq-band input[type="range"] {
    writing-mode: vertical-lr;
    direction: rtl;
    width: 20px;
    height: 100px;
}

.eq-band span {
    font-size: 11px;
    color: #666;
    min-width: 40px;
    text-align: center;
}

.setlist-container {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.setlist-item {
    padding: 8px;
    border-bottom: 1px dotted #ddd;
    font-size: 14px;
}
```

---

## Important Considerations

### CORS

If streaming from a different domain, ensure the audio URL allows CORS:

```html
<audio crossorigin="anonymous"></audio>
```

### Browser Compatibility

Web Audio API is well-supported:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with webkit prefix)

Test `audioContext` creation with fallback:

```javascript
audioCtx = new (window.AudioContext || window.webkitAudioContext)();
```

### Performance

- Initialize Web Audio API on first play (not on page load) to save resources
- Don't create filters until needed
- Use `setValueAtTime()` for smooth gain transitions

---

## Customization Ideas

- **More EQ bands**: Add 250Hz, 2kHz, 8kHz, etc.
- **Presets**: Save/load EQ settings (bass boost, vocals, etc.)
- **Visualization**: Add canvas-based waveform or spectrum analyzer
- **Playback speed**: Add `player.playbackRate` control
- **Loop/shuffle**: Add playback mode buttons
- **Mini player**: Make it stick to bottom on scroll
- **Dark mode**: Toggle stylesheet

---

## Common Issues & Solutions

**"EQ doesn't work"**
→ Make sure audio is playing when you adjust sliders. Web Audio requires user interaction.

**"Audio plays but sounds weird"**
→ Check filter Q values (resonance). Adjust if too sharp.

**"Can't hear any difference with EQ"**
→ Try extreme values (+12 or -12) to verify it's working.

**"Audio stops after a few seconds"**
→ Check CORS headers and network requests in browser console.

---

## Next Steps

- Style to match your archive's aesthetic
- Add more sophisticated UI (tabs, collapsible sections, etc.)
- Integrate with your data structure
- Test in multiple browsers
- Consider accessibility (keyboard controls, aria labels)

**This code is a foundation. Make it yours.** 🎛️
