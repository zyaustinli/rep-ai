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
- **RAG-powered product knowledge hints** (ChromaDB + Claude Haiku)
  - Document upload and vectorization (PDF, TXT)
  - Custom content sections
  - Real-time hint display during practice calls
  - AI question classification and semantic search

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Login   │  │Dashboard │  │  Setup   │  │Practice  │       │
│  │Register  │  │          │  │          │  │+ Hints   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                              │Review    │       │
│                                              └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                         ↕ HTTP + Polling (hints)
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Auth Routes   │  │Session Mgmt  │  │Analytics     │         │
│  │Product Routes│  │Vapi Webhooks │  │              │         │
│  │Document API  │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Scenario Gen  │  │Conversation  │  │Analysis      │         │
│  │(Claude)      │  │(Vapi)        │  │(Claude)      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │RAG Classifier│  │Vector Service│  │Doc Processor │         │
│  │(Claude Haiku)│  │(ChromaDB)    │  │(PDF/TXT)     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
            ↕                              ↕
┌─────────────────────┐    ┌──────────────────────────────┐
│   Supabase          │    │   ChromaDB (Local)           │
│  ┌──────────────┐   │    │  ┌────────────────────────┐  │
│  │PostgreSQL    │   │    │  │Vector Storage          │  │
│  │- sessions    │   │    │  │- Product docs          │  │
│  │- session_hints│  │    │  │- Content sections      │  │
│  │- transcripts │   │    │  │- Auto embeddings       │  │
│  └──────────────┘   │    │  │  (all-MiniLM-L6-v2)    │  │
│  ┌──────────────┐   │    │  └────────────────────────┘  │
│  │Auth Service  │   │    │  Persist: ./chroma_data/     │
│  │(JWT)         │   │    └──────────────────────────────┘
│  └──────────────┘   │
└─────────────────────┘
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
  - Anthropic Claude 3.5 Haiku (RAG question classification)
  - Vapi (voice conversations with Claude as LLM)
- **Vector Database**: ChromaDB 1.2+ (local, persistent)
  - Embedding model: all-MiniLM-L6-v2 (384 dimensions)
  - Storage: Local file system (`./chroma_data/`)
- **Document Processing**:
  - PyPDF2 (PDF extraction)
  - tiktoken (token counting for chunking)
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

### 4. RAG Document Processing Flow
```
User uploads document or adds content section
  → POST /api/products/{id}/documents (file upload)
  OR
  → POST /api/products/{id}/vectorize (custom sections)
  → Backend extracts text (PDF/TXT)
  → DocumentProcessor chunks content (~800 tokens, 15% overlap)
  → ChromaDB generates embeddings (all-MiniLM-L6-v2)
  → Vector chunks stored with metadata
  → Frontend receives confirmation
```

