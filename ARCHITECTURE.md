# AI-Based Patient Education Platform - System Architecture

## Complete Architecture Diagram

```mermaid
graph TB
    subgraph "User Interface Layer"
        User[👤 User/Patient]
        Browser[🌐 Web Browser]
        
        subgraph "Frontend - Next.js 15.5.2 TypeScript"
            subgraph "Pages App Router"
                LandingPage[Landing Page<br/>app/page.tsx]
                Step1Page[Step 1: Personal Info<br/>app/step-1/page.tsx]
                Step2Page[Step 2: Condition Selection<br/>app/step-2/page.tsx]
                Step3Page[Step 3: Knowledge Assessment<br/>app/step-3/page.tsx]
                Step4Page[Step 4: Goals & Preferences<br/>app/step-4/page.tsx]
                DashboardPage[Dashboard<br/>app/dashboard/page.tsx]
                VoiceCoachPage[Voice Coach<br/>app/voice-coach/page.tsx]
            end
            
            subgraph "UI Components"
                Step1Comp[Step1.tsx<br/>Personal form]
                Step2Comp[Step2.tsx<br/>Condition grid]
                Step3Comp[Step3.tsx<br/>Assessment form]
                Step4Comp[Step4.tsx<br/>Goals form]
                DashboardComp[Dashboard.tsx<br/>Dynamic cards]
                VoiceCoachComp[VoiceCoachInterface.tsx<br/>Push-to-talk UI]
                DashboardVoiceAgent[DashboardVoiceAgent.tsx<br/>FAB + Pop-up Voice Agent]
                AvatarLoop[AvatarLoop.tsx<br/>Animated avatar]
                BoldTextRenderer[BoldTextRenderer.tsx<br/>Formatted text]
            end
            
            subgraph "Business Logic Libraries"
                API[api.ts<br/>API client Axios]
                AudioManager[useAudioManager.ts<br/>Audio singleton]
                VoiceWebSocket[useVoiceWebSocket.ts<br/>WebSocket hook]
                OpenAIRealtime[useOpenAIRealtime.ts<br/>Realtime API hook]
                DashboardCards[dashboardCards.ts<br/>Dynamic card generator]
                Utils[utils.ts<br/>Helper functions]
            end
            
            subgraph "State Management"
                LocalStorage[localStorage<br/>Form persistence]
                ReactState[React Hooks<br/>Component state]
            end
        end
    end
    
    subgraph "Backend Layer - Node.js Express"
        subgraph "API Server - Express 5.1.0"
            ServerJS[server.js<br/>HTTP + WebSocket Server]
            
            subgraph "REST API Routes"
                UserRoutes[users.js<br/>/api/users]
                ConditionRoutes[conditions.js<br/>/api/conditions]
                MedicationRoutes[medications.js<br/>/api/medications]
                AIRoutes[ai.js<br/>/api/ai]
                VoiceRoutes[voice.js<br/>/api/voice]
            end
            
            subgraph "Services"
                OpenAIRealtimeService[OpenAIRealtimeService.js<br/>Realtime voice processing]
            end
            
            subgraph "WebSocket Server"
                WSS[WebSocket Server<br/>ws://localhost:6001/api/voice/chat]
            end
        end
        
        subgraph "Database Layer - SQLite"
            DB[(database.sqlite)]
            
            subgraph "Tables"
                UsersTable[users<br/>User profiles]
                SessionsTable[user_sessions<br/>Step data + AI response]
                ConditionsTable[conditions<br/>Available conditions]
                MedicationsTable[medications<br/>Medication list]
                VoiceSessionsTable[voice_sessions<br/>Voice chat sessions]
                VoiceTurnsTable[voice_turns<br/>Chat transcript]
                TTSCacheTable[tts_cache<br/>Audio cache]
                MiniKBTable[mini_kb<br/>Knowledge base]
                DashboardContentTable[dashboard_content<br/>Generated cards]
            end
        end
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        
        subgraph "OpenAI Features"
            GPT4[GPT-4<br/>Content generation]
            RealtimeAPI[Realtime API<br/>Voice-to-voice]
            TTSAPI[TTS API<br/>Text-to-speech]
        end
    end
    
    subgraph "Browser APIs"
        WebAudioAPI[Web Audio API<br/>Audio processing]
        AudioWorklet[AudioWorklet<br/>PCM16 processing]
        MediaDevices[MediaDevices API<br/>Microphone access]
    end
    
    %% User Journey Flow
    User -->|Navigates| Browser
    Browser -->|Loads| LandingPage
    LandingPage -->|Start| Step1Page
    Step1Page -->|Uses| Step1Comp
    Step1Page -->|Next| Step2Page
    Step2Page -->|Uses| Step2Comp
    Step2Page -->|Next| Step3Page
    Step3Page -->|Uses| Step3Comp
    Step3Page -->|Next| Step4Page
    Step4Page -->|Uses| Step4Comp
    Step4Page -->|Complete| DashboardPage
    DashboardPage -->|Uses| DashboardComp
    DashboardPage -->|Opens| DashboardVoiceAgent
    DashboardPage -->|Navigate to| VoiceCoachPage
    VoiceCoachPage -->|Uses| VoiceCoachComp
    
    %% Component Dependencies
    Step1Comp -->|Saves to| LocalStorage
    Step2Comp -->|Saves to| LocalStorage
    Step3Comp -->|Saves to| LocalStorage
    Step4Comp -->|Saves to| LocalStorage
    DashboardComp -->|Loads from| LocalStorage
    DashboardComp -->|Uses| DashboardCards
    DashboardComp -->|Plays audio| AudioManager
    DashboardComp -->|Voice Agent| DashboardVoiceAgent
    VoiceCoachComp -->|Uses| OpenAIRealtime
    VoiceCoachComp -->|Uses| AvatarLoop
    VoiceCoachComp -->|Uses| BoldTextRenderer
    DashboardVoiceAgent -->|Uses| OpenAIRealtime
    DashboardVoiceAgent -->|Uses| AudioManager
    
    %% API Communication
    Step1Comp -->|POST| API
    Step4Comp -->|POST| API
    DashboardComp -->|GET/POST| API
    API -->|HTTP REST| UserRoutes
    API -->|HTTP REST| ConditionRoutes
    API -->|HTTP REST| MedicationRoutes
    API -->|HTTP REST| AIRoutes
    API -->|HTTP REST| VoiceRoutes
    
    %% WebSocket Communication
    VoiceCoachComp -->|WebSocket| VoiceWebSocket
    DashboardVoiceAgent -->|WebSocket| VoiceWebSocket
    VoiceWebSocket -.->|wss://| WSS
    OpenAIRealtime -->|Uses| VoiceWebSocket
    
    %% Voice Processing Flow
    VoiceCoachComp -->|Captures| MediaDevices
    MediaDevices -->|Audio Stream| AudioWorklet
    AudioWorklet -->|PCM16| OpenAIRealtime
    OpenAIRealtime -->|Processes| WebAudioAPI
    WebAudioAPI -->|Plays| AudioManager
    
    %% Backend Routes to Database
    UserRoutes -->|CRUD| UsersTable
    UserRoutes -->|CRUD| SessionsTable
    ConditionRoutes -->|READ| ConditionsTable
    MedicationRoutes -->|READ| MedicationsTable
    AIRoutes -->|CRUD| SessionsTable
    AIRoutes -->|CRUD| DashboardContentTable
    VoiceRoutes -->|CRUD| VoiceSessionsTable
    VoiceRoutes -->|CRUD| VoiceTurnsTable
    VoiceRoutes -->|CRUD| TTSCacheTable
    
    %% Database Structure
    DB -->|Contains| UsersTable
    DB -->|Contains| SessionsTable
    DB -->|Contains| ConditionsTable
    DB -->|Contains| MedicationsTable
    DB -->|Contains| VoiceSessionsTable
    DB -->|Contains| VoiceTurnsTable
    DB -->|Contains| TTSCacheTable
    DB -->|Contains| MiniKBTable
    DB -->|Contains| DashboardContentTable
    
    %% OpenAI Integration
    AIRoutes -->|Generates| GPT4
    VoiceRoutes -->|TTS| TTSAPI
    WSS -->|Proxy| RealtimeAPI
    OpenAIRealtimeService -->|Uses| RealtimeAPI
    
    %% Server Initialization
    ServerJS -->|Initializes| DB
    ServerJS -->|Mounts| UserRoutes
    ServerJS -->|Mounts| ConditionRoutes
    ServerJS -->|Mounts| MedicationRoutes
    ServerJS -->|Mounts| AIRoutes
    ServerJS -->|Mounts| VoiceRoutes
    ServerJS -->|Creates| WSS
    
    %% Styling
    classDef frontend fill:#3b82f6,stroke:#1e40af,stroke-width:2px,color:#fff
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef database fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef external fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    classDef browser fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff
    
    class Step1Page,Step2Page,Step3Page,Step4Page,DashboardPage,VoiceCoachPage,Step1Comp,Step2Comp,Step3Comp,Step4Comp,DashboardComp,VoiceCoachComp,DashboardVoiceAgent,AvatarLoop,BoldTextRenderer,API,AudioManager,VoiceWebSocket,OpenAIRealtime,DashboardCards,Utils,LocalStorage,ReactState frontend
    class ServerJS,UserRoutes,ConditionRoutes,MedicationRoutes,AIRoutes,VoiceRoutes,OpenAIRealtimeService,WSS backend
    class DB,UsersTable,SessionsTable,ConditionsTable,MedicationsTable,VoiceSessionsTable,VoiceTurnsTable,TTSCacheTable,MiniKBTable,DashboardContentTable database
    class OpenAI,GPT4,RealtimeAPI,TTSAPI external
    class Browser,WebAudioAPI,AudioWorklet,MediaDevices browser
```

