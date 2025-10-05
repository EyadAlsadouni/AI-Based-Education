# AI-Based Education Platform - Complete Project Documentation

## Project Overview
A comprehensive multi-step health education platform that provides personalized educational content based on user's specific health conditions and needs.

### Current Architecture

#### Frontend (Next.js 15.5.2)
- **Location**: `frontend/` directory
- **Framework**: Next.js with TypeScript
- **UI Components**: Custom components in `components/` directory
- **State Management**: React hooks with localStorage persistence
- **API Integration**: Axios-based API client

#### Backend (Node.js + Express)
- **Location**: `backend/` directory  
- **Database**: SQLite (`database.sqlite`)
- **AI Integration**: OpenAI GPT-4 for content generation
- **Voice Features**: OpenAI Realtime API for voice interactions

## Multi-Step User Flow

### Step 1: Personal Information & Health Goals
- **Purpose**: Collect basic user info and primary health focus
- **Fields**: Name, age, gender, health goals
- **Health Goal Options**:
  - Education about the condition
  - How to use my medication (insulin/asthma with future photos/instructions)
  - Psychological health (panic attacks, patient actions)
  - Preparing for a procedure

### Step 2: Condition Selection (Dynamic)
- **Purpose**: Select specific health condition based on Step 1 choice
- **Dynamic Options**: Changes based on Step 1 selection
- **Categories**:
  - **Education about the condition**: Diabetes, Heart & Blood Pressure, Respiratory, Digestive/Gut Health
  - **Preparing for a procedure**: Endoscopy/Colonoscopy, Day Surgery, Imaging, Dental Procedure
  - **How to use my medication**: Inhalers, Insulin & Diabetes Medicines, Blood-Pressure Medicines, Cholesterol Medicines
  - **Psychological health**: Anxiety & Panic, Depression, Stress & Coping, Sleep Health

### Step 3: Learning Needs Discovery
- **Purpose**: Assess user's current knowledge level and interests
- **Questions**:
  - **Knowledge Level**: New to condition, Some experience, Very experienced
  - **Main Interests**: What aspects of their condition they feel most confident about
  - **Other Knowledge**: Optional field for specific knowledge (appears when "Other" is selected)
- **Assessment Focus**: "What aspects of [condition] do you feel most confident about?"
- **Options Format**: "I understand...", "I know...", "I can recognize..."

### Step 4: Goals & Learning Preferences
- **Purpose**: Set future goals and learning preferences
- **Questions**:
  - **Main Goals**: Multiple selection of what they want to achieve
  - **Main Question**: Optional question about their condition (with medical advice validation)
  - **Learning Style**: How they prefer to learn (moved from Step 3)
- **Achievement Focus**: Goals emphasize "Master X", "Feel confident", "Reduce anxiety"

## Dashboard System

### Current Implementation (Static 4-Card System)
- **Card 1**: Diagnosis Basics - Core knowledge about their condition
- **Card 2**: Nutrition and Carbs - Dietary guidance specific to their condition  
- **Card 3**: Workout - Safe exercise recommendations for their condition
- **Card 4**: Plan Your Day - Daily management checklist and tips

### AI Content Generation
- **Model**: GPT-4 for high-quality educational content
- **References**: Includes 2-4 credible medical references per card
- **Personalization**: Content tailored to user's specific condition and context
- **Safety**: Medical advice prevention with validation and redirection

## Voice Features Implementation

### Voice Coach UI Redesign ✅

#### Task: Remove Listen Mode and Add Voice Reading to Dashboard Cards
**Objective**: Remove Listen Mode from Voice Coach page and add microphone icons to Dashboard cards for voice reading functionality.

#### Completed Tasks ✅

##### 1. Remove Listen Mode from Voice Coach Page
- ✅ Removed mode state management (`listen` | `chat`)
- ✅ Removed card-related states (`cards`, `selectedCard`, `isPlayingCard`, `isPausedCard`)
- ✅ Removed card audio event handlers
- ✅ Removed card selection and audio handling functions
- ✅ Removed entire Mode Selection section from UI
- ✅ Updated layout to full-width for Voice Agent section
- ✅ Updated status text to remove card-related status
- ✅ Updated stop button logic to remove card-related conditions
- ✅ Updated avatar isPlaying prop to only use realtime session

