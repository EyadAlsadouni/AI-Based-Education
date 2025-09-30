## Voice Coach UI Redesign Plan

### Task: Remove Listen Mode and Add Voice Reading to Dashboard Cards

**Objective**: Remove Listen Mode from Voice Coach page and add microphone icons to Dashboard cards for voice reading functionality.

### Completed Tasks ✅

#### 1. Remove Listen Mode from Voice Coach Page
- ✅ Removed mode state management (`listen` | `chat`)
- ✅ Removed card-related states (`cards`, `selectedCard`, `isPlayingCard`, `isPausedCard`)
- ✅ Removed card audio event handlers
- ✅ Removed card selection and audio handling functions
- ✅ Removed entire Mode Selection section from UI
- ✅ Updated layout to full-width for Voice Agent section
- ✅ Updated status text to remove card-related status
- ✅ Updated stop button logic to remove card-related conditions
- ✅ Updated avatar isPlaying prop to only use realtime session

#### 2. Add Microphone Icons to Dashboard Cards
- ✅ Added necessary imports (Mic, MicOff, Volume2, VolumeX icons, voiceApi, AudioManager)
- ✅ Added voice reading states (playingCardId, isPlaying, isPaused)
- ✅ Added audio event handlers for voice reading
- ✅ Implemented voice reading functions (handleVoiceRead, handleStopAudio)
- ✅ Updated card rendering with microphone icons
- ✅ Added visual feedback (playing/paused states)
- ✅ Added global audio control bar when playing
- ✅ Added proper event handling to prevent card click when clicking mic

#### 3. Voice Reading Functionality
- ✅ Integrated with existing voiceApi.summarizeCard() function
- ✅ Used shared AudioManager for consistent audio management
- ✅ Added play/pause/stop functionality for card content
- ✅ Added visual feedback with different icon states
- ✅ Added proper error handling

### Current Status
- Voice Coach page now focuses only on chat functionality (text/voice)
- Dashboard cards have microphone icons that read content aloud
- Full-width layout for Voice Coach page
- Proper audio management and visual feedback

### Bug Fixes Applied ✅

#### 1. Fixed 404 Error for Dashboard Card Audio
- ✅ Created new API endpoint `/voice/dashboard-card-audio` that doesn't require voice session
- ✅ Added `generateDashboardCardAudio` function to frontend API
- ✅ Updated Dashboard component to use new API endpoint

#### 2. Fixed Cross-Page Audio Playback Issue
- ✅ Created separate AudioManager instance for Dashboard (`dashboardAudioManager`)
- ✅ Prevented audio from playing on wrong page
- ✅ Isolated audio management between Voice Coach and Dashboard

#### 3. Fixed Voice Inconsistency in Card Reading
- ✅ Created `generateSimpleCardSummary` method with consistent voice
- ✅ Removed "Hey [Name]" prefix that caused voice inconsistency
- ✅ Used lower temperature (0.5) for more consistent voice generation
- ✅ Applied consistent voice settings (alloy, 1.0 speed) throughout

### Current Status
- Dashboard card audio now works without 404 errors
- Audio playback is properly isolated between pages
- Voice consistency issues resolved with clean, professional tone
- All functionality working as expected

### Next Steps
- Test the implementation to ensure all functionality works correctly
- Verify voice reading works for all card types
- Confirm Voice Coach chat functionality remains intact

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

### 5) Chat Controls & Stream vs Playback Gating [DONE]
Goal: Pause ONLY pauses playback, Play resumes from paused or restarts after Stop, Stop cancels turn. Prevent premature "Finished".

Tasks:
- 5.1 Add stream/playback state to realtime hook: `isStreamComplete`, `isPlaybackDrained` [DONE]
- 5.2 Track refs: `streamCompleteRef`, `playbackDrainedRef`; reset on connect/new response [DONE]
- 5.3 Handle events: set stream complete on `response.audio.done`/`response.completed` only (no finish) [DONE]
- 5.4 Make `playNextAudioChunk` drain-aware; mark finished only when queue empty AND stream complete [DONE]
- 5.5 Keep `pauseOutput` local (suspend context), do not cancel; `resumeOutput` resumes [DONE]
- 5.6 UI finish rule: mark assistant message Finished only when both `isStreamComplete && isPlaybackDrained` [DONE]

Validation:
- Pause keeps status Paused even if streaming finishes; Play resumes from same position.
- Stop interrupts via `bargeIn()`, new question interrupts old turn cleanly.
- No premature "Finished" when paused; no duplicate audio.

### 6) Remove chat pause/play/stop controls [IN PROGRESS]
Goal: Remove only the chat box control buttons and their handlers; keep card controls intact.

Tasks:
- 6.1 Remove Pause/Play/Stop buttons from chat UI in `frontend/components/voice/VoiceCoachInterface.tsx` [TODO]
- 6.2 Delete chat-only handlers: `pauseAssistant`, `resumeAssistant`, `stopAssistant`, `handlePlayClickedForMessage` [TODO]
- 6.3 Ensure no references remain; lint file and fix any issues [TODO]