## Data Flow Diagrams

### 1. User Journey Flow (Steps 1-4 → Dashboard)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant LocalStorage
    participant Backend
    participant Database
    participant OpenAI
    
    User->>Frontend: Navigate to Step 1
    User->>Frontend: Fill personal info + health goal
    Frontend->>LocalStorage: Save form data
    
    User->>Frontend: Navigate to Step 2
    Frontend->>Backend: GET /api/conditions
    Backend->>Database: Query conditions
    Database-->>Backend: Return conditions
    Backend-->>Frontend: Condition list
    User->>Frontend: Select condition
    Frontend->>LocalStorage: Save selection
    
    User->>Frontend: Navigate to Step 3
    User->>Frontend: Answer knowledge assessment
    Frontend->>LocalStorage: Save answers
    
    User->>Frontend: Navigate to Step 4
    User->>Frontend: Set goals + preferences
    Frontend->>LocalStorage: Save preferences
    Frontend->>Backend: POST /api/users (create session)
    Backend->>Database: INSERT user + session
    Database-->>Backend: Session ID
    Backend-->>Frontend: Session created
    
    User->>Frontend: Navigate to Dashboard
    Frontend->>LocalStorage: Load all step data
    Frontend->>Backend: GET /api/users/:id/session
    Backend->>Database: Query session
    Database-->>Backend: Session data
    Backend-->>Frontend: User session
    
    Frontend->>Frontend: Generate dynamic cards
    Note over Frontend: dashboardCards.ts<br/>analyzes user context<br/>selects 2-5 relevant cards
    
    User->>Frontend: Click "Generate Content"
    Frontend->>Backend: POST /api/ai/generate-dashboard
    Backend->>OpenAI: GPT-4 API call<br/>(25+ card-specific prompts)
    OpenAI-->>Backend: Personalized content + references
    Backend->>Database: UPDATE session with ai_response
    Backend-->>Frontend: Dashboard content
    Frontend->>Frontend: Display cards
    
    User->>Frontend: Click card to read
    Frontend->>Frontend: Show expanded content