##### 2. Add Microphone Icons to Dashboard Cards
- ✅ Added necessary imports (Mic, MicOff, Volume2, VolumeX icons, voiceApi, AudioManager)
- ✅ Added voice reading states (playingCardId, isPlaying, isPaused)
- ✅ Added audio event handlers for voice reading
- ✅ Implemented voice reading functions (handleVoiceRead, handleStopAudio)
- ✅ Updated card rendering with microphone icons
- ✅ Added visual feedback (playing/paused states)
- ✅ Added global audio control bar when playing
- ✅ Added proper event handling to prevent card click when clicking mic

##### 3. Voice Reading Functionality
- ✅ Integrated with existing voiceApi.summarizeCard() function
- ✅ Used shared AudioManager for consistent audio management
- ✅ Added play/pause/stop functionality for card content
- ✅ Added visual feedback with different icon states
- ✅ Added proper error handling

### Voice Coach Stabilization Plan

#### 1) Persistence/Caches Audit [DONE]
- Locate SQLite DB and inspect tables (`users`, `voice_sessions`, `tts_cache`, etc.)
- Report row counts; flag large tables
- Identify server/FS caches (audio-cache/tmp) and frontend caches (localStorage)
- Provide safe cleanup commands (dev only)

**Outcome:**
- DB located at `backend/database.sqlite`. Counts: users=3, voice_sessions=7, tts_cache=3, dashboard_content=0, mini_kb=88, conditions=4
- No FS caches; localStorage keys identified
- Cleanup scripts prepared and executed for `tts_cache` and `voice_sessions` (now 0)

#### 2) Card Playback Reliability [DONE]
**Goal**: No delay, no overlap, consistent English voice, reliable pause/resume, avatar sync ≤120ms.

**Tasks:**
- 2.1 Implement AudioManager singleton with one shared `HTMLAudioElement` [DONE]
  - API: `play(url)`, `pause()`, `resume()`, `stop()`, `on('start'|'pause'|'end'|'error')`
  - Ensures only one audio plays at a time
- 2.2 Add PlaybackQueue semantics (serialize plays) via AudioManager [DONE]
  - Stop current before starting next; no overlapping audio
- 2.3 Avatar synchronization [DONE]
  - Start avatar after `audio.play()` resolves; stop on `pause/end` within 120ms
- 2.4 Restore reliable pause/resume toggle [DONE]
  - Clicking the same card toggles pause/resume repeatedly
  - Keep selection stable; UI shows "Playing..." / "Paused" accordingly
  - Do not clear selection on pause or when rapidly switching cards
- 2.5 Voice & language pinning [DONE]
  - Force English-only instructions and fixed voice across cache & TTS
  - Ensure cache key includes `voice_id` (and language if applicable)

#### 3) Live Q&A Realtime (WebRTC/WS proxy) [DONE]
- Confirm ephemeral/proxy token flow, session config pinning (voice/lang), and audio pipeline

#### 4) Noise/Buzz Mitigation [DONE]
- Ensure only one audio graph, stop unused streams, throttle animations with rAF, pause on hidden tab

#### 5) Chat Controls & Stream vs Playback Gating [DONE]
**Goal**: Pause ONLY pauses playback, Play resumes from paused or restarts after Stop, Stop cancels turn. Prevent premature "Finished".

**Tasks:**
- 5.1 Add stream/playback state to realtime hook: `isStreamComplete`, `isPlaybackDrained` [DONE]
- 5.2 Track refs: `streamCompleteRef`, `playbackDrainedRef`; reset on connect/new response [DONE]
- 5.3 Handle events: set stream complete on `response.audio.done`/`response.completed` only (no finish) [DONE]
- 5.4 Make `playNextAudioChunk` drain-aware; mark finished only when queue empty AND stream complete [DONE]
- 5.5 Keep `pauseOutput` local (suspend context), do not cancel; `resumeOutput` resumes [DONE]
- 5.6 UI finish rule: mark assistant message Finished only when both `isStreamComplete && isPlaybackDrained` [DONE]

## Push-to-Talk Voice Interaction Implementation

### Task: Implement ChatGPT-style voice-to-voice interaction
**Objective**: Create a push-to-talk system where users click mic to start speaking, click again to stop, then AI responds with voice.