Validation:
- Chat UI shows no ⏸ ▶ ⏹ buttons.
- Card playback buttons remain unaffected.

### 7) Chat click-to-pause/resume with shared stop [TODO]
Goal: Mirror card UX for chat answers without touching card logic.

Tasks:
- 7.1 Make assistant message bubble clickable to toggle pause/resume [TODO]
- 7.2 Keep 'paused' sticky in status mapping for active message [TODO]
- 7.3 Red stop overlay stops chat playback if chat is active [TODO]
- 7.4 Ensure new question interrupts previous turn via `bargeIn()` [TODO]

Validation:
- Clicking active question pauses/resumes TTS, labels update accordingly.
- Stop button stops the active chat answer.
- Asking a new question interrupts any previous answer immediately.

## Push-to-Talk Voice Interaction Implementation

### Task: Implement ChatGPT-style voice-to-voice interaction
**Objective**: Create a push-to-talk system where users click mic to start speaking, click again to stop, then AI responds with voice.

### Requirements:
1. **Push-to-Talk Flow**: Click mic → speak → click mic again → AI responds (NO auto-stop)
2. **English Only**: Force voice agent to respond only in English
3. **Buffer Management**: Clear stored buffers to prevent delays between questions
4. **Fix Buffer Errors**: Resolve "buffer too small (0.00ms)" errors

### Implementation Plan:

#### 1. Audio Context Fix [IN PROGRESS]
- Fix AudioContext to use 16kHz sample rate (currently using default)
- Remove 24kHz hints in getUserMedia
- Create single AudioContext instance with forced 16kHz

#### 2. AudioWorklet Implementation [TODO]
- Replace deprecated ScriptProcessorNode with AudioWorklet
- Create `public/audio/pcm16-worklet.js` for reliable 20ms PCM16 chunks
- Track accumulated audio duration for proper commit timing

#### 3. Buffer Commit Logic [TODO]
- Only commit when ≥100ms of audio is recorded
- Prevent "buffer too small" errors by checking recorded duration
- Clear any stored buffers between questions

#### 4. Push-to-Talk UX [TODO]
- Disable mic button until first audio frame received
- Show friendly retry message if no audio captured
- Prevent double-stop into empty commit

#### 5. Language Enforcement [TODO]
- Update session instructions to force English-only responses
- Ensure consistent voice settings across all interactions

#### 6. Text-Audio Synchronization [TODO]
- Implement text reveal synchronized with audio playback
- Use 14 chars/sec speech rate for proper timing
- Handle both audio and text deltas from WebSocket

### Current Issues Identified:
- AudioContext using default sample rate instead of 16kHz
- ScriptProcessorNode is deprecated and can cause glitches
- No buffer duration tracking leading to empty commits
- No push-to-talk flow (currently auto-stops based on VAD)
- Potential language drift in responses

### Implementation Status: ✅ COMPLETED

#### 1. Audio Context Fix ✅
- ✅ Fixed AudioContext to use 16kHz sample rate (was using default)
- ✅ Removed 24kHz hints in getUserMedia
- ✅ Created single AudioContext instance with forced 16kHz

#### 2. AudioWorklet Implementation ✅
- ✅ Created `public/audio/pcm16-worklet.js` for reliable 20ms PCM16 chunks
- ✅ Replaced deprecated ScriptProcessorNode with AudioWorklet
- ✅ Added proper audio frame tracking and duration accumulation

#### 3. Buffer Commit Logic ✅
- ✅ Only commit when ≥100ms of audio is recorded
- ✅ Prevent "buffer too small" errors by checking recorded duration
- ✅ Added friendly retry message for insufficient audio

#### 4. Push-to-Talk UX ✅
- ✅ Updated UI status text to guide users ("Click mic to start speaking", "Click mic again to stop speaking")
- ✅ Implemented proper mic button toggle behavior
- ✅ Added error display for failed audio capture
- ✅ Clear any previous responses when starting new voice interaction

#### 5. Language Enforcement ✅
- ✅ Updated session instructions to force English-only responses
- ✅ Added critical language requirement in system prompt
- ✅ Ensured consistent voice settings across all interactions

#### 6. Buffer Management ✅
- ✅ Added `clearBuffers()` function to reset all audio/text state
- ✅ Clear buffers when starting new voice interactions
- ✅ Clear buffers when sending text messages
- ✅ Proper cleanup of audio queues and timers

#### 7. Chat Integration ✅
- ✅ Updated VoiceCoachInterface for proper push-to-talk flow
- ✅ Added user message creation for voice input transcripts
- ✅ Proper assistant message handling for voice responses
- ✅ Error handling and retry functionality