```

### 2. Voice Coach Interaction Flow (Push-to-Talk)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AudioWorklet
    participant WebSocket
    participant Backend
    participant OpenAI
    
    User->>Frontend: Navigate to Voice Coach
    Frontend->>Frontend: Initialize OpenAI Realtime hook
    Frontend->>Backend: Connect WebSocket
    Backend->>OpenAI: Create ephemeral session
    OpenAI-->>Backend: Session token
    Backend-->>Frontend: Connection established
    
    User->>Frontend: Click mic button (start)
    Frontend->>Browser: Request microphone
    Browser-->>Frontend: Audio stream granted
    Frontend->>AudioWorklet: Create worklet (16kHz PCM16)
    Note over Frontend,AudioWorklet: Processes audio in 20ms chunks
    
    loop Recording
        AudioWorklet->>Frontend: Audio chunk (Base64)
        Frontend->>WebSocket: Send audio chunk
        WebSocket->>Backend: Forward to OpenAI
        Backend->>OpenAI: Append to input buffer
    end
    
    User->>Frontend: Click mic button (stop)
    Frontend->>AudioWorklet: Stop recording
    Frontend->>WebSocket: Commit buffer
    Backend->>OpenAI: Create response
    
    Note over OpenAI: Transcribe speech<br/>Generate response<br/>Synthesize voice (TTS)
    
    loop Streaming Response
        OpenAI-->>Backend: Audio chunks (24kHz PCM16)
        Backend-->>WebSocket: Forward chunks
        WebSocket-->>Frontend: Receive chunks
        Frontend->>WebAudioAPI: Play audio
    end
    
    OpenAI-->>Backend: Transcript + response text
    Backend-->>Frontend: Message complete
    Frontend->>Frontend: Display transcript in chat
    Frontend->>Frontend: Show assistant message
```

