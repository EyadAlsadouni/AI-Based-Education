# AI-Based Patient Education Platform

A comprehensive multi-step health education platform that provides personalized educational content based on user's specific health conditions and needs.

## Project Overview

This platform guides users through a structured assessment process to understand their health goals and current knowledge level, then generates personalized educational content using AI. The system supports voice interactions and provides both text and audio-based learning experiences.

## Project Structure

```
├── backend/          # Node.js Express API server
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic services
│   └── database.sqlite # SQLite database
├── frontend/         # Next.js React application
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and API client
│   └── types/        # TypeScript type definitions
└── README.md         # This file
```

## Key Features

### Multi-Step Assessment Flow
- **Step 1**: Personal information and health goal selection
- **Step 2**: Dynamic condition selection based on health goals
- **Step 3**: Knowledge assessment - What you already know
- **Step 4**: Goal setting and learning preferences - What you want to learn
- **Dashboard**: Personalized educational cards generated from your answers

### AI-Powered Content Generation
- **Smart Card Generation**: 2-6 personalized cards based on user goals and knowledge gaps
- **Your Question Answered**: Optional custom question card appears first if provided in Step 4
- **Intelligent Filtering**: Excludes topics user already knows (from Step 3), includes what they want to learn (from Step 4)
- **Medical References**: Credible sources included in all content
- **Safety Measures**: Medical advice prevention and validation
- **Voice Integration**: Text-to-speech for all educational content
- **PDF Export**: Download dashboard as PDF with all card content

### Voice Features
- **Dashboard Card Reading**: Microphone icons for voice reading with TTS caching
- **Dashboard Voice Agent**: Context-aware AI assistant with:
  - Push-to-talk voice input
  - Text input with quick suggestion chips
  - Understands current card content
  - Answers health-related questions only
  - "Ask AI Assistant" tooltip for better UX
- **Audio Management**: AudioManager singleton prevents overlapping audio
- **English-Only**: Enforced language consistency

## Supported Health Categories

### Education About the Condition
- Diabetes (💉)
- Heart & Blood Pressure (❤️)
- Respiratory (Asthma/COPD) (🫁)
- Digestive / Gut Health (🥗)

### Preparing for a Procedure
- Endoscopy / Colonoscopy (🔍)
- Day Surgery (Outpatient) (🏥)
- Imaging (CT/MRI/X-ray) (📷)
- Dental Procedure / Extraction

### How to Use My Medication
- Inhalers (Asthma/COPD)
- Insulin & Diabetes Medicines
- Blood-Pressure Medicines
- Cholesterol Medicines (Statins)

### Psychological Health
- Anxiety & Panic
- Depression
- Stress & Coping
- Sleep Health

## Dashboard Cards

The platform intelligently generates 2-6 personalized educational cards based on:

### Smart Card Selection
- **Your Question** (if provided): Custom question from Step 4 appears first
- **Goal-Aligned Cards**: Cards matching what user wants to learn (Step 4 goals)
- **Knowledge Gap Cards**: Topics user doesn't already know (excludes Step 3 interests)
- **Priority-Based**: High-priority cards selected first
- **Smart Limiting**: Card count adjusts based on number of goals selected

### Available Card Types (Condition-Specific)
Examples include:
- Diagnosis basics and symptoms
- Medication management
- Nutrition and diet guidance
- Exercise and physical activity
- Daily routine planning
- Pre-procedure preparation
- Post-procedure recovery
- Mental health coping strategies
- And 20+ more condition-specific topics

### Card Features
- Expandable content with detailed information
- Medical references from credible sources
- Voice reading with play/pause controls
- Formatted text with bold emphasis
- PDF export capability

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Database**: SQLite 5.1.7
- **AI Integration**: OpenAI GPT-4o (parallel generation)
- **Voice**: OpenAI Realtime API
- **WebSocket**: ws 8.14.2 for real-time communication

### Frontend
- **Framework**: Next.js 15.5.2
- **UI Library**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks + localStorage persistence
- **API Client**: Axios 1.11.0
- **PDF Generation**: jsPDF + html2canvas

### Voice & Audio
- **Audio Processing**: Web Audio API, AudioWorklet (PCM16 16kHz)
- **Voice Synthesis**: OpenAI TTS API with caching
- **Real-time Voice**: OpenAI Realtime API (24kHz audio output)
- **Audio Management**: Custom AudioManager singleton
- **Context Injection**: Auto-injects dashboard data into AI conversations

## User Workflow

### Complete Journey
1. **Step 1**: Enter personal info (name, age, gender) and select health goal
2. **Step 2**: Choose specific condition (16+ options based on health goal)
3. **Step 3**: Answer "what you already know" questions (knowledge assessment)
4. **Step 4**: Select "what you want to learn" goals and preferences, optionally ask a custom question
5. **Create Dashboard**: AI generates 2-6 personalized cards (includes custom question if provided)
6. **Dashboard Experience**:
   - Read personalized educational cards
   - Listen to card content with voice reading
   - Ask follow-up questions via voice agent
   - Download PDF of complete content

### Dashboard Features
- **Smart Cards**: Only shows what you want to learn (excludes what you know)
- **Voice Reading**: Click microphone on any card to hear it read aloud
- **Voice Agent**: Ask AI assistant questions about your cards or condition
- **PDF Export**: Download all content for offline reference
- **Regenerate**: Refresh content if needed

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

