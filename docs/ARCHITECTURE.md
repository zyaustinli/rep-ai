# Sales Call Practice Platform - MVP Architecture

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Data Flow](#data-flow)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Database Schema](#database-schema)
8. [API Design](#api-design)
9. [Authentication & Authorization](#authentication--authorization)
10. [Setup Instructions](#setup-instructions)
11. [Deployment](#deployment)

---

## Overview

The Sales Call Practice Platform is an AI-powered application that enables users to practice sales calls through realistic role-play scenarios. The platform uses Claude for scenario generation and analysis, and Vapi for voice conversations.

### Core Features (MVP)
- User authentication (email/password)
- Product and persona configuration
- AI-generated scenarios (Claude API)
- Real-time voice conversations (Vapi)
- Post-call analysis and grading (Claude API)
- Basic dashboard with session history

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Login   │  │Dashboard │  │  Setup   │  │Practice  │       │
│  │Register  │  │          │  │          │  │  Review  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                         ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Auth Routes   │  │Session Mgmt  │  │Analytics     │         │
│  │Product Routes│  │WebSocket     │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Scenario Gen  │  │Conversation  │  │Analysis      │         │
│  │(Claude)      │  │(Vapi)        │  │(Claude)      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase                                      │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │PostgreSQL    │  │Auth Service  │                            │
│  │(Database)    │  │(JWT)         │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Auth**: Supabase Auth Client
- **Audio**: Web Audio API
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database Client**: Supabase Python SDK
- **Auth**: Supabase Auth + JWT
- **AI APIs**:
  - Anthropic Claude 3.5 Sonnet (scenario generation & analysis)
  - Vapi (voice conversations with Claude as LLM)
- **WebSocket**: Vapi handles audio streaming; Backend uses webhooks

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**:
  - Frontend: Vercel (recommended)
  - Backend: Railway / Render / AWS (recommended)

---

## Data Flow

### 1. Scenario Generation Flow
```
User Input (Product + Persona)
  → Frontend validates input
  → POST /api/sessions/generate-scenario
  → Backend builds prompt
  → Claude API generates scenario
  → Scenario stored temporarily
  → Frontend displays scenario preview
```

### 2. Practice Session Flow
```
User starts session
  → POST /api/sessions (create session + Vapi assistant)
  → Backend creates Vapi assistant with scenario as system prompt
  → Backend returns assistant_id to frontend
  → Frontend starts Vapi call using Web SDK
  → Audio streaming via Vapi (User ↔ Vapi Cloud ↔ Claude LLM)
  → Vapi sends transcripts to backend via webhooks
  → Transcript collected in real-time in database
  → User ends session
  → Vapi webhook triggers session completion
  → Session status → "completed"
```

### 3. Analysis Flow
```
Session completed
  → POST /api/sessions/{id}/analyze
  → Backend retrieves session + transcript
  → Claude API analyzes performance
  → Analysis saved to database
  → Frontend displays results
```

---

## Frontend Architecture

### Directory Structure
```
frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Main dashboard
│   ├── setup/               # Session setup wizard
│   ├── practice/[sessionId]/ # Practice interface
│   ├── review/[sessionId]/  # Review & analysis
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── auth/               # Auth forms
│   ├── dashboard/          # Dashboard widgets
│   ├── setup/              # Setup forms
│   ├── practice/           # Practice UI
│   ├── review/             # Review/analysis UI
│   └── ui/                 # Shared UI components
├── lib/                    # Utilities
│   ├── supabase.ts        # Supabase client
│   ├── api.ts             # API client wrapper
│   └── utils.ts           # Helper functions
├── hooks/                  # Custom React hooks
│   └── useAuth.ts         # Authentication hook
├── types/                  # TypeScript definitions
│   └── index.ts           # Shared types
├── store/                  # Zustand stores
│   └── sessionStore.ts    # Session state
└── public/                 # Static assets
```

### Key Components

#### Authentication Flow
- `useAuth` hook manages auth state
- Supabase Auth handles registration/login
- JWT tokens stored in HTTP-only cookies
- Protected routes check auth status

#### State Management
- **Zustand** for global state (simple, lightweight)
- Session store tracks active practice session
- Local state for component-specific data

#### Real-time Features
- WebSocket connection for audio streaming
- Audio visualizer shows speaking activity
- Live transcript display during practice

---

## Backend Architecture

### Directory Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── database.py          # Supabase client
│   ├── models/              # (Future: SQLAlchemy models)
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── session.py
│   │   └── analysis.py
│   ├── api/
│   │   ├── deps.py          # Dependencies (auth)
│   │   └── routes/          # API endpoints
│   │       ├── auth.py      # User/profile routes
│   │       ├── products.py  # Product CRUD
│   │       ├── sessions.py  # Sessions + WebSocket
│   │       └── analysis.py  # Analytics
│   ├── services/            # Business logic
│   │   ├── scenario_generator.py  # Claude scenario gen
│   │   ├── conversation.py        # Vapi assistant creation & webhooks
│   │   └── analysis.py            # Claude analysis
│   └── utils/
│       └── prompts.py       # Prompt templates
└── requirements.txt
```

### Services Layer

#### ScenarioGenerator
- Takes product, persona, and preferences
- Builds comprehensive prompt for Claude
- Returns structured scenario JSON
- Includes persona details, objections, success criteria

#### ConversationService
- Creates Vapi assistants with scenario prompts
- Handles Vapi webhook events (transcripts, call status)
- Stores transcripts in real-time as webhooks arrive
- No direct audio streaming (handled by Vapi)

#### AnalysisService
- Analyzes completed sessions
- Grades across 7 sales dimensions
- Identifies key moments
- Provides actionable recommendations

---

## Database Schema

### Tables

#### 1. profiles (extends Supabase auth.users)
```sql
id                    UUID PRIMARY KEY
email                 TEXT NOT NULL
full_name             TEXT
role                  TEXT (e.g., "Sales Rep")
experience_level      TEXT (beginner/intermediate/advanced)
created_at            TIMESTAMP
```

#### 2. products
```sql
id                       UUID PRIMARY KEY
user_id                  UUID → profiles(id)
name                     TEXT NOT NULL
description              TEXT
price                    NUMERIC
features                 JSONB (array of strings)
unique_selling_points    JSONB (array of strings)
target_market            TEXT
competitors              JSONB (array of strings)
created_at               TIMESTAMP
updated_at               TIMESTAMP
```

#### 3. sessions
```sql
id                  UUID PRIMARY KEY
user_id             UUID → profiles(id)
product_id          UUID → products(id) (nullable)
scenario            JSONB (full scenario object)
difficulty          TEXT (easy/medium/hard/expert)
call_type           TEXT (cold/warm/follow-up/closing)
duration_seconds    INTEGER
status              TEXT (pending/in_progress/completed/failed)
started_at          TIMESTAMP
completed_at        TIMESTAMP
overall_score       INTEGER (0-100)
overall_grade       TEXT (A+, A, A-, etc.)
created_at          TIMESTAMP
```

#### 4. transcripts
```sql
id                      UUID PRIMARY KEY
session_id              UUID → sessions(id)
entries                 JSONB (array of transcript entries)
total_user_words        INTEGER
total_ai_words          INTEGER
user_talk_time_seconds  INTEGER
ai_talk_time_seconds    INTEGER
questions_asked         INTEGER
created_at              TIMESTAMP
```

#### 5. analyses
```sql
id                          UUID PRIMARY KEY
session_id                  UUID → sessions(id)
discovery_score             INTEGER (0-100)
product_knowledge_score     INTEGER (0-100)
objection_handling_score    INTEGER (0-100)
rapport_building_score      INTEGER (0-100)
value_communication_score   INTEGER (0-100)
closing_score               INTEGER (0-100)
communication_score         INTEGER (0-100)
strengths                   JSONB (object with arrays)
weaknesses                  JSONB (object with arrays)
key_moments                 JSONB (array of moments)
recommendations             JSONB (array of recommendations)
detailed_feedback           TEXT
created_at                  TIMESTAMP
```

### Relationships
- `profiles` ← `products` (one-to-many)
- `profiles` ← `sessions` (one-to-many)
- `products` ← `sessions` (one-to-many, nullable)
- `sessions` ← `transcripts` (one-to-one)
- `sessions` ← `analyses` (one-to-one)

---

## API Design

### Base URL
- Development: `http://localhost:8000`
- Production: `https://api.yourdomain.com`

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Authentication & User
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update user profile
- `GET /api/auth/me/stats` - Get user statistics

#### Products
- `GET /api/products` - List user's products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `PATCH /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

#### Sessions
- `POST /api/sessions/generate-scenario` - Generate AI scenario
- `POST /api/sessions` - Create new session + Vapi assistant
- `GET /api/sessions` - List sessions (paginated)
- `GET /api/sessions/{id}` - Get session details
- `GET /api/sessions/{id}/transcript` - Get session transcript
- `POST /api/sessions/{id}/analyze` - Trigger analysis
- `POST /api/vapi/webhooks/{sessionId}` - Vapi webhook handler for events

#### Analytics
- `GET /api/analytics/overview` - Overview stats
- `GET /api/analytics/progress` - Progress over time
- `GET /api/analytics/skills` - Skill breakdown

### Vapi Integration

#### Frontend (Vapi Web SDK)
```typescript
import Vapi from '@vapi-ai/web';

const vapi = new Vapi(publicKey);

// Start call with assistant ID from backend
vapi.start(assistantId);

// Listen for events
vapi.on('call-start', () => { /* Call started */ });
vapi.on('speech-start', () => { /* AI speaking */ });
vapi.on('speech-end', () => { /* AI finished speaking */ });
vapi.on('call-end', () => { /* Call ended, fetch analysis */ });
vapi.on('message', (message) => {
  if (message.type === 'transcript') {
    // Display transcript in UI
    displayTranscript(message);
  }
});

// End call
vapi.stop();
```

#### Backend (Vapi Webhooks)
Vapi sends events to `POST /api/vapi/webhooks/{sessionId}`:

**Event Types:**
- `call-start`: Call initiated
- `transcript`: Transcript entry (speaker, text, timestamp)
- `status-update`: Call status changed
- `call-end`: Call completed (includes final transcript, duration)

**Example Webhook Payload:**
```json
{
  "type": "transcript",
  "timestamp": "2024-01-15T10:30:00Z",
  "transcript": {
    "role": "user",
    "content": "Can you tell me about your pricing?",
    "timestamp": 1234567890
  }
}
```

---

## Authentication & Authorization

### Supabase Auth
- Email/password authentication
- JWT tokens with configurable expiry
- Automatic token refresh
- Row Level Security (RLS) on database

### Authorization Flow
1. User signs up/logs in via Supabase Auth
2. Supabase returns JWT token
3. Frontend stores token (handled by Supabase client)
4. All API requests include token in Authorization header
5. Backend validates token with Supabase
6. User ID extracted from token for queries

### Row Level Security (RLS)
Enable RLS on all tables:
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- etc.
```

Create policies to ensure users can only access their own data:
```sql
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- etc.
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account
- Anthropic API key
- Vapi API key

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn app.main:app --reload
```

### Database Setup
1. Create a Supabase project
2. Go to SQL Editor in Supabase dashboard
3. Run the SQL queries from `docs/DATABASE_SETUP.sql`
4. Enable Row Level Security policies

### Environment Variables

**Frontend (.env.local)**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
```

**Backend (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=your_anthropic_key
VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_SECRET=your_webhook_secret
BACKEND_URL=http://localhost:8000
```

---

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Add environment variables
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Database (Supabase)
- Already hosted by Supabase
- Ensure RLS policies are enabled
- Set up backups (automatic with Supabase)

---

## Future Enhancements

### Phase 2
- Template library for common scenarios
- Advanced analytics dashboard
- Team features
- Session comparison

### Phase 3
- Mobile app
- Voice customization
- Multi-language support
- CRM integrations

### Technical Improvements
- Redis caching for scenarios
- Background job processing (Celery/RQ)
- Comprehensive testing suite
- CI/CD pipeline
- Voice customization (upgrade to ElevenLabs TTS)

---

## Cost Estimates (MVP)

### Per Session Costs
- **Scenario Generation**: $0.01-0.05 (Claude API)
- **Voice Conversation**: $0.90-1.65 for 15 min (Vapi with Claude)
  - STT (Deepgram): ~$0.75-1.50
  - LLM (Claude): ~$0.08
  - TTS (Azure): ~$0.05
- **Analysis**: $0.05-0.15 (Claude API)
- **Total**: ~$1.00-1.85 per session (60-75% cheaper than OpenAI Realtime)

### Infrastructure (Monthly)
- **Supabase**: Free tier (10GB database)
- **Vercel**: Free tier (hobby projects)
- **Backend Hosting**: $5-20/month (Railway/Render)
- **Vapi**: Pay-per-use (no fixed costs)

### Recommended Pricing
- **Free Tier**: 3 sessions/month
- **Pro Tier**: $29/month (30 sessions) = ~$0.97/session
- **Team Tier**: $99/month (100 sessions) = ~$0.99/session

---

## Security Considerations

1. **Authentication**: Supabase Auth with JWT
2. **Authorization**: Row Level Security on all tables
3. **API Keys**: Stored in environment variables, never exposed to client
4. **CORS**: Configured to allow only trusted origins
5. **Input Validation**: Pydantic schemas on backend, Zod on frontend
6. **Rate Limiting**: (TODO: Add rate limiting middleware)
7. **Data Encryption**: Supabase handles encryption at rest

---

## Support & Resources

- **Project Documentation**: `/docs/`
- **API Documentation**: `http://localhost:8000/docs` (when running backend)
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs

---

## License

MIT