### 3. Dashboard Voice Agent Pop-up Flow

```mermaid
sequenceDiagram
    participant User
    participant DashboardPage
    participant VoiceAgent
    participant WebSocket
    participant Backend
    participant OpenAI
    
    User->>DashboardPage: View dashboard cards
    DashboardPage->>VoiceAgent: Render FAB (floating button)
    
    User->>VoiceAgent: Click FAB
    VoiceAgent->>VoiceAgent: Open pop-up window (600x600)
    VoiceAgent->>Backend: Connect WebSocket
    Backend->>OpenAI: Create session with topic filter
    Note over Backend,OpenAI: Context: user's condition,<br/>health goal, dashboard cards
    
    User->>VoiceAgent: Click suggestion chip
    VoiceAgent->>VoiceAgent: Prefill input field
    User->>VoiceAgent: Click send button
    
    VoiceAgent->>WebSocket: Send text message
    Backend->>OpenAI: Process with topic filter
    Note over OpenAI: Only answers dashboard-related<br/>questions + small talk.<br/>Redirects unrelated topics.
    
    OpenAI-->>Backend: Response text
    Backend-->>VoiceAgent: Display response
    VoiceAgent->>VoiceAgent: Add to chat transcript
    
    alt Voice Response
        VoiceAgent->>Backend: Request TTS
        Backend->>OpenAI: Generate audio
        OpenAI-->>Backend: Audio file
        Backend-->>VoiceAgent: Audio URL
        VoiceAgent->>AudioManager: Play audio
    end
    
    User->>VoiceAgent: Click mic button (push-to-talk)
    Note over User,OpenAI: Same flow as Voice Coach<br/>but with topic filtering
    
    User->>VoiceAgent: Click close button
    VoiceAgent->>Backend: Disconnect WebSocket
    VoiceAgent->>VoiceAgent: Close pop-up
```

### 4. Dynamic Dashboard Content Generation Flow