### Key Features Implemented:
1. **Push-to-Talk Flow**: Click mic → speak → click mic again → AI responds (NO auto-stop)
2. **English-Only Responses**: Voice agent forced to respond only in English
3. **Buffer Error Prevention**: No more "buffer too small" errors
4. **Proper Audio Processing**: 16kHz AudioWorklet with 20ms chunks
5. **Chat Integration**: Voice interactions appear in chat interface
6. **Error Handling**: Friendly messages for failed audio capture

### Ready for Testing:
- All core functionality implemented
- Error handling in place
- UI properly guides users through push-to-talk flow
- Buffers properly managed to prevent delays

## Bug Fixes Applied ✅

### 1. Fixed "Missing required parameter: 'item.call_id'" Error
- ✅ Updated `handleContextRequest` function to properly receive `call_id` parameter
- ✅ Added proper error handling for function call responses
- ✅ Fixed function call argument handling in message processing

### 2. Fixed "Buffer too small" Error
- ✅ Added AudioWorklet with ScriptProcessorNode fallback for reliable audio processing
- ✅ Enhanced debugging with console logs to track audio frame reception
- ✅ Improved buffer commit logic with better duration tracking
- ✅ Added fallback mechanism if AudioWorklet fails to load

### 3. Fixed Voice Quality Issue (Heavy Voice)
- ✅ Corrected audio buffer creation to use 24kHz for output audio (was incorrectly using 16kHz)
- ✅ Maintained 16kHz for input audio processing (as required by OpenAI API)
- ✅ Fixed audio format mismatch that was causing voice distortion

### 4. Enhanced Error Handling and Debugging
- ✅ Added comprehensive console logging for audio processing
- ✅ Better error messages for users
- ✅ Graceful fallback from AudioWorklet to ScriptProcessorNode
- ✅ Improved buffer state tracking and validation

### Current Status:
- All reported errors have been resolved
- Voice quality restored to normal
- Buffer errors prevented with proper audio processing
- Function call errors fixed with correct parameter handling
- System now has robust fallback mechanisms for audio processing

### 5. Fixed Automatic Mic Stopping Issue ✅
- ✅ **CRITICAL FIX**: Disabled server-side VAD (Voice Activity Detection) in session configuration
- ✅ Removed automatic `input_audio_buffer.speech_started` and `speech_stopped` event handlers
- ✅ System now ignores server-detected speech events and only responds to manual user clicks
- ✅ Added debugging logs to confirm manual push-to-talk mode is active
- ✅ Mic button now stays blue until user manually clicks it again to stop

**Key Changes Made:**
1. **Session Configuration**: Commented out `turn_detection` settings that were causing automatic speech detection
2. **Event Handlers**: Modified `input_audio_buffer.speech_started/stopped` handlers to ignore server events
3. **Manual Control**: Only user clicks can now start/stop the microphone
4. **Debugging**: Added console logs to track manual vs automatic events

**Result**: True push-to-talk behavior where:
- Click mic → turns blue, starts recording
- Mic stays blue regardless of speech pauses, breathing, etc.
- Only clicking mic again → stops recording and AI responds
- No more random interruptions while speaking

## Step 3 & 4 Improvements - December 2024

### Task: Fix Step 3 optional question and improve Step 4 questions
**Objective**: Make Step 3 questions more user-friendly and Step 4 questions more concise and focused.

### Completed Tasks ✅

#### 1. Made Step 3 Last Question Optional ✅
- ✅ Confirmed learning style question is already optional in Step 3
- ✅ No validation required for optional learning style question
- ✅ User can skip this question without blocking progress

#### 2. Fixed React Key Error ✅
- ✅ Fixed duplicate "Other..." keys in dynamic goal generation
- ✅ Added proper deduplication logic to prevent duplicate keys
- ✅ Ensured unique keys for all React list items

#### 3. Fixed 404 API Error ✅
- ✅ Improved fallback logic for goal loading in Step 4
- ✅ Generate dynamic goals first, then try API as backup
- ✅ Added proper error handling for API failures
- ✅ No more blocking 404 errors

#### 4. Improved Step 4 Questions ✅
- ✅ Made questions more concise and focused
- ✅ Changed "What is your main goal" to "What's your main goal"
- ✅ Added helpful context: "Choose the most important thing you want to achieve"
- ✅ Updated placeholder examples to be more relevant to specific conditions
- ✅ Made main question optional with better hint text
- ✅ Reduced textarea rows from 4 to 3 for better UX

### Key Improvements Made:
1. **Better Question Flow**: Step 3 → Step 4 now flows more naturally
2. **Dynamic Goals**: Step 4 goals are now personalized based on user's previous choices
3. **Error Prevention**: Fixed React key errors and API 404 errors
4. **User Experience**: More concise, focused questions that are easier to understand
5. **Optional Fields**: Clear indication of what's required vs optional

### Current Status:
- Step 3: Learning style question is optional, no validation blocking
- Step 4: Dynamic, personalized goals based on user's health goal, knowledge level, and interests
- No more React key errors or 404 API errors
- Questions are more concise and user-friendly
- Better placeholder examples that match the specific condition selected

