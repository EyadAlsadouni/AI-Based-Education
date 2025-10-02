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
- **Step 3**: Learning needs discovery (knowledge assessment)
- **Step 4**: Goal setting and learning preferences

### AI-Powered Content Generation
- **Personalized Dashboard**: 4 educational cards tailored to user's condition
- **Medical References**: Credible sources included in all content
- **Safety Measures**: Medical advice prevention and validation
- **Voice Integration**: Text-to-speech for all educational content

### Voice Features
- **Dashboard Card Reading**: Microphone icons for voice reading
- **Voice Coach**: Push-to-talk voice interaction system
- **Audio Management**: Consistent audio handling across the platform
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

The platform generates 4 personalized educational cards:

1. **Diagnosis Basics**: Core knowledge about the user's condition
2. **Nutrition and Carbs**: Dietary guidance specific to their condition
3. **Workout**: Safe exercise recommendations for their condition
4. **Plan Your Day**: Daily management checklist and tips

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **AI Integration**: OpenAI GPT-4
- **Voice**: OpenAI Realtime API

### Frontend
- **Framework**: Next.js 15.5.2
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks + localStorage
- **API Client**: Axios

### Voice & Audio
- **Audio Processing**: Web Audio API, AudioWorklet
- **Voice Synthesis**: OpenAI TTS
- **Audio Management**: Custom AudioManager singleton

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

## Recent Improvements

### Step 3 & 4 Differentiation
- **Problem**: Overlapping questions between Step 3 and Step 4
- **Solution**: Made Step 3 assessment-focused, Step 4 achievement-focused
- **Result**: Clear purpose distinction across all 16 conditions

### Form Validation & UX
- **Problem**: Generic questions and poor user experience
- **Solution**: Personalized, condition-specific questions with clear indicators
- **Result**: Better user flow and more relevant content

### Voice System Stabilization
- **Problem**: Audio playback issues and voice inconsistencies
- **Solution**: AudioManager singleton, proper buffer management, English-only enforcement
- **Result**: Reliable voice interactions with consistent quality

## Development Status

- ✅ Multi-step form flow working correctly
- ✅ Dynamic content based on user selections
- ✅ AI-generated personalized dashboard content
- ✅ Voice reading and voice coach functionality
- ✅ Database schema supports all required fields
- ✅ Form validation and error handling
- ✅ Medical safety measures in place

## Future Development

1. **Enhanced Personalization**: More granular content based on user responses
2. **Progress Tracking**: User progress through educational content
3. **Content Updates**: Regular updates to AI-generated content
4. **Analytics**: User engagement and content effectiveness metrics
5. **Mobile Optimization**: Enhanced mobile experience
6. **Accessibility**: Improved accessibility features

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

Private project - All rights reserved.