```mermaid
flowchart TB
    Start([User Completes Step 4]) --> LoadSession[Load User Session Data]
    
    LoadSession --> Analyze[Analyze User Context]
    
    subgraph "Context Analysis - dashboardCards.ts"
        Analyze --> CheckGoal{Health Goal?}
        CheckGoal -->|Medication| MedCards[7 Medication Card Types]
        CheckGoal -->|Procedure| ProcCards[5 Procedure Card Types]
        CheckGoal -->|Mental Health| MentalCards[8 Mental Health Card Types]
        CheckGoal -->|Education| EduCards[7 Education Card Types]
        
        MedCards --> CheckInterests{User Interests?}
        ProcCards --> CheckInterests
        MentalCards --> CheckInterests
        EduCards --> CheckInterests
        
        CheckInterests -->|Technique| AddTechCard[Add Technique Card - Priority 1]
        CheckInterests -->|Safety| AddSafetyCard[Add Safety Card - Priority 2]
        CheckInterests -->|Monitoring| AddMonitorCard[Add Monitoring Card - Priority 3]
        CheckInterests -->|Daily Plan| AddPlanCard[Add Daily Plan Card - Priority 4]
        
        AddTechCard --> CheckStyle{Learning Style?}
        AddSafetyCard --> CheckStyle
        AddMonitorCard --> CheckStyle
        AddPlanCard --> CheckStyle
        
        CheckStyle -->|Videos| VideoCards[Cards with YouTube links]
        CheckStyle -->|Step-by-step| DetailedCards[Detailed instructions]
        CheckStyle -->|Quick tips| ConciseCards[Concise info]
        
        VideoCards --> LimitCards[Limit to 5 cards max]
        DetailedCards --> LimitCards
        ConciseCards --> LimitCards
    end
    
    LimitCards --> SortPriority[Sort by Priority 1-5]
    SortPriority --> GenerateList[Generate Dynamic Card List]
    
    GenerateList --> SendToBackend[Send to Backend with User Context]
    
    subgraph "Backend AI Generation - ai.js"
        SendToBackend --> SelectPrompts[Select Card-Specific Prompts]
        SelectPrompts --> Loop{For Each Card}
        
        Loop -->|Card 1| Prompt1[Generate Prompt<br/>Include context + learning style]
        Loop -->|Card 2| Prompt2[Generate Prompt<br/>Include context + learning style]
        Loop -->|Card 3| Prompt3[Generate Prompt<br/>Include context + learning style]
        Loop -->|Card 4| Prompt4[Generate Prompt<br/>Include context + learning style]
        Loop -->|Card 5| Prompt5[Generate Prompt<br/>Include context + learning style]
        
        Prompt1 --> CallGPT4[Call GPT-4 API]
        Prompt2 --> CallGPT4
        Prompt3 --> CallGPT4
        Prompt4 --> CallGPT4
        Prompt5 --> CallGPT4
        
        CallGPT4 --> ParseContent[Parse Content + References]
        ParseContent --> BuildResponse[Build Dashboard Object]
    end
    
    BuildResponse --> SaveDB[(Save to Database)]
    SaveDB --> SendToFrontend[Send to Frontend]
    
    SendToFrontend --> DisplayCards[Display Personalized Cards]
    DisplayCards --> End([User Views Content])
    
    style Start fill:#3b82f6,stroke:#1e40af,color:#fff
    style End fill:#10b981,stroke:#047857,color:#fff
    style Analyze fill:#f59e0b,stroke:#d97706,color:#fff
    style CallGPT4 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style SaveDB fill:#f59e0b,stroke:#d97706,color:#fff
```

## Technology Stack Details

```mermaid
graph LR
    subgraph "Frontend Stack"
        NextJS[Next.js 15.5.2]
        React[React 19.1.0]
        TypeScript[TypeScript 5]
        Tailwind[Tailwind CSS 4]
        Axios[Axios 1.11.0]
        Lucide[Lucide React Icons]
        ReactHookForm[React Hook Form]
        Zod[Zod Validation]
    end
    
    subgraph "Backend Stack"
        NodeJS[Node.js]
        Express[Express 5.1.0]
        SQLite[SQLite 5.1.7]
        WS[ws WebSocket 8.14.2]
        Dotenv[dotenv 17.2.2]
        CORS[CORS 2.8.5]
        UUID[UUID 9.0.1]
    end
    
    subgraph "AI & Voice Stack"
        OpenAISDK[OpenAI SDK 5.18.1]
        WebAudio[Web Audio API]
        AudioWorkletNode[AudioWorklet]
        MediaStream[MediaStream API]
    end
    
    subgraph "Development Tools"
        ESLint[ESLint 9]
        Nodemon[Nodemon 3.1.10]
        PostCSS[PostCSS]
    end
    
    NextJS --> React
    NextJS --> TypeScript
    React --> Tailwind
    React --> Axios
    React --> Lucide
    React --> ReactHookForm
    ReactHookForm --> Zod
    
    Express --> NodeJS
    Express --> SQLite
    Express --> WS
    Express --> CORS
    Express --> Dotenv
    Express --> UUID
    
    NodeJS --> OpenAISDK
    React --> WebAudio
    WebAudio --> AudioWorkletNode
    WebAudio --> MediaStream
```

## Database Schema