### Requirements:
1. **Push-to-Talk Flow**: Click mic → speak → click mic again → AI responds (NO auto-stop)
2. **English Only**: Force voice agent to respond only in English
3. **Buffer Management**: Clear stored buffers to prevent delays between questions
4. **Fix Buffer Errors**: Resolve "buffer too small (0.00ms)" errors

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

### 6. Fixed 404 Error for Dashboard Card Audio
- ✅ Created new API endpoint `/voice/dashboard-card-audio` that doesn't require voice session
- ✅ Added `generateDashboardCardAudio` function to frontend API
- ✅ Updated Dashboard component to use new API endpoint

### 7. Fixed Cross-Page Audio Playback Issue
- ✅ Created separate AudioManager instance for Dashboard (`dashboardAudioManager`)
- ✅ Prevented audio from playing on wrong page
- ✅ Isolated audio management between Voice Coach and Dashboard

### 8. Fixed Voice Inconsistency in Card Reading
- ✅ Created `generateSimpleCardSummary` method with consistent voice
- ✅ Removed "Hey [Name]" prefix that caused voice inconsistency
- ✅ Used lower temperature (0.5) for more consistent voice generation
- ✅ Applied consistent voice settings (alloy, 1.0 speed) throughout

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

## Step 3 & Step 4 Differentiation - January 2025

### Task: Differentiate Step 3 and Step 4 options to avoid overlap
**Objective**: Make Step 3 focus on understanding/knowledge and Step 4 focus on achieving/improving.

### Completed Tasks ✅

#### 1. Analyzed All Conditions for Overlap ✅
- ✅ Systematically reviewed all Step 3 and Step 4 options
- ✅ Identified 5 conditions with high overlap (Inhalers, Insulin, BP Meds, Cholesterol, Respiratory)
- ✅ Confirmed other conditions already had good differentiation

#### 2. Updated Step 3 Main Interests for ALL Conditions ✅
- ✅ **Inhalers (Asthma/COPD)**: Changed to assessment-focused (what user already knows about inhalers)
- ✅ **Insulin & Diabetes Medicines**: Changed to assessment-focused (what user already knows about diabetes meds)
- ✅ **Blood-Pressure Medicines**: Changed to assessment-focused (what user already knows about BP meds)
- ✅ **Cholesterol Medicines (Statins)**: Changed to assessment-focused (what user already knows about statins)
- ✅ **Respiratory (Asthma/COPD)**: Changed to assessment-focused (what user already knows about breathing conditions)
- ✅ **Diabetes**: Changed to assessment-focused (what user already knows about diabetes management)
- ✅ **Heart & Blood Pressure**: Changed to assessment-focused (what user already knows about heart health)
- ✅ **Digestive Health**: Changed to assessment-focused (what user already knows about digestive health)
- ✅ **All Procedures**: Changed to assessment-focused (what user already knows about procedures)
- ✅ **All Psychological Health**: Changed to assessment-focused (what user already knows about mental health)

#### 3. Maintained Step 4 Goals as Achievement-Focused ✅
- ✅ Kept Step 4 goals focused on concrete achievements and improvements
- ✅ Goals emphasize "Master X", "Feel confident", "Reduce anxiety", "Optimize routine"
- ✅ No changes needed to Step 4 (already well-differentiated)

### Key Improvements Made:
1. **Clear Purpose Distinction**: Step 3 = Assessment (what user already knows), Step 4 = Achieving (future goals)
2. **Consistent Question Format**: ALL conditions now use "What aspects of X do you feel most confident about?"
3. **Option Content**: 
   - Step 3: "I understand how X works", "I know why Y happens", "I can recognize Z"
   - Step 4: "Master X", "Feel confident doing Y", "Reduce Z anxiety"
4. **No Overlap**: Each step now has distinct, complementary purposes
5. **Assessment Focus**: Step 3 now properly assesses current knowledge level rather than asking about learning interests
6. **User Experience Consistency**: All 16 conditions now follow the same question pattern for a cohesive experience

## Database Schema

### Users Table
- Basic user information (name, age, gender, health_goals)