### 5. RAG Hint Generation Flow (Real-Time During Call)
```
AI asks question during call
  → Vapi transcript webhook → Backend
  → RAGClassifier checks if question needs product knowledge (Claude Haiku)
  → If YES:
      → VectorService queries ChromaDB (semantic search, top-k=3)
      → Top result saved to session_hints table (hint_text, source, score)
  → Frontend polls GET /api/sessions/{id}/hints every 2 seconds
  → New hints displayed in HintPanel component
  → User can toggle hints visibility (always generated in background)
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
│   │   └── HintPanel.tsx   # RAG hints display with toggle
│   ├── review/             # Review/analysis UI
│   └── ui/                 # Shared UI components
├── lib/                    # Utilities
│   ├── supabase.ts        # Supabase client
│   ├── api.ts             # API client wrapper (includes getHints)
│   └── utils.ts           # Helper functions
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Authentication hook
│   ├── useVapi.ts         # Vapi voice integration
│   └── useHints.ts        # RAG hints polling hook
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
│   │       ├── products.py  # Product CRUD + RAG endpoints
│   │       ├── sessions.py  # Sessions + Vapi webhooks + hints endpoint
│   │       └── analysis.py  # Analytics
│   ├── database/            # Database clients
│   │   └── chroma_client.py # ChromaDB client & collection
│   ├── services/            # Business logic
│   │   ├── scenario_generator.py    # Claude scenario gen
│   │   ├── conversation.py          # Vapi assistant creation & webhooks
│   │   ├── analysis.py              # Claude analysis
│   │   ├── document_processor.py    # PDF/TXT extraction & chunking
│   │   ├── vector_service.py        # ChromaDB operations
│   │   └── rag_classifier.py        # Claude Haiku classifier
│   └── utils/
│       ├── prompts.py       # Prompt templates
│       └── chunking.py      # Text chunking utilities
├── chroma_data/             # ChromaDB persistent storage
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

#### DocumentProcessor
- Extracts text from PDF and TXT files
- Semantic chunking (~800 tokens per chunk, 15% overlap)
- Preserves context across chunk boundaries
- Uses tiktoken for accurate token counting
- Handles multiple document formats

#### VectorService
- Manages ChromaDB vector storage and retrieval
- Adds product documents and custom sections
- Generates embeddings automatically (all-MiniLM-L6-v2)
- Performs semantic search (cosine similarity)
- Chunks are stored with metadata (product_id, source_type, source_name)
- Query method returns top-k relevant chunks with similarity scores

#### RAGClassifier
- Fast AI question classification using Claude 3.5 Haiku
- Determines if questions need product knowledge assistance
- Classifies as "PRODUCT" (pricing, features, specs) or "CONVERSATIONAL" (greetings, discovery)
- 3-second timeout for reliability
- ~200-500ms response time
- Falls back to showing hints on timeout (errs on side of helpfulness)

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

#### 6. session_hints (RAG System)
```sql
id                  UUID PRIMARY KEY
session_id          UUID → sessions(id)
question            TEXT (AI's question that triggered hint)
hint_text           TEXT (the answer/hint to display)
hint_data           JSONB (full RAG results with all chunks)
source_type         TEXT ("section" or "document")
source_name         TEXT (human-readable source name)
relevance_score     FLOAT (0-1 similarity score)
delivered           BOOLEAN (whether hint was delivered to frontend)
delivered_at        TIMESTAMP
created_at          TIMESTAMP
```

### Relationships
- `profiles` ← `products` (one-to-many)
- `profiles` ← `sessions` (one-to-many)
- `products` ← `sessions` (one-to-many, nullable)
- `sessions` ← `transcripts` (one-to-one)
- `sessions` ← `analyses` (one-to-one)
- `sessions` ← `session_hints` (one-to-many)

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

#### RAG / Product Knowledge (NEW)
- `POST /api/products/{id}/vectorize` - Add custom content sections to ChromaDB
- `POST /api/products/{id}/documents` - Upload and vectorize document (PDF/TXT)
- `DELETE /api/products/{id}/vectors` - Delete all vectors for a product
- `GET /api/products/{id}/vectors/stats` - Get vectorization statistics

#### Sessions
- `POST /api/sessions/generate-scenario` - Generate AI scenario
- `POST /api/sessions` - Create new session + Vapi assistant
- `GET /api/sessions` - List sessions (paginated)
- `GET /api/sessions/{id}` - Get session details
- `GET /api/sessions/{id}/transcript` - Get session transcript
- `POST /api/sessions/{id}/analyze` - Trigger analysis
- `GET /api/sessions/{id}/hints` - Poll for RAG hints (frontend polls every 2s)
- `POST /api/vapi/webhooks` - Vapi webhook handler for events (includes RAG pipeline)

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

#### PostgreSQL (Supabase)
1. Create a Supabase project
2. Go to SQL Editor in Supabase dashboard
3. Run the SQL queries from `docs/DATABASE_SETUP.sql`
4. Run the RAG migration from `docs/DATABASE_MIGRATIONS_RAG_PHASE3.sql`
5. Enable Row Level Security policies

#### ChromaDB (Local)
ChromaDB initializes automatically on first run:
1. Data persists in `./backend/chroma_data/` directory
2. No API keys or external services needed
3. Embeddings generated automatically using all-MiniLM-L6-v2
4. Collection `product_knowledge` created on startup

To verify ChromaDB is working:
```bash
cd backend
source venv/bin/activate
python -c "from app.database.chroma_client import is_chromadb_available; print('ChromaDB:', is_chromadb_available())"
```

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
- **Scenario Generation**: $0.01-0.05 (Claude Sonnet)
- **Voice Conversation**: $0.90-1.65 for 15 min (Vapi with Claude)
  - STT (Deepgram): ~$0.75-1.50
  - LLM (Claude Sonnet): ~$0.08
  - TTS (Azure): ~$0.05
- **RAG Hints** (NEW): $0.001-0.01 per session (Claude Haiku)
  - Question classification: ~$0.0001 per call (avg 5-10 classifications)
  - Vector search: Free (local ChromaDB)
  - Typical session: $0.001-0.01
- **Analysis**: $0.05-0.15 (Claude Sonnet)
- **Total**: ~$1.00-1.90 per session (60-75% cheaper than OpenAI Realtime)

### Infrastructure (Monthly)
- **Supabase**: Free tier (10GB database)
- **ChromaDB**: Free (local storage, ~100MB per 10k documents)
- **Vercel**: Free tier (hobby projects)
- **Backend Hosting**: $5-20/month (Railway/Render) + storage for chroma_data
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

## RAG System Architecture (Product Knowledge Hints)

### Overview
The RAG (Retrieval-Augmented Generation) system provides real-time product knowledge hints during practice sessions. When the AI persona asks questions about the product, the system automatically searches the knowledge base and displays relevant information to help the user respond effectively.

### Components

#### 1. Document Processing Pipeline
```
User Upload → Text Extraction → Semantic Chunking → Embedding Generation → Vector Storage
```

**Features**:
- Supports PDF and TXT files
- Extracts clean text from documents
- Semantic chunking (~800 tokens, 15% overlap)
- Automatic embedding generation (all-MiniLM-L6-v2)
- Metadata tracking (source, product_id, user_id)

#### 2. RAG Classifier (Claude 3.5 Haiku)
**Purpose**: Determines if AI questions need product knowledge assistance

**Classification**:
- **PRODUCT**: Questions about pricing, features, specs, integrations, comparisons
- **CONVERSATIONAL**: Greetings, discovery, small talk, relationship building

**Performance**:
- Response time: ~200-500ms
- Accuracy: 95%+ (tested on sample questions)
- Cost: ~$0.0001 per classification
- Timeout: 3 seconds (falls back to showing hint)

#### 3. Vector Search (ChromaDB)
**Storage**:
- Local persistent storage (`./chroma_data/`)
- Collection: `product_knowledge`
- Embedding model: all-MiniLM-L6-v2 (384 dimensions)
- Similarity: Cosine similarity

**Query Process**:
1. User's question is converted to embedding
2. Semantic search finds top-k similar chunks (k=3)
3. Results include similarity scores (0-1)
4. Returns text, source attribution, and metadata

#### 4. Hint Delivery System
**Architecture**: Database Middleman + Frontend Polling

**Flow**:
```
AI question → Webhook → Classifier → Vector Search → Database → Polling → Display
```

**Features**:
- Hints always generated (regardless of user preference)
- Frontend polls every 2 seconds during active calls
- Toggle show/hide (hints accumulate in background)
- Delivery tracking (prevents duplicates)
- Graceful degradation (errors never break session)

#### 5. Frontend Integration
**Components**:
- `useHints` hook: Polling logic
- `HintPanel` component: Collapsible display with toggle
- Simple hint display (just the answer text)

**User Experience**:
- Non-intrusive sidebar panel
- Scrollable list of hints (latest at top)
- Badge showing hint count
- Empty state: "Listening for questions..."

### Data Models

#### ChromaDB Vector Document
```json
{
  "id": "product-uuid_section_0_chunk_5",
  "document": "Our pricing model includes three tiers...",
  "metadata": {
    "product_id": "uuid",
    "user_id": "uuid",
    "source_type": "section",  // or "document"
    "source_name": "Pricing",
    "chunk_index": 5,
    "chunk_total": 10,
    "token_count": 842
  },
  "embedding": [0.1, -0.3, ...] // 384 dimensions
}
```

#### session_hints Table
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "question": "What's your pricing?",
  "hint_text": "We offer three tiers: Basic ($29/mo)...",
  "hint_data": {...},  // Full RAG results
  "source_type": "section",
  "source_name": "Pricing",
  "relevance_score": 0.89,
  "delivered": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Performance Characteristics

**Latency Breakdown** (per hint):
- Classifier: 200-500ms (Claude Haiku)
- Vector search: 50-100ms (ChromaDB)
- Database write: 50ms (Supabase)
- **Total backend**: ~300-650ms
- **Polling delay**: 0-2000ms (frontend polls every 2s)
- **Total delivery time**: 300ms - 2.6s

**Scalability**:
- ChromaDB handles 100k+ documents efficiently
- Local storage: ~1MB per 100 chunks
- No external API limits (except classifier)
- Single backend instance supports 50+ concurrent sessions

**Reliability**:
- Classifier timeout: 3s (then show hint anyway)
- Database failures: Logged, hint skipped
- Vector search failures: Logged, hint skipped
- **Session never breaks** (graceful degradation)

### Configuration

**Tunable Parameters**:
```python
# Chunking
CHUNK_SIZE = 800  # tokens
CHUNK_OVERLAP = 0.15  # 15%

# RAG Query
TOP_K = 3  # number of results to retrieve
SIMILARITY_THRESHOLD = 0.5  # minimum similarity score

# Classifier
CLASSIFIER_TIMEOUT = 3.0  # seconds
CLASSIFIER_MODEL = "claude-3-5-haiku-20241022"

# Frontend Polling
POLL_INTERVAL = 2000  # milliseconds
```

### Usage Example

**1. Upload Product Knowledge**:
```bash
curl -X POST /api/products/{id}/vectorize \
  -H "Authorization: Bearer {token}" \
  -d '{
    "sections": [
      {
        "name": "Pricing",
        "content": "We offer three tiers..."
      }
    ]
  }'
