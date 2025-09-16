# Voice Coach Feature - Implementation Guide

## Overview

The Voice Coach feature adds interactive voice functionality to the AI-Based Patient Education platform, allowing users to:

- **Listen Mode**: Hear AI-generated summaries of their personalized dashboard cards
- **Chat Mode**: Have voice/text conversations with an AI health coach
- **Grounded Responses**: Get answers based on their personal health data and dashboard content
- **Real-time Audio**: Stream speech recognition and text-to-speech

## Architecture

### Backend Components

1. **Database Extensions**:
   - `voice_sessions` - Track voice coach sessions
   - `voice_turns` - Store conversation history
   - `tts_cache` - Cache generated audio
   - `mini_kb` - Knowledge base for grounded responses

2. **API Endpoints**:
   - `POST /api/voice/session` - Create voice session
   - `POST /api/voice/summarize-card` - Generate TTS for cards
   - `GET /api/voice/cards/:user_id` - Get available cards
   - `GET /api/voice/profile/:user_id` - Get user profile
   - `WS /api/voice/chat` - Real-time voice communication

3. **Services**:
   - **VoiceChatService**: Manages WebSocket connections and conversation flow
   - **Deepgram Integration**: Speech recognition and text-to-speech
   - **RAG System**: Grounded response generation with fallback

### Frontend Components

1. **Pages**:
   - `/voice-coach` - Main Voice Coach interface
   - Updated homepage with mode toggle

2. **Components**:
   - `VoiceCoachInterface` - Main interface component
   - `ModeToggle` - Switch between Dashboard and Voice modes

3. **Hooks**:
   - `useVoiceWebSocket` - WebSocket communication management
   - `useAudioManager` - Audio recording and playback

## Setup Instructions

### Prerequisites