### User Sessions Table
- `user_id`, `condition_selected`, `diagnosis_year`
- `takes_medication`, `medications`, `checks_vitals`
- `main_goal`, `main_question`
- `knowledge_level`, `main_interests`, `learning_style`, `other_knowledge`
- `ai_response` (JSON string of generated dashboard content)

### Voice Sessions Table
- Voice interaction session management
- TTS cache for audio optimization

## Key Features Implemented

### ✅ Dynamic Step Flow
- Step 2 options change based on Step 1 selection
- Step 3 questions are condition-specific
- Step 4 goals are personalized based on previous answers

### ✅ Form Data Persistence
- localStorage for client-side persistence
- Database storage for user sessions
- Proper data validation and error handling

### ✅ AI-Powered Content Generation
- Personalized dashboard content based on user choices
- Medical reference integration
- Safety guidelines to prevent medical advice

### ✅ Voice Integration
- Dashboard card voice reading
- Push-to-talk voice coach
- Audio management and synchronization

### ✅ User Experience Enhancements
- Clear differentiation between Step 3 (assessment) and Step 4 (goals)
- Optional vs required field indicators
- Medical advice validation and prevention
- Responsive design and error handling

## Current Status
- ✅ Multi-step form flow working correctly
- ✅ Dynamic content based on user selections
- ✅ AI-generated personalized dashboard content
- ✅ Voice reading and voice coach functionality
- ✅ Database schema supports all required fields
- ✅ Form validation and error handling
- ✅ Medical safety measures in place

## Technical Stack
- **Frontend**: Next.js 15.5.2, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, SQLite
- **AI**: OpenAI GPT-4, OpenAI Realtime API
- **Voice**: Web Audio API, AudioWorklet
- **State**: React hooks, localStorage
- **API**: Axios, RESTful endpoints

## File Structure
```
frontend/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── steps/            # Step 1-4 components
│   ├── voice/            # Voice interaction components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and API client
└── types/                # TypeScript type definitions

backend/
├── routes/               # API route handlers
├── services/            # Business logic services
└── database.sqlite      # SQLite database
```

## Context-Aware Dashboard Implementation - October 2025

### Task: Make Dashboard Cards Context-Aware Based on User Choices
**Objective**: Replace static 4-card dashboard with dynamic, context-aware cards that change based on user's previous choices from Steps 1-4.

### ✅ FULLY IMPLEMENTED - October 1, 2025

#### 1. Dynamic Card Generation System ✅
**File Created**: `frontend/lib/dashboardCards.ts`

**Implementation Details**:
- ✅ Created `generateDashboardCards()` function that analyzes user session data
- ✅ Context-aware card selection based on:
  - **Health goal**: medication, procedure, psychological health, or education
  - **Specific condition**: 16 different conditions supported
  - **Main interests**: What the user wants to learn about
  - **Learning style**: videos, step-by-step, or quick tips
  - **Main question**: User's specific concerns or questions
  - **Knowledge level**: new, some experience, or experienced
  - **Vitals tracking**: Whether user monitors their health metrics
- ✅ 25+ different card types covering all user scenarios
- ✅ Priority-based card ordering (most relevant cards appear first)
- ✅ Flexible card count (2-5 cards, never more than 5)
- ✅ Fallback system if card generation fails

**Card Types Created**:
1. **Medication Cards** (7 types):
   - `inhaler_technique`: Step-by-step inhaler usage
   - `injection_guide`: Injection technique and site rotation
   - `bp_medication_guide`: Blood pressure medication timing
   - `statin_guide`: Cholesterol medication management
   - `medication_safety`: Storage and side effects
   - `medication_monitoring`: Tracking medication effectiveness
   - `medication_daily_plan`: Daily medication routine

2. **Procedure Cards** (5 types):
   - `procedure_prep`: Pre-procedure preparation checklist
   - `procedure_expectations`: What happens during procedure
   - `procedure_recovery`: Post-procedure care and timeline
   - `procedure_diet`: Diet guidelines before/after
   - `procedure_anxiety`: Anxiety management strategies

3. **Mental Health Cards** (8 types):
   - `anxiety_management`: Anxiety and panic attack strategies
   - `breathing_exercises`: Calming breathing techniques
   - `mood_management`: Depression and mood improvement
   - `mental_health_routine`: Daily mental health habits
   - `stress_management`: Stress relief strategies
   - `sleep_hygiene`: Better sleep habits
   - `coping_strategies`: Healthy coping methods
   - `mental_health_warning_signs`: When to seek help

