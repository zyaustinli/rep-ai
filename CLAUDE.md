# Sales Call Practice Platform - System Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Core Workflow](#core-workflow)
4. [LLM Pipeline Design](#llm-pipeline-design)
5. [Component Breakdown](#component-breakdown)
6. [Database Schema](#database-schema)
7. [API Design](#api-design)
8. [Frontend Architecture](#frontend-architecture)
9. [Technical Stack Recommendations](#technical-stack-recommendations)
10. [Implementation Phases](#implementation-phases)
11. [Key Technical Challenges](#key-technical-challenges)
12. [Cost Optimization Strategies](#cost-optimization-strategies)
13. [Future Enhancements](#future-enhancements)

---

## Project Overview

A web application that enables users to practice sales calls through AI-powered role-play scenarios. The platform uses multiple LLM integrations to create realistic sales scenarios, conduct real-time voice conversations, and provide detailed performance feedback.

### Core Value Proposition
- **Realistic Practice**: AI-generated personas with varying difficulty levels
- **Real-time Interaction**: Natural voice conversations with immediate responses
- **Actionable Feedback**: Detailed analysis of sales techniques and areas for improvement
- **Progress Tracking**: Historical data and performance metrics over time

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Next.js)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │  Setup   │  │Practice  │  │ Review   │       │
│  │  Page    │  │   Page   │  │  Session │  │  Page    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js/Python)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Auth Service  │  │Session Mgmt  │  │Analytics     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      LLM Integration Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Claude API    │  │Vapi Voice AI │  │Claude API    │         │
│  │(Scenario Gen)│  │(Conversation)│  │(Analysis)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   Data Layer (PostgreSQL)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │User Data     │  │Sessions      │  │Transcripts   │         │
│  │Products      │  │Scenarios     │  │Analyses      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Workflow

### Phase 1: Pre-Call Setup (Scenario Generation)

**User Input:**
```javascript
{
  product: {
    name: string,
    description: string,
    price: number,
    features: string[],
    uniqueSellingPoints: string[],
    targetMarket: string,
    competitors: string[]
  },
  targetPersona: {
    industry: string,
    companySize: string,
    role: string,
    painPoints: string[],
    budget: string,
    // Optional: if not provided, auto-generate
    name: string,
    personality: string,
    decisionMakingAuthority: string
  },
  preferences: {
    difficulty: "easy" | "medium" | "hard" | "expert",
    callType: "cold" | "warm" | "follow-up" | "closing",
    duration: number, // in minutes
    focusAreas: string[] // e.g., ["objection_handling", "discovery"]
  }
}
```

**Claude API Call 1 - Scenario Generation:**
- Input: User-provided data + prompt template
- Output: Complete scenario profile including:
  - Fully fleshed-out persona (if not provided)
  - Current situation and context
  - 3-5 potential objections they'll raise
  - Their buying signals to watch for
  - Hidden information (budget, timeline, competition)
  - Personality traits and communication style
  - Success criteria and conversation goals
  - Backstory and company context

**Example Scenario Output Structure:**
```javascript
{
  scenario: {
    persona: {
      name: "Sarah Chen",
      role: "VP of Sales",
      company: "TechGrow Inc",
      personality: "analytical, skeptical, busy",
      communicationStyle: "direct, data-driven",
      decisionAuthority: "recommender",
      reportingTo: "CEO"
    },
    context: {
      currentSituation: "Frustrated with current CRM system...",
      painPoints: ["Low adoption", "Clunky interface", "Poor reporting"],
      budget: "$50k annual",
      timeline: "Q1 next year",
      competitorsConsidering: ["Salesforce", "HubSpot"]
    },
    objectives: {
      scenarioGoal: "Qualify the prospect and book a demo",
      challengeLevel: "medium",
      expectedDuration: "10-15 minutes"
    },
    objections: [
      {
        type: "price",
        objection: "That seems expensive compared to our current solution",
        idealResponse: "Ask about total cost of ownership..."
      },
      // ... more objections
    ],
    successCriteria: {
      must: ["Discovery of pain points", "Budget confirmation"],
      should: ["Build rapport", "Handle objections", "Secure next steps"],
      bonus: ["Identify additional stakeholders"]
    }
  }
}
```

### Phase 2: Real-Time Conversation

**Voice AI Platform: Vapi**

We're using Vapi as our voice AI orchestration platform. Vapi handles the complete speech pipeline (STT → LLM → TTS) and provides sub-500ms latency for natural conversations.

**Why Vapi:**
- **Unified Pipeline**: Integrates speech-to-text, LLM, and text-to-speech in one API
- **Claude Integration**: Use Claude as the conversational LLM for better reasoning
- **Low Latency**: Sub-500ms response times for natural conversation flow
- **Flexible Components**: Choose from multiple STT/TTS providers (Deepgram, Azure, ElevenLabs, etc.)
- **Built-in Features**: Automatic transcription, interruption handling, voice activity detection
- **Cost Effective**: ~60-75% cheaper than OpenAI Realtime API
- **Developer-Friendly**: Simple SDK for web, comprehensive webhooks for backend integration
- **Scalable**: Handles infrastructure, monitoring, and millions of concurrent calls

**Architecture Approach:**
- **Frontend**: Use Vapi Web SDK (`@vapi-ai/web`) for direct voice calls
- **Backend**: Receive real-time events and transcripts via Vapi webhooks
- **LLM**: Configure Vapi to use Claude 3.5 Sonnet as the conversational AI
- **TTS**: Use Vapi default (upgradeable to ElevenLabs for premium voice quality)

**Implementation Overview:**
```javascript
// Backend: Create Vapi assistant with scenario context
const createVapiAssistant = async (scenario) => {
  const response = await vapiClient.assistants.create({
    name: `Practice Session ${sessionId}`,
    model: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      systemPrompt: generateSystemPrompt(scenario),
      temperature: 0.8,
      maxTokens: 4096
    },
    voice: {
      provider: "azure", // or "11labs" for premium quality
      voiceId: "default"
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US"
    },
    serverUrl: `${BACKEND_URL}/api/vapi/webhooks/${sessionId}`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET
  });

  return response.id; // assistant ID
};

// Frontend: Start conversation using Vapi Web SDK
import Vapi from '@vapi-ai/web';

const vapi = new Vapi(apiKey);

// Start call with assistant
vapi.start(assistantId);

// Listen for events
vapi.on('speech-start', () => console.log('AI speaking'));
vapi.on('speech-end', () => console.log('AI finished'));
vapi.on('message', (message) => {
  // Real-time transcript updates
  if (message.type === 'transcript') {
    displayTranscript(message);
  }
});
vapi.on('call-end', () => {
  // Call ended, trigger analysis
  analyzeSession(sessionId);
});

// Backend: Webhook handler for real-time events
app.post('/api/vapi/webhooks/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const event = req.body;

  switch(event.type) {
    case 'transcript':
      // Store transcript entry in real-time
      await storeTranscriptEntry(sessionId, event.data);
      break;
    case 'call-end':
      // Mark session as completed
      await updateSessionStatus(sessionId, 'completed');
      break;
  }

  res.sendStatus(200);
});
```

**System Prompt for Voice AI:**
```
You are roleplaying as [PERSONA NAME], [ROLE] at [COMPANY].

PERSONA DETAILS:
{detailed persona from scenario generation}

CONTEXT:
{current situation and background}

PERSONALITY & COMMUNICATION STYLE:
- {personality traits}
- {communication preferences}
- {speaking patterns}

YOUR OBJECTIVES:
{persona's goals in this conversation}

OBJECTIONS TO RAISE:
{list of objections - raise naturally when appropriate}

CONSTRAINTS:
- Stay in character at all times
- Don't make it too easy - challenge the salesperson appropriately
- Raise objections naturally, not all at once
- Show buying signals if they handle objections well
- Be realistic about your concerns and constraints
- End the call naturally after 10-15 minutes or when a clear outcome is reached

IMPORTANT: Respond naturally and conversationally. Think like this person would think.
```

**Real-time Tracking:**
During the conversation, capture:
- Full transcript (both sides)
- Timestamps for each exchange
- Detected objections raised
- Objection handling attempts
- Key moments (e.g., pricing discussion, closing attempt)
- Conversation flow metrics
- User interruptions/speaking time ratio

### Phase 3: Post-Call Analysis & Grading

**Data Collection:**
```javascript
{
  sessionData: {
    scenarioId: string,
    transcript: Array<{
      timestamp: number,
      speaker: "user" | "ai",
      text: string,
      duration: number
    }>,
    audioFileUrl: string,
    duration: number,
    metadata: {
      objectionsRaised: string[],
      objectionsHandled: string[],
      keyMoments: Array<{
        timestamp: number,
        type: string,
        description: string
      }>
    }
  }
}
```

**Claude API Call 2 - Comprehensive Analysis:**

**Input Structure:**
```
Original Scenario: {scenario}
Call Transcript: {full transcript}
Call Metadata: {duration, objections, etc.}

Analyze this sales call across the following dimensions:
[detailed analysis prompt]
```

**Analysis Framework:**

1. **Discovery & Qualification (0-100)**
   - Questions asked to uncover pain points
   - Understanding of prospect's situation
   - Identification of budget and timeline
   - Stakeholder mapping

2. **Product Knowledge (0-100)**
   - Accuracy of product information
   - Ability to connect features to benefits
   - Confidence in explanations
   - Handling technical questions

3. **Objection Handling (0-100)**
   - Recognition of objections
   - Response quality
   - Techniques used (feel-felt-found, etc.)
   - Moving past objections vs getting stuck

4. **Rapport Building (0-100)**
   - Active listening signals
   - Personalization attempts
   - Empathy and understanding
   - Natural conversation flow

5. **Value Communication (0-100)**
   - Clear articulation of ROI
   - Tailoring value prop to prospect needs
   - Use of stories/case studies
   - Quantifying benefits

6. **Closing & Next Steps (0-100)**
   - Clear call-to-action
   - Handling commitment resistance
   - Setting up next steps
   - Creating urgency appropriately

7. **Communication Skills (0-100)**
   - Clarity and conciseness
   - Pace and energy
   - Professional language
   - Filler word usage

**Output Format:**
```javascript
{
  analysis: {
    overallGrade: "A-",
    overallScore: 87,

    categories: {
      discovery: {
        score: 85,
        strengths: [
          "Asked about current solution and pain points",
          "Identified budget range early in conversation"
        ],
        weaknesses: [
          "Missed opportunity to ask about decision timeline",
          "Didn't identify other stakeholders in decision process"
        ],
        examples: [
          {
            timestamp: 120,
            quote: "Can you tell me about your current CRM system?",
            feedback: "Great open-ended discovery question"
          }
        ]
      },
      // ... other categories
    },

    keyMoments: [
      {
        timestamp: 180,
        title: "Price Objection Handling",
        description: "Prospect raised price concern...",
        evaluation: "Good use of value-based response, but could have...",
        rating: "good"
      }
    ],

    transcript_analysis: {
      talkTimeRatio: 0.45, // user spoke 45% of time (good for discovery)
      averageResponseLength: 22, // words
      questionsAsked: 8,
      objectionsEncountered: 3,
      objectionsOvercome: 2
    },

    recommendations: [
      {
        priority: "high",
        category: "discovery",
        suggestion: "Ask more about the decision-making process",
        reasoning: "Understanding who else needs to approve helps with next steps",
        practiceExercise: "Practice asking: 'Who else typically weighs in on decisions like this?'"
      }
    ],

    nextPracticeScenario: {
      suggestion: "Try a harder difficulty with more objections",
      focusAreas: ["objection_handling", "stakeholder_mapping"]
    }
  }
}
```

---

## Component Breakdown

### Frontend Components

#### 1. Authentication & Onboarding
```
/components/auth/
├── LoginForm.tsx
├── SignupForm.tsx
├── OnboardingFlow.tsx
└── ResetPassword.tsx
```

**Features:**
- Email/password authentication
- OAuth providers (Google, LinkedIn)
- Onboarding wizard (role, experience level, goals)

#### 2. Dashboard
```
/components/dashboard/
├── StatsOverview.tsx         // Overall performance metrics
├── RecentSessions.tsx        // Last 5 practice calls
├── ProgressChart.tsx         // Score trends over time
├── SkillBreakdown.tsx        // Radar chart of skill categories
└── QuickStartCard.tsx        // Start new practice
```

**Key Metrics to Display:**
- Total practice sessions
- Average score (trending)
- Most improved skill
- Practice streak
- Time spent practicing
- Recent achievements/milestones

#### 3. Setup/Configuration Page
```
/components/setup/
├── ProductForm.tsx           // Product details input
├── PersonaBuilder.tsx        // Target persona configuration
├── TemplateLibrary.tsx       // Pre-built scenarios
├── DifficultySelector.tsx    // Easy to Expert
└── PreferencesPanel.tsx      // Call type, duration, focus areas
```

**Features:**
- Save product profiles for reuse
- Template library (SaaS, Real Estate, Insurance, etc.)
- AI-assisted persona generation
- Difficulty preview (shows what to expect)

#### 4. Practice Session Interface
```
/components/practice/
├── ConversationView.tsx      // Main interface during call
├── AudioVisualizer.tsx       // Real-time audio waveform
├── TranscriptLive.tsx        // Live transcript display
├── TimerDisplay.tsx          // Call duration timer
├── NotesPanel.tsx            // Jot notes during call
└── ControlBar.tsx            // Mute, pause, end call
```

**Design Considerations:**
- Minimal distractions during call
- Clear visual feedback (AI speaking/listening)
- Emergency pause button
- Optional live hints toggle
- Audio quality indicator

#### 5. Review & Analysis Page
```
/components/review/
├── ScoreOverview.tsx         // Grade and overall score
├── CategoryBreakdown.tsx     // Detailed category scores
├── TranscriptViewer.tsx      // Full transcript with annotations
├── KeyMoments.tsx            // Highlighted moments with feedback
├── RecommendationsPanel.tsx  // Improvement suggestions
└── CompareSession.tsx        // Compare to previous attempts
```

**Features:**
- Playback audio at specific timestamps
- Click on transcript to jump to moment
- Annotated transcript (highlights good/bad moments)
- Shareable report link
- Export transcript/report as PDF

#### 6. History & Analytics
```
/components/history/
├── SessionList.tsx           // All past sessions
├── FilterBar.tsx             // Filter by date, score, scenario
├── ComparisonView.tsx        // Multi-session comparison
└── ExportData.tsx            // Export analytics data
```

#### 7. Profile & Settings
```
/components/profile/
├── UserProfile.tsx           // Personal info
├── SubscriptionManagement.tsx
├── NotificationSettings.tsx
└── IntegrationSettings.tsx   // CRM integrations, etc.
```

### Backend Services

#### 1. Authentication Service
```python
# services/auth.py
- User registration and login
- JWT token management
- Password reset flow
- OAuth integration
- Session management
```

#### 2. Scenario Generation Service
```python
# services/scenario_generator.py
class ScenarioGenerator:
    def __init__(self, anthropic_client):
        self.client = anthropic_client

    async def generate_scenario(
        self,
        product_data: ProductInput,
        persona_data: PersonaInput,
        preferences: PreferencesInput
    ) -> ScenarioOutput:
        """
        Calls Claude API to generate comprehensive scenario
        """
        prompt = self._build_scenario_prompt(...)
        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        return self._parse_scenario(response)

    def _build_scenario_prompt(self, ...):
        """
        Constructs detailed prompt for scenario generation
        """
        pass
```

#### 3. Conversation Service (Vapi Integration)
```python
# services/conversation.py
from vapi import Vapi

class ConversationService:
    """
    Manages Vapi assistant creation and webhook handling
    """
    def __init__(self, vapi_api_key: str):
        self.vapi_client = Vapi(api_key=vapi_api_key)

    async def create_vapi_assistant(
        self,
        session_id: str,
        scenario: Scenario
    ) -> str:
        """
        Creates a Vapi assistant configured with the scenario
        Returns assistant_id for frontend to start call
        """
        system_prompt = self._build_system_prompt(scenario)

        assistant = await self.vapi_client.assistants.create(
            name=f"Session {session_id}",
            model={
                "provider": "anthropic",
                "model": "claude-3-5-sonnet-20241022",
                "systemPrompt": system_prompt,
                "temperature": 0.8,
                "maxTokens": 4096
            },
            voice={
                "provider": "azure",  # Can upgrade to "11labs"
                "voiceId": "default"
            },
            transcriber={
                "provider": "deepgram",
                "model": "nova-2",
                "language": "en-US"
            },
            serverUrl=f"{config.BACKEND_URL}/api/vapi/webhooks/{session_id}",
            serverUrlSecret=config.VAPI_WEBHOOK_SECRET
        )

        return assistant.id

    async def handle_webhook(
        self,
        session_id: str,
        event_type: str,
        event_data: dict
    ):
        """
        Process Vapi webhook events
        - transcript: Store real-time transcript entries
        - call-start: Mark session as in_progress
        - call-end: Mark session as completed
        - status-update: Track call status
        """
        if event_type == "transcript":
            await self._store_transcript_entry(session_id, event_data)
        elif event_type == "call-end":
            await self._finalize_session(session_id, event_data)
        # Handle other event types...

    def _build_system_prompt(self, scenario: Scenario) -> str:
        """
        Formats scenario into Vapi system prompt
        """
        # Format persona, objections, context into prompt
        pass
```

#### 4. Analysis Service
```python
# services/analysis.py
class AnalysisService:
    def __init__(self, anthropic_client):
        self.client = anthropic_client

    async def analyze_session(
        self,
        session: Session,
        transcript: List[TranscriptEntry],
        scenario: Scenario
    ) -> Analysis:
        """
        Comprehensive analysis using Claude
        """
        prompt = self._build_analysis_prompt(
            scenario,
            transcript,
            session.metadata
        )

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=8000,
            messages=[{"role": "user", "content": prompt}]
        )

        return self._parse_analysis(response)

    def _extract_key_moments(self, transcript):
        """
        Identify important moments in conversation
        """
        pass

    def _calculate_metrics(self, transcript):
        """
        Calculate talk time ratio, questions asked, etc.
        """
        pass
```

#### 5. Analytics Service
```python
# services/analytics.py
class AnalyticsService:
    """
    Aggregate and track user performance over time
    """
    async def get_user_stats(self, user_id: str):
        """
        Overall statistics for dashboard
        """
        pass

    async def get_progress_trends(self, user_id: str):
        """
        Score trends over time
        """
        pass

    async def get_skill_breakdown(self, user_id: str):
        """
        Breakdown by category (discovery, objection handling, etc.)
        """
        pass

    async def get_recommendations(self, user_id: str):
        """
        Personalized practice recommendations
        """
        pass
```

---

## Database Schema

### PostgreSQL Schema

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(100), -- e.g., "Sales Rep", "Manager"
    experience_level VARCHAR(50), -- "beginner", "intermediate", "advanced"
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    preferences JSONB
);

-- Product Profiles (reusable)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    features JSONB,
    unique_selling_points JSONB,
    target_market TEXT,
    competitors JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Practice Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Scenario data
    scenario JSONB NOT NULL, -- Full scenario generated by Claude

    -- Session metadata
    difficulty VARCHAR(50),
    call_type VARCHAR(50),
    duration_seconds INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Results
    overall_score INTEGER, -- 0-100
    overall_grade VARCHAR(5), -- A+, A, A-, B+, etc.

    created_at TIMESTAMP DEFAULT NOW()
);

-- Transcripts
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

    -- Transcript entries (could also be separate table)
    entries JSONB NOT NULL, -- Array of {timestamp, speaker, text, duration}

    -- Metadata
    total_user_words INTEGER,
    total_ai_words INTEGER,
    user_talk_time_seconds INTEGER,
    ai_talk_time_seconds INTEGER,
    questions_asked INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis Results
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

    -- Category scores
    discovery_score INTEGER,
    product_knowledge_score INTEGER,
    objection_handling_score INTEGER,
    rapport_building_score INTEGER,
    value_communication_score INTEGER,
    closing_score INTEGER,
    communication_score INTEGER,

    -- Detailed analysis
    strengths JSONB, -- Array of strengths by category
    weaknesses JSONB, -- Array of weaknesses by category
    key_moments JSONB, -- Array of annotated moments
    recommendations JSONB, -- Array of improvement suggestions

    -- Full analysis text
    detailed_feedback TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Templates (pre-built scenarios)
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- SaaS, Real Estate, Insurance, etc.
    difficulty VARCHAR(50),

    product_template JSONB,
    persona_template JSONB,

    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

-- User Achievements/Milestones
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    achievement_type VARCHAR(100), -- "first_call", "10_calls", "streak_7", "perfect_score"
    achievement_name VARCHAR(255),
    description TEXT,
    earned_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX idx_analyses_session_id ON analyses(session_id);
CREATE INDEX idx_products_user_id ON products(user_id);
```

### Redis Cache Layer
```
# Session state during active conversations
session:{session_id}:state -> {
  status,
  current_speaker,
  messages_count,
  started_at
}

# User statistics (cache for 5 minutes)
user:{user_id}:stats -> {
  total_sessions,
  average_score,
  last_session_date
}

# Rate limiting
ratelimit:user:{user_id}:sessions -> counter (max sessions per day)
```

---

## API Design

### REST Endpoints

```yaml
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

# User Profile
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/me/stats
GET    /api/users/me/achievements

# Products
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id

# Templates
GET    /api/templates?category=saas&difficulty=medium
GET    /api/templates/:id

# Sessions - Scenario Generation
POST   /api/sessions/generate-scenario
  Request: { product, persona, preferences }
  Response: { scenarioId, scenario }

# Sessions - Main CRUD
POST   /api/sessions
  Request: { scenarioId, productId }
  Response: { sessionId, status }

GET    /api/sessions
  Query: ?page=1&limit=20&sort=created_at&order=desc

GET    /api/sessions/:id
  Response: { session, transcript, analysis, audioUrl }

DELETE /api/sessions/:id

# Analysis
GET    /api/sessions/:id/analysis
POST   /api/sessions/:id/analyze  # Trigger analysis manually

# Analytics
GET    /api/analytics/overview
  Response: { totalSessions, avgScore, trending, skillBreakdown }

GET    /api/analytics/progress
  Query: ?period=30d
  Response: { dataPoints: [{date, avgScore, sessions}] }

GET    /api/analytics/skills
  Response: { discovery: 85, objectionHandling: 72, ... }

GET    /api/analytics/recommendations
  Response: { nextPractice, focusAreas, suggestedTemplates }

# Comparison
GET    /api/analytics/compare
  Query: ?sessionIds=id1,id2,id3
  Response: { comparison data }
```

### WebSocket Endpoints

```javascript
// Real-time conversation
WS /api/sessions/:id/conversation

// Client -> Server messages
{
  type: "audio_chunk",
  data: base64AudioData,
  timestamp: 1234567890
}

{
  type: "control",
  action: "pause" | "resume" | "end"
}

// Server -> Client messages
{
  type: "audio_response",
  data: base64AudioData
}

{
  type: "transcript",
  speaker: "user" | "ai",
  text: "...",
  timestamp: 1234567890
}

{
  type: "status",
  status: "connected" | "disconnected" | "error"
}

{
  type: "ai_speaking",
  isSpeaking: boolean
}
```

---

## Frontend Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (lightweight) or Redux Toolkit
- **Audio**: Web Audio API + WebRTC
- **Charts**: Recharts or Chart.js
- **Real-time**: Socket.io-client or native WebSocket

### State Management

```typescript
// stores/sessionStore.ts
interface SessionState {
  currentSession: Session | null;
  isConnected: boolean;
  isAISpeaking: boolean;
  transcript: TranscriptEntry[];
  audioLevel: number;
  duration: number;

  // Actions
  startSession: (scenario: Scenario) => Promise<void>;
  endSession: () => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  updateAudioLevel: (level: number) => void;
}

// stores/userStore.ts
interface UserState {
  user: User | null;
  stats: UserStats | null;
  loading: boolean;

  // Actions
  fetchUserStats: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// stores/analyticsStore.ts
interface AnalyticsState {
  overview: AnalyticsOverview | null;
  progress: ProgressData[];
  skillBreakdown: SkillBreakdown | null;

  // Actions
  fetchAnalytics: (period: string) => Promise<void>;
}
```

### Key Pages

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  // Fetch user stats, recent sessions
  // Display overview metrics
  // Quick start button
}

// app/setup/page.tsx
export default function SetupPage() {
  // Multi-step form
  // Step 1: Choose template or custom
  // Step 2: Product details
  // Step 3: Persona details
  // Step 4: Preferences (difficulty, duration)
  // Generate scenario and navigate to practice
}

// app/practice/[sessionId]/page.tsx
export default function PracticePage() {
  // Main conversation interface
  // WebSocket connection for audio
  // Live transcript display
  // Audio visualization
  // Control buttons
}

// app/review/[sessionId]/page.tsx
export default function ReviewPage() {
  // Fetch analysis results
  // Display scores and breakdown
  // Interactive transcript with annotations
  // Key moments timeline
  // Recommendations
}

// app/history/page.tsx
export default function HistoryPage() {
  // List all past sessions
  // Filtering and sorting
  // Search functionality
  // Comparison tool
}
```

---

## Technical Stack Recommendations

### Backend Options

#### Option A: Node.js + Express/Fastify
**Pros:**
- Great for real-time (WebSocket support)
- Large ecosystem
- TypeScript support
- Same language as frontend

**Cons:**
- Less structured than Python for ML workflows
- Anthropic SDK is better in Python

#### Option B: Python + FastAPI (Recommended)
**Pros:**
- Excellent async support
- Native async/await for LLM calls
- Great for ML/AI integrations
- Anthropic SDK is excellent
- Type hints and validation (Pydantic)

**Cons:**
- Different language from frontend
- Slightly less mature WebSocket libraries

**Recommendation:** Python + FastAPI for backend, with proper WebSocket handling for real-time audio.

### Frontend Stack
```json
{
  "framework": "Next.js 14",
  "ui": "React 18 + Tailwind CSS + shadcn/ui",
  "state": "Zustand",
  "audio": "Web Audio API",
  "websocket": "native WebSocket or socket.io-client",
  "charts": "Recharts",
  "forms": "React Hook Form + Zod",
  "auth": "NextAuth.js"
}
```

### Infrastructure

```yaml
Hosting:
  Frontend: Vercel (Next.js native support)
  Backend: Railway, Render, or AWS ECS
  Database: Supabase (Postgres) or AWS RDS
  Redis: Upstash or AWS ElastiCache (optional, for caching)

Monitoring:
  Errors: Sentry
  Analytics: PostHog or Mixpanel
  Logs: Axiom or Datadog

CI/CD:
  GitHub Actions
  Automated tests before deploy
  Staging environment
```

---

## Implementation Phases

### Phase 1: MVP (4-6 weeks)

**Week 1-2: Foundation**
- [ ] Set up project structure (monorepo or separate repos)
- [ ] Database schema and migrations
- [ ] Authentication system (email/password)
- [ ] Basic UI components and layout
- [ ] User registration and login

**Week 3-4: Core Workflow - Scenario Generation**
- [ ] Product input form
- [ ] Persona builder (basic)
- [ ] Claude API integration for scenario generation
- [ ] Test scenario generation with multiple examples
- [ ] Store scenarios in database

**Week 5-6: Real-time Conversation**
- [ ] Integrate Vapi voice AI platform
- [ ] Implement Vapi assistant creation (with scenario as system prompt)
- [ ] Set up Vapi webhook handlers for transcripts and events
- [ ] Install Vapi Web SDK on frontend
- [ ] Basic conversation interface with Vapi SDK
- [ ] Audio visualization
- [ ] Real-time transcript collection via webhooks
- [ ] End-to-end test of full conversation

**Deliverable:** User can create a scenario and have a voice conversation with AI.

### Phase 2: Analysis & Feedback (3-4 weeks)

**Week 7-8: Post-Call Analysis**
- [ ] Analysis service with Claude API
- [ ] Comprehensive grading framework
- [ ] Parse and store analysis results
- [ ] Review page UI with scores and feedback

**Week 9-10: Enhanced Feedback**
- [ ] Key moments identification
- [ ] Interactive transcript with annotations
- [ ] Detailed recommendations
- [ ] Export functionality (PDF report)
- [ ] Audio playback with timestamp sync

**Deliverable:** User receives detailed feedback after each practice session.

### Phase 3: Analytics & Progression (2-3 weeks)

**Week 11-12: Dashboard & Analytics**
- [ ] User statistics calculation
- [ ] Progress tracking over time
- [ ] Skill breakdown visualization
- [ ] Session history with filtering
- [ ] Session comparison tool

**Week 13: Polish**
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Error handling improvements
- [ ] User testing and feedback
- [ ] Bug fixes

**Deliverable:** Complete platform with analytics and user progression tracking.

### Phase 4: Advanced Features (Ongoing)

- [ ] Template library (pre-built scenarios)
- [ ] Team/organization features
- [ ] Admin dashboard for managers
- [ ] Integration with CRM systems
- [ ] Custom voice training (for AI persona)
- [ ] Multi-language support
- [ ] Practice playlists (curated scenarios)
- [ ] Peer review/sharing
- [ ] Certification programs
- [ ] API for third-party integrations

---

## Key Technical Challenges

### 1. Real-time Audio Latency

**Challenge:** Minimize delay between user speech and AI response for natural conversation.

**Solutions:**
- Use Vapi (optimized for sub-500ms latency)
- Vapi handles WebSocket connections, voice activity detection, and audio routing
- Backend focuses on webhook handling (no audio streaming)
- Frontend uses Vapi Web SDK for optimized audio capture/playback
- Vapi's infrastructure handles edge locations and audio processing

**Target Metrics:**
- < 500ms total latency (speech end to AI response start) - achieved by Vapi
- Smooth audio streaming without jitter
- No backend audio processing needed

### 2. Conversation State Management

**Challenge:** Maintaining context throughout conversation, handling interruptions, managing turn-taking.

**Solutions:**
- Use function calling to track conversation state
- Implement interruption detection and handling
- Store conversation context in Redis for quick access
- Handle edge cases (long pauses, user interrupting AI)
- Graceful degradation on network issues

### 3. Audio Quality & Processing

**Challenge:** Ensure high-quality audio capture and playback across devices.

**Solutions:**
- Vapi Web SDK handles audio capture and playback
- Built-in noise cancellation and automatic gain control
- Vapi handles audio codec selection (Opus)
- Audio quality monitoring via Vapi events
- Test across browsers and devices (Vapi SDK compatible)
- Fallback for poor network conditions (Vapi handles gracefully)

### 4. Accurate Transcription

**Challenge:** Real-time transcription accuracy, especially for sales terminology.

**Solutions:**
- Vapi uses Deepgram Nova-2 for highly accurate transcription
- Can configure custom vocabulary for sales-specific terms
- Vapi streams transcripts in real-time via webhooks
- Post-process transcript with Claude for corrections if needed
- Allow manual transcript editing in review
- Store transcripts as received from Vapi

### 5. Cost Management

**Challenge:** LLM API calls and real-time audio can be expensive.

**Solutions:**

**Scenario Generation:**
- Cache common scenarios (product + persona combinations)
- Use Claude Haiku for simple scenarios, Sonnet for complex
- Estimated cost: $0.01-0.05 per scenario

**Real-time Conversation (Vapi):**
- Vapi pricing breakdown per 15-min session:
  - Speech-to-Text (Deepgram): ~$0.05-0.10 per minute = $0.75-1.50
  - LLM (Claude 3.5 Sonnet): ~$0.015/1K tokens, avg 5K tokens = $0.08
  - Text-to-Speech (Azure): ~$0.016/1K chars, avg 3K chars = $0.05
- Total Vapi cost: ~$0.90-1.65 per 15-min session
- Implement session duration limits (15 min for free tier)
- Use credits/subscription model
- **60-75% cheaper than OpenAI Realtime API**

**Analysis:**
- Use Claude Sonnet (balance of quality and cost)
- Batch analysis if possible (multiple sessions)
- Cache analysis templates
- Estimated cost: $0.05-0.15 per analysis

**Total Cost per Session:** $1.00-1.85 (with Vapi)
**Suggested Pricing:**
- Free tier: 3 sessions/month
- Pro tier: $29/month (30 sessions)
- Team tier: $99/month (100 sessions)

### 6. Scalability

**Challenge:** Handle multiple concurrent voice conversations.

**Solutions:**
- Horizontal scaling of backend services
- Use message queue (Redis Queue, Celery) for async tasks
- Separate services for conversation vs analysis
- Database connection pooling
- CDN for static assets
- Vapi handles voice call infrastructure and scaling

**Architecture for Scale:**
```
                    Load Balancer
                          |
        __________________|__________________
       |                  |                  |
   API Server 1     API Server 2     API Server 3
       |                  |                  |
       |________Message Queue (Redis)________|
                          |
        __________________|__________________
       |                  |                  |
   Worker 1          Worker 2          Worker 3
   (Analysis)        (Analysis)        (Analysis)
```

### 7. Security & Privacy

**Challenge:** Protect user data, especially conversation transcripts.

**Solutions:**
- No audio storage - only transcripts (privacy-friendly)
- Vapi handles secure audio streaming (encrypted connections)
- Implement proper RBAC (users can only access their data)
- GDPR compliance (data deletion, export)
- Transcripts stored securely in PostgreSQL with RLS
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure credential storage (environment variables, secrets manager)
- Vapi webhook authentication with secrets

---

## Cost Optimization Strategies

### 1. Caching Strategy

```python
# Cache scenario generation
# If same product + persona requested, return cached scenario
cache_key = f"scenario:{hash(product_data)}:{hash(persona_data)}:{difficulty}"
cached_scenario = redis.get(cache_key)
if cached_scenario:
    return cached_scenario

# Generate new scenario
scenario = await generate_scenario(...)

# Cache for 7 days
redis.setex(cache_key, 604800, scenario)
```

### 2. Model Selection

```python
# Use cheaper models when appropriate
if difficulty == "easy" and scenario_type == "template":
    model = "claude-3-haiku-20240307"  # Faster, cheaper
else:
    model = "claude-3-5-sonnet-20241022"  # Better quality
```

### 3. Usage Limits

```python
# Free tier limits
FREE_TIER_LIMITS = {
    "sessions_per_month": 3,
    "max_duration_minutes": 10,
    "analysis_detail": "basic"
}

# Pro tier
PRO_TIER_LIMITS = {
    "sessions_per_month": 30,
    "max_duration_minutes": 20,
    "analysis_detail": "comprehensive"
}
```

### 4. Async Processing

```python
# Don't block user on analysis
# Generate quick summary, then detailed analysis async

@app.post("/api/sessions/{session_id}/end")
async def end_session(session_id: str):
    # Quick summary (30 seconds)
    quick_summary = await generate_quick_summary(session_id)

    # Queue detailed analysis (background job)
    analysis_job.delay(session_id)

    return {"summary": quick_summary, "detailed_analysis": "processing"}
```

---

## Future Enhancements

### Phase 5+: Advanced Features

#### 1. Team & Organization Features
- Team dashboards with aggregate stats
- Manager oversight and coaching tools
- Team leaderboards and competitions
- Shared template libraries
- Role-based access control

#### 2. Advanced AI Features
- Multi-persona conversations (role-play with multiple decision-makers)
- Dynamic difficulty adjustment (AI adapts based on performance)
- Personality customization (adjust AI persona traits)
- Industry-specific AI training (specialized models)
- Voice cloning (practice with specific customer types)

#### 3. Integrations
- CRM integration (Salesforce, HubSpot)
  - Import real prospect data
  - Export practice insights
- Calendar integration (schedule practice reminders)
- Slack/Teams notifications
- Zoom/Meet recording analysis (analyze real calls)
- Email integration (analyze email sales sequences)

#### 4. Gamification
- Achievement system (badges, milestones)
- Practice streaks
- Skill trees (unlock advanced scenarios)
- Leaderboards (opt-in)
- Challenges and tournaments
- XP and leveling system

#### 5. Content Library
- Expert-created scenario packs
- Industry-specific templates (SaaS, Real Estate, Insurance, etc.)
- Common objection libraries
- Best practice playbooks
- Video tutorials and tips
- Podcast integration (learn while practicing)

#### 6. Advanced Analytics
- Comparative analysis (vs top performers)
- Predictive analytics (likelihood to hit quota)
- Conversation pattern recognition
- Sentiment analysis
- Tone and pace analysis
- Keyword tracking (buzzwords, competitors mentioned)

#### 7. Mobile App
- Native iOS/Android apps
- Practice on the go
- Offline mode (for review)
- Push notifications
- Voice-only interface

#### 8. API & Developer Platform
- Public API for integrations
- Webhooks for events
- Custom scenario generation via API
- Embed practice widget in other apps
- White-label solution

---

## Success Metrics (KPIs)

### Product Metrics
- **User Engagement:**
  - Daily/Weekly/Monthly Active Users
  - Average sessions per user per month
  - Session completion rate
  - Time spent in practice per week

- **Quality Metrics:**
  - Average session score
  - Score improvement over time
  - User satisfaction (NPS)
  - Feature usage rates

- **Retention:**
  - Day 1, Day 7, Day 30 retention
  - Monthly churn rate
  - Session frequency trend

### Technical Metrics
- **Performance:**
  - API response time (< 200ms for REST)
  - WebSocket latency (< 500ms end-to-end)
  - Audio streaming quality (jitter, packet loss)
  - Transcription accuracy

- **Reliability:**
  - Uptime (target: 99.9%)
  - Error rate (< 1%)
  - Failed session rate (< 2%)

- **Cost Metrics:**
  - Cost per session
  - Cost per user per month
  - LLM API cost breakdown
  - Infrastructure cost

---

## Risk Mitigation

### Technical Risks

**Risk 1: Voice LLM API instability**
- Mitigation: Have fallback provider ready
- Implement circuit breaker pattern
- Queue failed sessions for retry
- Clear user communication on failures

**Risk 2: High costs spiral**
- Mitigation: Strict usage limits
- Real-time cost monitoring
- Alerts for unusual usage
- Optimize prompts and caching aggressively

**Risk 3: Poor audio quality on some devices/networks**
- Mitigation: Extensive device testing
- Graceful degradation
- User audio quality test before session
- Provide troubleshooting guide

### Business Risks

**Risk 1: Low user engagement**
- Mitigation: Focus on onboarding UX
- Gamification and progress visualization
- Email reminders and streak tracking
- Community building

**Risk 2: High churn after initial use**
- Mitigation: Demonstrate clear value quickly
- Progressive difficulty to keep users challenged
- Personalized practice recommendations
- Success stories and case studies

**Risk 3: Competition from established players**
- Mitigation: Focus on specific niche initially
- Superior UX and feedback quality
- Fast iteration based on user feedback
- Community and content differentiation

---

## Conclusion

This system design provides a comprehensive roadmap for building a sales call practice platform. The architecture is scalable, the workflow is user-centric, and the technical stack is modern and proven.

### Key Success Factors:
1. **Low Latency**: Real-time voice must feel natural (< 500ms)
2. **High-Quality Feedback**: Analysis must be actionable and specific
3. **Engaging UX**: Practice should feel like a game, not a chore
4. **Cost-Effective**: Balance quality with sustainable unit economics
5. **Reliable**: High uptime and graceful error handling

### Next Steps:
1. Validate core assumptions with potential users
2. Build MVP focusing on core workflow (Phases 1-2)
3. Test with beta users and iterate rapidly
4. Add analytics and polish (Phase 3)
5. Scale and add advanced features (Phase 4+)

### Recommended Tech Stack Summary:
- **Frontend**: Next.js + React + Tailwind + shadcn/ui
- **Backend**: Python + FastAPI
- **Database**: PostgreSQL (Supabase)
- **Voice AI**: Vapi (with Claude as conversational LLM)
- **Scenario & Analysis**: Claude 3.5 Sonnet
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **Caching** (optional): Redis for scenario caching

This platform has strong potential in the sales enablement space, especially for remote sales teams and individual reps looking to improve their skills. The combination of realistic AI role-play and detailed feedback creates a unique value proposition.

Good luck building! 🚀