```mermaid
erDiagram
    users ||--o{ user_sessions : has
    users ||--o{ voice_sessions : has
    users ||--o{ tts_cache : has
    users ||--o{ dashboard_content : has
    user_sessions ||--o{ dashboard_content : generates
    voice_sessions ||--o{ voice_turns : contains
    
    users {
        int id PK
        text full_name
        text gender
        int age
        text health_goals
        datetime created_at
        datetime updated_at
    }
    
    user_sessions {
        int id PK
        int user_id FK
        text condition_selected
        int diagnosis_year
        bool takes_medication
        text medications
        text checks_vitals
        text main_goal
        text main_question
        text knowledge_level
        text main_interests
        text learning_style
        text other_knowledge
        text ai_response
        datetime created_at
    }
    
    conditions {
        int id PK
        text name
        text icon
        text description
    }
    
    medications {
        int id PK
        text name
        text description
        text condition_category
    }
    
    voice_sessions {
        int id PK
        int user_id FK
        text session_id
        datetime started_at
        datetime ended_at
        text lang
        int total_turns
    }
    
    voice_turns {
        int id PK
        text session_id FK
        int turn_number
        text role
        text input_type
        text text_content
        int audio_duration_ms
        text grounded_from
        text sources
        datetime created_at
    }
    
    tts_cache {
        int id PK
        text cache_key
        int user_id FK
        text card_id
        text content_hash
        text voice_id
        text audio_url
        int audio_duration_ms
        text script_text
        datetime created_at
        datetime expires_at
    }
    
    mini_kb {
        int id PK
        text title
        text content
        text condition_category
        text tags
        int priority
        datetime created_at
        datetime updated_at
    }
    
    dashboard_content {
        int id PK
        int user_id FK
        text cards_data
        datetime created_at
        datetime updated_at
    }
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Side"
        UserDevice[User Device<br/>Desktop/Mobile]
        Browser[Modern Browser<br/>Chrome/Firefox/Safari]
    end
    
    subgraph "Frontend Server"
        NextServer[Next.js Server<br/>Port 3001]
        StaticAssets[Static Assets<br/>Images, Videos, Audio]
    end
    
    subgraph "Backend Server"
        ExpressServer[Express Server<br/>Port 6001]
        HTTPEndpoints[HTTP REST Endpoints]
        WSEndpoints[WebSocket Endpoints]
    end
    
    subgraph "Data Layer"
        SQLiteDB[(SQLite Database<br/>database.sqlite)]
        FileSystem[File System<br/>Audio Cache]
    end
    
    subgraph "External Services"
        OpenAIService[OpenAI API<br/>GPT-4 + Realtime + TTS]
    end
    
    UserDevice --> Browser
    Browser -->|HTTPS| NextServer
    NextServer --> StaticAssets
    Browser -->|HTTP REST| HTTPEndpoints
    Browser -->|WebSocket| WSEndpoints
    HTTPEndpoints --> ExpressServer
    WSEndpoints --> ExpressServer
    ExpressServer --> SQLiteDB
    ExpressServer --> FileSystem
    ExpressServer -->|API Key Auth| OpenAIService
    
    style UserDevice fill:#3b82f6,stroke:#1e40af,color:#fff
    style NextServer fill:#3b82f6,stroke:#1e40af,color:#fff
    style ExpressServer fill:#10b981,stroke:#047857,color:#fff
    style SQLiteDB fill:#f59e0b,stroke:#d97706,color:#fff
    style OpenAIService fill:#8b5cf6,stroke:#6d28d9,color:#fff
```

## Key Features Architecture

### Multi-Step Assessment Flow

```mermaid
stateDiagram-v2
    [*] --> LandingPage
    LandingPage --> Step1: Start
    
    state Step1 {
        [*] --> PersonalInfo
        PersonalInfo --> HealthGoalSelection
        HealthGoalSelection --> [*]: Valid
    }
    
    Step1 --> Step2: Continue
    
    state Step2 {
        [*] --> ConditionSelection
        ConditionSelection --> [*]: Valid
    }
    
    Step2 --> Step3: Continue
    
    state Step3 {
        [*] --> KnowledgeAssessment
        KnowledgeAssessment --> MainInterests
        MainInterests --> LearningStyle
        LearningStyle --> [*]: Valid
    }
    
    Step3 --> Step4: Continue
    
    state Step4 {
        [*] --> GoalSelection
        GoalSelection --> MainQuestion
        MainQuestion --> [*]: Valid
    }
    
    Step4 --> Dashboard: Complete
    
    state Dashboard {
        [*] --> LoadSession
        LoadSession --> GenerateCards
        GenerateCards --> DisplayCards
        DisplayCards --> VoiceReading
        DisplayCards --> VoiceAgent
        DisplayCards --> PDFExport
    }
    
    Dashboard --> VoiceCoach: Navigate
    Dashboard --> [*]: Logout
```