4. **General Education Cards** (7 types):
   - `diagnosis_basics`: Core condition knowledge
   - `nutrition_carbs`: Diet and nutrition guidance
   - `workout`: Safe exercise recommendations
   - `medications`: Medication understanding
   - `monitoring`: Tracking health metrics
   - `warning_signs`: Emergency symptom recognition
   - `daily_plan`: Daily management checklist

#### 2. Dashboard Component Updates ✅
**File Modified**: `frontend/components/steps/Dashboard.tsx`

**Changes Made**:
- ✅ Added `dynamicCards` state to store generated cards
- ✅ Call `generateDashboardCards()` when user session loads
- ✅ Updated card rendering to use `dynamicCards` instead of static `DASHBOARD_CARDS`
- ✅ Modified `handleCardClick()` to use dynamic `contentKey` for content lookup
- ✅ Updated voice reading to work with dynamic card IDs
- ✅ Modified audio control bar to show dynamic card titles
- ✅ Updated `generateDashboardContent()` to send dynamic cards to backend
- ✅ Added check for `dynamicCards.length > 0` before generating content

#### 3. API Client Enhancement ✅
**File Modified**: `frontend/lib/api.ts`

**Changes Made**:
- ✅ Updated `aiApi.generateDashboard()` to accept optional `dynamicCards` parameter
- ✅ API now sends `dynamic_cards` array to backend
- ✅ Maintained backward compatibility for existing code

#### 4. Backend AI Content Generation ✅
**File Modified**: `backend/routes/ai.js`

**Changes Made**:
- ✅ Created `generateDynamicContentPrompt()` function with 25+ card-specific prompts
- ✅ Each prompt tailored to specific card type and user context
- ✅ Prompts adapt based on user's learning style (videos vs text)
- ✅ All prompts include requirements for 2-4 credible medical references
- ✅ Dynamic max_tokens based on card type (400-700 tokens)
- ✅ Updated POST `/api/ai/generate-dashboard` to:
  - Accept `dynamic_cards` array from frontend
  - Use dynamic cards if provided, fallback to default 4 cards
  - Generate content for each card using specific prompts
  - Build dashboard content object dynamically
  - Maintain backward compatibility with `diagnosis_basics`, `nutrition_carbs`, `workout`, `daily_plan` keys
- ✅ Removed old static card generation code

### System Flow:

1. **User completes Steps 1-4** → Data stored in database
2. **User reaches Dashboard** → `Dashboard.tsx` loads
3. **Load user session** → `userApi.getSession()` fetches user data
4. **Generate dynamic cards** → `generateDashboardCards(session)` analyzes user journey
5. **Display card list** → Shows 2-5 relevant cards with icons/descriptions
6. **User clicks "Generate Content"** → Sends `dynamicCards` to backend
7. **Backend generates content** → `generateDynamicContentPrompt()` creates specific prompts
8. **AI generates content** → GPT-4 creates content for each card
9. **Content displayed** → User sees personalized educational content
10. **Voice reading available** → User can hear content read aloud

### Real-World Examples:

#### Example 1: Inhaler User
**User Input**:
- Health goal: "How to use my medication"
- Condition: "Inhalers (Asthma/COPD)"
- Main interest: "I don't know how to take my asthma inhaler"
- Learning style: "Videos"

**Generated Cards** (4 cards):
1. ✅ **How to Use Your Inhaler** (Priority 1) → Video tutorials showing technique
2. ✅ **Medication Safety Tips** (Priority 2) → Storage and side effects
3. ✅ **Monitoring Your Progress** (Priority 3) → Track medication effectiveness
4. ✅ **Daily Medication Routine** (Priority 4) → Building consistent schedule

❌ **NOT Shown**: Nutrition card, workout card

#### Example 2: Endoscopy Patient
**User Input**:
- Health goal: "Preparing for a procedure"
- Condition: "Endoscopy / Colonoscopy"
- Main interest: "Preparation" and "What to expect"
- Main question: "I'm feeling anxious about the procedure"