1. **Deepgram Account**: Sign up at [https://deepgram.com](https://deepgram.com)
2. **OpenAI API Key**: For AI response generation
3. **Node.js**: Latest LTS version

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your API keys:
   ```env
   DEEPGRAM_API_KEY=your_deepgram_api_key
   OPENAI_API_KEY=your_openai_api_key
   DEEPGRAM_VOICE_ID=aura-asteria-en
   ```

3. **Database Migration**:
   The new database tables will be created automatically when the server starts.

4. **Start Server**:
   ```bash
   npm start
   ```
   
   Server runs on port 5000 with WebSocket support.

### Frontend Setup

1. **Environment Configuration**:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   
   Frontend runs on port 3001.

## Usage Guide

### For Users

1. **Complete Onboarding**: Finish the 5-step health assessment
2. **Access Voice Coach**: Click \"Talk to Voice Coach\" on any page
3. **Two Modes Available**:
   - **Listen Mode**: Select cards to hear AI summaries
   - **Chat Mode**: Ask questions via voice or text

### Voice Commands

- \"Play Nutrition card\" - Switches to listen mode and plays nutrition content
- \"Tell me about my medications\" - Asks about medications from user profile
- \"What should I do today?\" - Gets daily plan recommendations
- \"Help\" - Shows available commands and features

## Technical Features

### Real-time Communication

- **WebSocket Protocol**: Low-latency bidirectional communication
- **Streaming ASR**: Real-time speech recognition with interim results
- **Chunked TTS**: Efficient audio delivery in small chunks
- **Barge-in Support**: Stop playback when user starts speaking

### Grounded AI Responses

1. **Priority Order**:
   - User's personalized dashboard content
   - User's health profile and intake form
   - Vetted knowledge base (mini-KB)
   - Safe model fallback

2. **Safety Features**:
   - No medical diagnosis or treatment advice
   - Emergency intent detection and handoff
   - Educational disclaimers
   - Input validation and rate limiting

### Audio Processing

- **Input**: 16kHz PCM audio, noise suppression enabled
- **Output**: MP3 format, configurable voice (Deepgram Aura)
- **Caching**: Intelligent TTS caching based on content hash
- **Playback**: Variable speed (0.75x, 1x, 1.25x), volume control

## Performance Targets

- **Response Latency**: ≤2.0s from speech end to audio start (p95)
- **Barge-in Response**: ≤150ms to stop playback
- **Grounded Responses**: ≥90% from user data (not fallback)
- **Cache Hit Rate**: ≥80% for frequently accessed cards

## Security Considerations

### Data Protection
- **TLS End-to-End**: All communications encrypted
- **PHI Minimization**: Raw audio not stored by default
- **Session Isolation**: Each user session is isolated
- **Rate Limiting**: Prevents abuse of voice endpoints

### Safety Measures
- **Input Validation**: All user inputs validated and sanitized
- **Emergency Detection**: Recognizes urgent medical situations
- **Disclaimer System**: Clear educational-only messaging
- **Content Filtering**: Inappropriate content detection

## Monitoring and Analytics

### Key Metrics
- Session duration and completion rates
- Response latency by component (ASR, AI, TTS)
- Cache performance and storage usage
- Error rates and failure points
- User engagement patterns

### Logging
- Structured logging with correlation IDs
- Performance metrics collection
- Error tracking with stack traces
- User interaction analytics (privacy-compliant)

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**:
   - Guide users to enable permissions in browser settings
   - Provide fallback to text-only mode

2. **WebSocket Connection Failed**:
   - Check CORS configuration
   - Verify WebSocket endpoint accessibility
   - Check firewall/proxy settings

3. **Audio Playback Issues**:
   - Verify browser audio autoplay policies
   - Check audio codec support
   - Test with different browsers

4. **Slow Response Times**:
   - Monitor Deepgram API latency
   - Check OpenAI API performance
   - Verify database query performance

### Debug Mode

Enable debug logging:
```env
NEXT_PUBLIC_DEBUG_VOICE=true
LOG_LEVEL=debug
```

## Future Enhancements

### Planned Features
- **Multiple Languages**: Support for Arabic and other languages
- **Advanced Avatar**: HeyGen integration for lip-sync
- **Voice Settings**: Custom voice selection and speed preferences
- **Conversation Memory**: Multi-turn conversation context
- **Voice Analytics**: Advanced usage insights

### Integration Opportunities
- **Healthcare Provider Dashboard**: Provider access to patient interactions
- **EHR Integration**: Connect with electronic health records
- **Wearable Data**: Incorporate fitness tracker data
- **Medication Reminders**: Voice-based medication alerts

## API Reference

### Voice Session Management

```typescript
// Create new voice session
POST /api/voice/session
Body: { user_id: number, lang?: string }
Response: { session_id: string, success: boolean }

// Get user's available cards
GET /api/voice/cards/:user_id
Response: { cards: VoiceCard[], user_context: object }

// Generate card summary
POST /api/voice/summarize-card
Body: { user_id: number, card_id: string }
Response: { audio_url: string, script_text: string, duration_ms: number }
```

### WebSocket Communication

```typescript
// Initialize session
send({ type: 'init_session', user_id: number, session_id: string })

// Start/stop listening
send({ type: 'start_listening' })
send({ type: 'stop_listening' })

// Send text input
send({ type: 'text_input', text: string })

// Audio streaming
send({ type: 'audio_chunk', audio: string }) // base64

// Barge-in (interrupt)
send({ type: 'barge_in' })
```

## Deployment Notes

### Production Considerations
- **Audio Storage**: Use cloud storage (S3, GCS) instead of base64
- **CDN**: Serve cached audio files via CDN
- **Load Balancing**: WebSocket sticky sessions required
- **Monitoring**: Set up comprehensive monitoring and alerting
- **Backup**: Regular database backups including voice data

### Environment Variables
See `.env.example` files for complete configuration options.

---

**Note**: This Voice Coach feature integrates seamlessly with the existing AI-Based Patient Education platform, maintaining all current functionality while adding powerful voice interaction capabilities.
", "original_text": "", "file_path": "d:\\AI Based Education\\VOICE_COACH_README.md"}