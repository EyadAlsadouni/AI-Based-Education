## Voice Coach Stabilization Plan

### 1) Persistence/Caches Audit [DONE]
- Locate SQLite DB and inspect tables (`users`, `voice_sessions`, `tts_cache`, etc.)
- Report row counts; flag large tables
- Identify server/FS caches (audio-cache/tmp) and frontend caches (localStorage)
- Provide safe cleanup commands (dev only)

Outcome:
- DB located at `backend/database.sqlite`. Counts: users=3, voice_sessions=7, tts_cache=3, dashboard_content=0, mini_kb=88, conditions=4
- No FS caches; localStorage keys identified
- Cleanup scripts prepared and executed for `tts_cache` and `voice_sessions` (now 0)

### 2) Card Playback Reliability
Goal: No delay, no overlap, consistent English voice, reliable pause/resume, avatar sync ≤120ms.

Tasks:
- 2.1 Implement AudioManager singleton with one shared `HTMLAudioElement` [DONE]
  - API: `play(url)`, `pause()`, `resume()`, `stop()`, `on('start'|'pause'|'end'|'error')`
  - Ensures only one audio plays at a time
- 2.2 Add PlaybackQueue semantics (serialize plays) via AudioManager [DONE]
  - Stop current before starting next; no overlapping audio
- 2.3 Avatar synchronization [DONE]
  - Start avatar after `audio.play()` resolves; stop on `pause/end` within 120ms
- 2.4 Restore reliable pause/resume toggle [IN PROGRESS]
  - Clicking the same card toggles pause/resume repeatedly
  - Keep selection stable; UI shows "Playing..." / "Paused" accordingly
  - Do not clear selection on pause or when rapidly switching cards
- 2.5 Voice & language pinning [PENDING]
  - Force English-only instructions and fixed voice across cache & TTS
  - Ensure cache key includes `voice_id` (and language if applicable)

Validation:
- Click any card → audio starts ≤300ms; avatar starts in sync
- Clicking the same card → toggles pause/resume reliably with correct labels
- Starting a second card stops the first immediately; no double audio
- Voice remains consistent; no language drift

### 3) Live Q&A Realtime (WebRTC/WS proxy) [PENDING]
- Confirm ephemeral/proxy token flow, session config pinning (voice/lang), and audio pipeline

### 4) Noise/Buzz Mitigation [PENDING]
- Ensure only one audio graph, stop unused streams, throttle animations with rAF, pause on hidden tab


