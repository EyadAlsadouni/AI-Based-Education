# WebRTC Voice Coach Setup

This document explains how to configure the WebRTC transport for the Voice Coach to resolve multiple questions/answers issues.

## Environment Configuration

### Frontend Configuration

Create a `.env.local` file in the `frontend/` directory with the following content:

```bash
# Voice Coach Transport Configuration
# Set to 'webrtc' for WebRTC transport or 'websocket' for WebSocket transport
NEXT_PUBLIC_VC_TRANSPORT=webrtc

# Optional TURN server configuration for NAT traversal
# Uncomment and configure if users are behind strict NAT
# NEXT_PUBLIC_TURN_URL=turn:your-turn-server.com:3478
# NEXT_PUBLIC_TURN_USERNAME=your-username
# NEXT_PUBLIC_TURN_CREDENTIAL=your-credential

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:6001/api
```

### Backend Configuration

Ensure your backend `.env` file has the OpenAI API key:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install node-fetch
```

### 2. Create Frontend Environment File

Create `frontend/.env.local` with the content shown above.

### 3. Start the Servers

```bash
# Backend (in one terminal)
cd backend
npm start

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Transport Options

### WebRTC (Recommended)
- **Advantages**: More stable for multiple consecutive questions, better audio quality, reduced server load
- **Configuration**: Set `NEXT_PUBLIC_VC_TRANSPORT=webrtc`
- **Requirements**: Modern browser with WebRTC support

### WebSocket (Fallback)
- **Advantages**: Works with older browsers, simpler setup
- **Configuration**: Set `NEXT_PUBLIC_VC_TRANSPORT=websocket`
- **Note**: May experience issues with multiple consecutive questions

## Testing

1. Navigate to the Voice Coach page
2. Test multiple consecutive voice questions
3. The WebRTC implementation should handle multiple questions without the "multiple answers" error

## Troubleshooting

### WebRTC Connection Issues
- Check browser console for WebRTC errors
- Ensure microphone permissions are granted
- For users behind strict NAT, configure TURN server

### Fallback to WebSocket
- If WebRTC fails, change `NEXT_PUBLIC_VC_TRANSPORT=websocket` in `.env.local`
- Restart the frontend development server

## Implementation Details

The WebRTC implementation:
- Uses direct audio tracks instead of PCM16 encoding
- Implements server-side VAD for automatic speech detection
- Maintains the same UI/UX as the WebSocket version
- Provides better stability for multiple voice interactions

## Files Modified

- `backend/routes/voice.js` - Added WebRTC SDP exchange endpoint
- `frontend/lib/useOpenAIRealtime.ts` - Added WebRTC transport support
- `frontend/.env.local` - Environment configuration (create this file)