```

**2. During Practice Call**:
```
AI: "What's your pricing?"
  → Webhook received
  → Classifier: "PRODUCT" (250ms)
  → Vector search: top result with 0.89 similarity
  → Hint saved to database
  → Frontend polls and displays hint
```

**3. Frontend Display**:
```
┌─────────────────────────┐
│ 💡 Product Hints   [👁️] │
├─────────────────────────┤
│ We offer three tiers:   │
│ Basic ($29/mo)...       │
└─────────────────────────┘
```

### Limitations & Trade-offs

**Current Limitations**:
- English-only support
- Text-based documents only (no images)
- Local ChromaDB (not distributed)
- Simple chunking (no advanced NLP)

**Trade-offs Made**:
- **Polling vs WebSocket**: Simpler, more reliable (acceptable 1-2s delay)
- **Local vs Cloud Vector DB**: Faster, cheaper, no API limits
- **Always-on RAG**: Generates hints even when hidden (small cost increase)
- **Simple classification**: Fast binary decision (vs complex routing)

### Monitoring & Debugging

**Key Metrics to Track**:
- Hint generation success rate
- Average hint delivery time
- Classifier accuracy
- Vector search relevance scores
- ChromaDB collection size

**Logs to Monitor**:
```python
logger.info(f"✅ Hint saved for session {session_id}")
logger.warning(f"Classifier timeout after 3s")
logger.error(f"RAG pipeline error: {e}")
```

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
