# Voice Coach Error Solutions Documentation

This document contains all the errors we've encountered during Voice Coach development and their solutions. It will be updated as new issues are discovered and resolved.

## 📋 Table of Contents

1. [Buffer Too Small Error](#buffer-too-small-error)
2. [Conversation Already Has Active Response Error](#conversation-already-has-active-response-error)
3. [Network Connection Errors](#network-connection-errors)
4. [Duplicate Question Display Error](#duplicate-question-display-error)
5. [Text Generation Speed Issues](#text-generation-speed-issues)
6. [Voice Agent Language Issues](#voice-agent-language-issues)
7. [Mic Auto-Stop Issues](#mic-auto-stop-issues)
8. [Stop Button Functionality](#stop-button-functionality)

---

## 🔧 Error Solutions

### Buffer Too Small Error

**Error Message:** `"Error committing input audio buffer: buffer too small. Expected at least 100ms of audio, but buffer only has 0.00ms of audio."`

**Root Cause:** The system was trying to commit empty audio buffers or buffers with insufficient audio data.

**Solutions Applied:**

1. **Reduced Minimum Threshold:**
   ```typescript
   // Changed from gotMs >= 100 to gotMs > 0
   if (gotMs > 0) {
     // Commit buffer
   } else {
     // Skip commit for empty buffers
   }
   ```

2. **Enhanced Audio Processing:**
   - Improved AudioWorklet implementation for reliable audio capture
   - Added ScriptProcessorNode fallback for browsers without AudioWorklet support
   - Better audio frame detection and accumulation

3. **Error Suppression:**
   ```typescript
   // Added to benign error list
   const isBenignCancel = lower.includes('cancellation failed') || 
                         lower.includes('no active response') ||
                         lower.includes('buffer too small');
   ```

4. **Better Error Messages:**
   ```typescript
   setError("I didn't catch that—try speaking a bit longer.");
   ```

**Files Modified:** `frontend/lib/useOpenAIRealtime.ts`

---

### Conversation Already Has Active Response Error

**Error Message:** `"Conversation already has an active response in progress: resp_xxx. Wait until the response is finished before creating a new one."`

**Root Cause:** The `hasActiveResponseRef.current` flag wasn't being properly reset when responses finished, causing the system to think there was always an active response.

**Solutions Applied:**

1. **Enhanced Response Completion Handling:**
   ```typescript
   case 'response.completed':
   case 'response.done':
   case 'response.finished': {
     hasActiveResponseRef.current = false;
     setIsProcessing(false);
     break;
   }
   ```

2. **Added Timeout Protection:**
   ```typescript
   // In response.created handler
   setTimeout(() => {
     if (hasActiveResponseRef.current) {
       hasActiveResponseRef.current = false;
       setIsProcessing(false);
     }
   }, 30000); // 30 second timeout
   ```

3. **Comprehensive State Reset:**
   ```typescript
   const clearBuffers = useCallback(() => {
     // ... other resets
     hasActiveResponseRef.current = false;
   }, []);
   ```

4. **Proactive Prevention:**
   ```typescript
   // Check before creating new responses
   if (!hasActiveResponseRef.current) {
     wsRef.current.send(JSON.stringify({
       type: 'response.create',
       response: { modalities: ['audio', 'text'] }
     }));
   }
   ```

**Files Modified:** `frontend/lib/useOpenAIRealtime.ts`

---

### Network Connection Errors

**Error Message:** `"Network Error"` or `"AxiosError"` from `createSession` and `initializeVoiceCoach`

**Root Cause:** API base URL mismatch between frontend and backend, or frontend not picking up environment variables.

**Solutions Applied:**

1. **Fixed API Base URL:**
   ```typescript
   // frontend/lib/api.ts
   const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001/api';
   ```

2. **Environment Variable Configuration:**
   ```bash
   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:6001/api
   NEXT_PUBLIC_VC_TRANSPORT=websocket
   ```

3. **Frontend Restart Required:**
   - Environment variable changes require frontend restart
   - Use `npm run dev` to restart development server

**Files Modified:** `frontend/.env.local`, `frontend/lib/api.ts`

---

### Duplicate Question Display Error

**Error Message:** User questions appearing twice in the chatbox interface.

**Root Cause:** Text input was being processed by both the text submit handler and the voice transcript handler, causing duplicate messages.

**Solutions Applied:**

1. **Added Input Type Tracking:**
   ```typescript
   interface ChatMsg {
     id: string;
     content: string;
     isUser: boolean;
     isVoiceInput?: boolean;
     isTextInput?: boolean;
   }
   ```

2. **Prevented Double Submission:**
   ```typescript
   const isSubmittingTextRef = useRef(false);
   
   const handleTextSubmit = useCallback((text: string) => {
     if (isSubmittingTextRef.current) return;
     isSubmittingTextRef.current = true;
     // ... submit logic
     isSubmittingTextRef.current = false;
   }, []);
   ```

3. **Enhanced Message Filtering:**
   ```typescript
   // Skip voice transcript processing for text inputs
   if (isSubmittingTextRef.current || lastUserMsg?.isTextInput) {
     return;
   }
   ```

**Files Modified:** `frontend/components/voice/VoiceCoachInterface.tsx`, `frontend/types/index.ts`

---

### Text Generation Speed Issues

**Error Message:** Text generation finishing too quickly before voice response, then repeating content.

**Root Cause:** Text reveal speed was too fast and wasn't properly synchronized with audio playback completion.

**Solutions Applied:**

1. **Reduced Character Per Second Rate:**
   ```typescript
   const charsPerSecondRef = useRef(0.5); // Reduced from 18 to 0.5
   ```

2. **Improved Text Reveal Logic:**
   ```typescript
   // Remove Math.max(1, ...) to allow slower speeds
   const take = Math.floor(cps * dt);
   if (take > 0) {
     setVisibleResponse(prev => prev + pendingTextRef.current.slice(0, take));
   }
   ```

3. **Added Completion Tracking:**
   ```typescript
   const textRevealCompleteRef = useRef(false);
   const lastFullTextRef = useRef('');
   
   // Prevent repetition when text is complete
   if (textRevealCompleteRef.current) return;
   ```

**Files Modified:** `frontend/lib/useOpenAIRealtime.ts`, `frontend/components/voice/VoiceCoachInterface.tsx`

---

### Voice Agent Language Issues

**Error Message:** Voice agent responding in Spanish instead of English.

**Root Cause:** Insufficient English-only instructions in the session configuration.

**Solutions Applied:**

1. **Strengthened English Instructions:**
   ```typescript
   const sessionConfig = {
     instructions: `You are a helpful voice assistant. You MUST respond in English only, regardless of what language the user speaks to you in. Always use clear, professional English in your responses.`,
     // ... other config
   };
   ```

**Files Modified:** `frontend/lib/useOpenAIRealtime.ts`

---

### Mic Auto-Stop Issues

**Error Message:** Microphone stopping automatically instead of manual push-to-talk control.

**Root Cause:** Server-side Voice Activity Detection (VAD) was interfering with manual control.

**Solutions Applied:**

1. **Disabled Server VAD:**
   ```typescript
   const sessionConfig = {
     // Commented out turn_detection to disable server VAD
     // turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
   };
   ```

2. **Ignored Server Speech Events:**
   ```typescript
   case 'input_audio_buffer.speech_started':
   case 'input_audio_buffer.speech_stopped':
     // Ignore automatic speech detection - we use manual push-to-talk
     console.log('Server detected speech (ignored - using manual control)');
     break;
   ```

**Files Modified:** `frontend/lib/useOpenAIRealtime.ts`

---

### Stop Button Functionality

**Error Message:** Red stop button not properly interrupting current voice agent response.

**Root Cause:** Insufficient state clearing when stopping responses.

**Solutions Applied:**

1. **Enhanced Stop Function:**
   ```typescript
   const stopActiveChat = useCallback(() => {
     realtimeSession.bargeIn();
     realtimeSession.clearBuffers();
     // Reset active assistant and user IDs
     setActiveAssistantId(null);
     setActiveUserId(null);
     // Update message status
     setMessages(prev => prev.map(msg => 
       msg.id === activeAssistantId ? { ...msg, status: 'stopped' } : msg
     ));
     // Pause avatar
     avatarRef.current?.pause();
   }, [realtimeSession, activeAssistantId, setMessages]);
   ```

2. **Improved Barge-In Logic:**
   ```typescript
   const bargeIn = useCallback(() => {
     // Stop current audio playback
     audioQueueRef.current = [];
     isPlayingAudioRef.current = false;
     // Send cancel message
     wsRef.current?.send(JSON.stringify({ type: 'response.cancel' }));
   }, []);
   ```

**Files Modified:** `frontend/components/voice/VoiceCoachInterface.tsx`, `frontend/lib/useOpenAIRealtime.ts`

---

## 🔄 Maintenance Notes

### When Adding New Features:
1. Always test with both voice and text input
2. Ensure proper state management for concurrent responses
3. Add appropriate error handling and fallbacks
4. Update this documentation with any new errors/solutions

### When Encountering Errors:
1. Check browser console for detailed error messages
2. Verify WebSocket connection status
3. Check audio processing pipeline
4. Ensure proper state resets between interactions

### Testing Checklist:
- [ ] Voice input with push-to-talk
- [ ] Text input in chatbox
- [ ] Stop button functionality
- [ ] Pause/resume functionality
- [ ] Multiple consecutive questions
- [ ] Error recovery scenarios

---

## 📝 Last Updated
**Date:** January 2025  
**Version:** 1.0  
**Status:** Active Development

---

*This document should be updated whenever new errors are encountered or existing solutions are improved.*