**Generated Cards** (5 cards):
1. ✅ **Preparation Checklist** (Priority 1) → Timeline and instructions
2. ✅ **What to Expect** (Priority 2) → Step-by-step procedure explanation
3. ✅ **Recovery & Aftercare** (Priority 3) → Post-procedure care
4. ✅ **Diet Guidelines** (Priority 4) → What to eat before/after
5. ✅ **Managing Anxiety** (Priority 5) → Calming strategies (because user mentioned anxiety)

❌ **NOT Shown**: Workout card, general nutrition card

#### Example 3: Anxiety Management
**User Input**:
- Health goal: "Psychological health"
- Condition: "Anxiety & Panic"
- Main interest: "Managing panic attacks"
- Learning style: "Step-by-step guides"

**Generated Cards** (4 cards):
1. ✅ **Managing Anxiety & Panic** (Priority 1) → Techniques to calm anxiety
2. ✅ **Breathing Techniques** (Priority 2) → Step-by-step breathing exercises
3. ✅ **Healthy Coping Methods** (Priority 3) → Tools for difficult emotions
4. ✅ **When to Seek Help** (Priority 4) → Warning signs

❌ **NOT Shown**: Nutrition card, workout card

#### Example 4: Diabetes Education
**User Input**:
- Health goal: "Education about the condition"
- Condition: "Diabetes"
- Main interest: "Diet" and "Exercise"
- Checks vitals: "Yes, regularly"

**Generated Cards** (5 cards):
1. ✅ **Understanding Diabetes** (Priority 1) → Core knowledge
2. ✅ **Nutrition & Diet** (Priority 2) → Eating well with diabetes
3. ✅ **Safe Exercise** (Priority 3) → Exercise recommendations
4. ✅ **Tracking Your Health** (Priority 3) → Monitoring vitals
5. ✅ **Plan Your Day** (Priority 4) → Daily management

### Technical Implementation Details:

**Priority System**:
- Cards are assigned priority 1-5 (lower = higher priority)
- Most relevant cards get priority 1
- System sorts by priority and limits to 5 cards max
- Ensures users never feel overwhelmed

**Content Key Mapping**:
- Each card has a `contentKey` property
- Used to retrieve content from backend response
- Example: `inhaler_technique` → backend generates content for this key
- Allows flexible content structure

**Backward Compatibility**:
- Old 4-card system still works as fallback
- If no dynamic cards provided, uses default 4 cards
- Existing dashboard content still accessible
- `diagnosis_basics`, `nutrition_carbs`, `workout`, `daily_plan` always included in response

**Learning Style Adaptation**:
- If user prefers "videos" → prompts include YouTube video links
- If user prefers "step-by-step" → detailed written instructions
- If user prefers "quick tips" → concise, scannable information
- Max tokens adjusted based on learning style (videos need more space)

### Files Modified:

1. ✅ **Frontend**:
   - `frontend/lib/dashboardCards.ts` (NEW FILE - 400+ lines)
   - `frontend/components/steps/Dashboard.tsx` (MODIFIED - 8 changes)
   - `frontend/lib/api.ts` (MODIFIED - 1 change)

2. ✅ **Backend**:
   - `backend/routes/ai.js` (MODIFIED - 350+ lines added, old code removed)

### Testing Checklist:
- ✅ Test with medication use case (inhaler)
- ✅ Test with procedure preparation (endoscopy)
- ✅ Test with psychological health (anxiety)
- ✅ Test with general education (diabetes)
- ✅ Verify cards change based on user choices
- ✅ Verify card count varies (2-5 cards)
- ✅ Test backward compatibility with existing dashboards
- ✅ Test voice reading with dynamic cards
- ✅ Test PDF generation with dynamic cards
- ✅ Test content generation with dynamic prompts

### Key Features Implemented:
1. ✅ **Context-Aware Card Selection**: Cards change based on user's health goal, condition, and preferences
2. ✅ **Dynamic Content Generation**: AI generates specific content for each card type using tailored prompts
3. ✅ **Backward Compatibility**: Legacy card names still work for existing content
4. ✅ **Flexible Card Count**: 2-5 cards depending on user's specific needs (never more than 5)
5. ✅ **Priority-Based Ordering**: Most relevant cards appear first
6. ✅ **Comprehensive Coverage**: 25+ card types covering all 16 conditions and 4 health goals
7. ✅ **Learning Style Adaptation**: Content format changes based on user's preferred learning style
8. ✅ **Interest-Based Filtering**: Cards align with what user expressed interest in
9. ✅ **Fallback System**: Default cards if generation fails or no preferences specified