### Voice System Architecture

```mermaid
graph TB
    subgraph "Voice Features"
        VoiceCoach[Voice Coach Page<br/>Push-to-Talk]
        DashboardVoice[Dashboard Voice Agent<br/>FAB Pop-up]
        CardVoice[Dashboard Card Reading<br/>TTS Playback]
    end
    
    subgraph "Audio Management"
        AudioManager[AudioManager Singleton]
        WebAudioContext[Web Audio Context<br/>16kHz Input / 24kHz Output]
        AudioWorkletProcessor[AudioWorklet Processor<br/>PCM16 20ms chunks]
    end
    
    subgraph "Voice Processing"
        OpenAIRealtime[OpenAI Realtime Hook]
        WebSocketConnection[WebSocket Connection]
        BufferManagement[Buffer Management<br/>Prevent delays]
    end
    
    subgraph "Backend Voice Services"
        VoiceRouteHandler[Voice Route Handler]
        RealtimeProxy[Realtime API Proxy]
        TTSCache[TTS Cache System]
    end
    
    VoiceCoach --> OpenAIRealtime
    DashboardVoice --> OpenAIRealtime
    CardVoice --> AudioManager
    
    OpenAIRealtime --> WebSocketConnection
    OpenAIRealtime --> AudioWorkletProcessor
    OpenAIRealtime --> BufferManagement
    
    AudioWorkletProcessor --> WebAudioContext
    AudioManager --> WebAudioContext
    
    WebSocketConnection --> VoiceRouteHandler
    VoiceRouteHandler --> RealtimeProxy
    VoiceRouteHandler --> TTSCache
    
    style VoiceCoach fill:#3b82f6,stroke:#1e40af,color:#fff
    style DashboardVoice fill:#3b82f6,stroke:#1e40af,color:#fff
    style CardVoice fill:#3b82f6,stroke:#1e40af,color:#fff
    style RealtimeProxy fill:#8b5cf6,stroke:#6d28d9,color:#fff
```

## Security & Performance

```mermaid
graph TB
    subgraph "Security Measures"
        CORS[CORS Configuration<br/>Origin restrictions]
        APIKeyAuth[OpenAI API Key<br/>Environment variable]
        InputValidation[Input Validation<br/>Zod schemas]
        MedicalSafety[Medical Safety Filter<br/>Prevent medical advice]
    end
    
    subgraph "Performance Optimizations"
        TTSCaching[TTS Audio Caching<br/>Reduce API calls]
        LocalStorage[localStorage Persistence<br/>Form data]
        AudioSingleton[Audio Manager Singleton<br/>Prevent overlaps]
        DynamicCards[Dynamic Card Generation<br/>2-5 cards only]
    end
    
    subgraph "Error Handling"
        FrontendErrors[Frontend Error Boundaries]
        BackendErrors[Backend Error Middleware]
        Fallbacks[Fallback Systems<br/>Default cards]
        RetryLogic[Retry Logic<br/>Failed API calls]
    end
    
    CORS --> APIKeyAuth
    APIKeyAuth --> InputValidation
    InputValidation --> MedicalSafety
    
    TTSCaching --> LocalStorage
    LocalStorage --> AudioSingleton
    AudioSingleton --> DynamicCards
    
    FrontendErrors --> BackendErrors
    BackendErrors --> Fallbacks
    Fallbacks --> RetryLogic
    
    style MedicalSafety fill:#ef4444,stroke:#b91c1c,color:#fff
    style TTSCaching fill:#10b981,stroke:#047857,color:#fff
```

---

## Summary

This architecture diagram illustrates:

1. **Frontend Layer**: Next.js pages, React components, custom hooks, and state management
2. **Backend Layer**: Express API routes, WebSocket server, and business services
3. **Database Layer**: SQLite with 9 tables for comprehensive data storage
4. **External Services**: OpenAI GPT-4, Realtime API, and TTS integration
5. **Data Flow**: Complete user journey from assessment to personalized dashboard
6. **Voice System**: Push-to-talk voice coach and dashboard voice agent
7. **Security & Performance**: Caching, validation, error handling, and medical safety

The system uses a modern stack with React 19, Next.js 15, Express 5, and OpenAI's latest APIs to deliver personalized health education with voice interaction capabilities.