### Backend Setup
```bash
cd backend
npm install
# Set your OpenAI API key
export OPENAI_API_KEY=your_api_key_here
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create a `.env` file in the backend directory:
```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_PATH=database.sqlite
```

## Database Schema

### Users Table
- Basic user information (name, age, gender, health_goals)

### User Sessions Table
- `user_id`, `condition_selected`, `diagnosis_year`
- `takes_medication`, `medications`, `checks_vitals`
- `main_goal`, `main_question`
- `knowledge_level`, `main_interests`, `learning_style`, `other_knowledge`
- `ai_response` (JSON string of generated dashboard content)

### Dashboard Content Table
- Cached AI-generated card content
- Reduces redundant API calls

### Voice Sessions & Turns Tables
- Voice interaction session management
- Complete conversation transcripts

### TTS Cache Table
- Cached audio files for card reading
- Reduces API calls and improves performance

## Key Features Implemented

### ✅ Dynamic Step Flow
- Step 2 options change based on Step 1 selection
- Step 3 questions are condition-specific
- Step 4 goals are personalized based on previous answers

### ✅ Form Data Persistence
- localStorage for client-side persistence
- Database storage for user sessions
- Proper data validation and error handling

### ✅ Smart AI-Powered Content Generation
- **Smart Card Selection**: 2-6 cards based on goals and knowledge gaps
- **Parallel Generation**: All cards generated simultaneously with GPT-4o
- **Content Caching**: Generated once in Step 4, loaded from database on dashboard
- **Custom Question Support**: Dedicated card for user's specific question
- **Medical References**: Credible sources integrated
- **Safety Guidelines**: Medical advice prevention

### ✅ Advanced Voice Integration
- **Dashboard Card Reading**: TTS with caching for faster playback
- **Dashboard Voice Agent**: Context-aware AI assistant
  - Push-to-talk and text input
  - Auto-injects current card content
  - Answers health-related questions
  - Quick suggestion chips for common queries
- **Audio Management**: Singleton prevents overlapping audio
- **Real-time Processing**: OpenAI Realtime API for low-latency voice

### ✅ User Experience Enhancements
- **Clear Step Differentiation**: Step 3 (what you know) vs Step 4 (what you want to learn)
- **Optional Fields**: Custom question in Step 4 is optional
- **Smart Card Limiting**: Prevents overwhelming users with too many cards
- **PDF Export**: Download complete dashboard with all card content
- **Tooltip UX**: "Ask AI Assistant" tooltip on voice agent
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Graceful degradation and user-friendly messages

## Recent Improvements

### Smart Card Generation System (Latest)
- **Problem**: Generated fixed 4 cards regardless of user needs
- **Solution**: 
  - Dynamic card count (2-6) based on goals selected
  - Intelligent filtering: excludes Step 3 topics, includes Step 4 goals
  - "Your Question" card for custom user questions
  - Smart limiting based on goal count
- **Result**: Truly personalized dashboard with relevant content only

### Content Generation Optimization
- **Problem**: Slow dashboard generation and redundant API calls
- **Solution**:
  - Generate content once in Step 4, cache in database
  - Parallel AI generation for all cards (GPT-4o)
  - Load from cache on dashboard page
- **Result**: 5x faster dashboard loading, reduced API costs

### Dashboard Voice Agent
- **Problem**: Voice coach page felt disconnected from dashboard
- **Solution**:
  - Removed standalone voice coach page
  - Enhanced dashboard voice agent with context injection
  - Auto-injects current card content into conversations
  - Added "Ask AI Assistant" tooltip
- **Result**: Seamless, context-aware voice assistance

### PDF Export Feature
- **Problem**: No way to save personalized content
- **Solution**: PDF export with all card content and formatting
- **Result**: Users can download and reference their personalized content offline

### Step 3 & 4 Differentiation
- **Problem**: Overlapping questions between Step 3 and Step 4
- **Solution**: Step 3 = what you know, Step 4 = what you want to learn
- **Result**: Clear purpose distinction, better AI card selection

## Development Status

- ✅ Multi-step form flow (Steps 1-4) working correctly
- ✅ Smart card generation (2-6 cards based on goals and knowledge gaps)
- ✅ AI-generated personalized dashboard content with GPT-4o
- ✅ Content caching for faster dashboard loading
- ✅ "Your Question" card for custom user questions
- ✅ Dashboard voice agent with context injection
- ✅ Voice reading with TTS caching
- ✅ PDF export functionality
- ✅ Database schema supports all features
- ✅ Form validation and error handling
- ✅ Medical safety measures in place
- ✅ Responsive design and UX enhancements

## Future Development

1. **Enhanced Analytics**: Track user engagement and content effectiveness
2. **Progress Tracking**: Monitor user progress through educational materials
3. **Content Versioning**: Allow users to regenerate content with updated AI models
4. **Multi-language Support**: Expand beyond English-only
5. **Mobile App**: Native mobile application
6. **Advanced Accessibility**: Screen reader optimization, keyboard navigation
7. **User Accounts**: Save multiple sessions, track history
8. **Notification System**: Reminders for medication, appointments, etc.

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

Private project - All rights reserved.