## Current Tasks - October 4, 2025

### Task: Make Step 2 Condition Selection Required with Validation
**Objective**: Add proper validation to Step 2 so users see an error message if they try to continue without selecting a condition, matching the validation pattern used in Steps 1, 3, and 4.

#### Subtasks:
- ✅ Remove button disable condition based on selection
- ✅ Add required red asterisk (*) to the question heading
- ✅ Update question text to be more clear: "Which condition would you like to learn about?"
- ✅ Keep validation logic in handleContinue function
- ✅ Ensure error message displays correctly when user clicks Continue without selection
- ✅ Verify button behavior matches other steps

**Changes Made**:
1. ✅ Changed heading from "Available Conditions" to "Which condition would you like to learn about? *" with red asterisk
2. ✅ Removed `!selectedCondition` from button's `disabled` prop
3. ✅ Moved error message to TOP of form (above question) for maximum visibility
4. ✅ Enhanced error styling with:
   - Thicker red border (border-2)
   - Animate-pulse effect to draw attention
   - Font-medium for better readability
   - Bold exclamation mark
5. ✅ Added console.log debugging to track validation
6. ✅ Added window.scrollTo to ensure error is visible when shown
7. ✅ Removed duplicate error message that was below condition grid

**Status**: ✅ COMPLETED - Step 2 now has required asterisk and shows a prominent red error message at the top when Continue is clicked without selecting a condition. The error message is highly visible with animation and appears above all form content.

## Project Status - October 2025

### ✅ Completed Features:
- Multi-step assessment flow (Steps 1-4)
- Context-aware dynamic dashboard with 25+ card types
- AI-powered personalized content generation
- Voice reading with dashboard cards
- Push-to-talk voice coach
- PDF report generation
- Medical safety measures and validation
- Backward compatibility maintained
- Enhanced error handling and debugging
- Improved reference management in AI content
- Dynamic card content generation with tailored prompts
- Comprehensive card templates for all 16 conditions

### Current State - Octuber 2025:
The project is in excellent condition with all major features implemented and working. The Context-Aware Dashboard Implementation has been successfully completed, providing users with personalized educational content based on their specific health conditions, goals, and learning preferences.

### Recent Improvements:
1. **Enhanced AI Content Generation**: Improved prompts and reference management
2. **Better Error Handling**: Comprehensive error handling and fallback systems
3. **Dynamic Card System**: 25+ card types covering all user scenarios
4. **Voice Integration**: Seamless voice reading and push-to-talk functionality
5. **Medical Safety**: Robust medical advice prevention and validation
6. **Enhanced Step 2 Validation**: Made condition selection required with clear visual indicators
7. **Clear Selection Buttons**: Added to all steps for better user experience
   - Step 1: Clear health goals selection
   - Step 2: Clear condition selection
   - Step 3: Clear main interests selection
   - Step 4: Clear main goals selection
8. **Enhanced Voice Agent Topic Filtering**: Improved voice agent to focus on user's health topics
   - Voice agent now answers questions related to user's specific health condition and goals
   - Responds to normal conversational questions (greetings, "how are you")
   - Politely redirects completely unrelated questions (history, science, entertainment)
   - Uses user context to provide personalized, relevant responses
   - Maintains medical safety guidelines and conversational tone

### Next Steps for Future Development:
1. **Enhanced Personalization**: Even more granular content based on user responses
2. **Progress Tracking**: Track user progress through educational content
3. **Content Updates**: Allow users to refresh individual cards
4. **Analytics Dashboard**: User engagement and content effectiveness metrics
5. **Mobile Optimization**: Enhanced mobile experience and offline support
6. **Accessibility**: WCAG 2.1 AA compliance
7. **Multi-language Support**: Expand beyond English
8. **Card Bookmarking**: Allow users to save favorite cards
9. **Sharing Features**: Share cards with family/caregivers
10. **Printable Guides**: Individual card printing with QR codes

### Maintenance Tasks:
- Regular testing of AI content generation
- Monitoring of voice functionality
- Database optimization as user base grows
- Security updates and dependency management