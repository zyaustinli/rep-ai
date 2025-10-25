# Sales Call Practice Platform - Project Structure

## Overview
This is a monorepo structure for the Sales Call Practice Platform. The project uses:
- **Frontend**: Next.js 14+ (App Router) with React 18, TypeScript, Tailwind CSS
- **Backend**: Python FastAPI with async/await
- **Database**: PostgreSQL + Redis
- **LLM**: Claude API (scenario generation & analysis) + OpenAI Realtime API (voice conversation)

---

## Directory Structure

```
convo-ai/
├── frontend/                          # Next.js frontend application
│   ├── public/                        # Static assets
│   │   ├── images/                    # Image assets
│   │   ├── audio/                     # Audio assets
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── app/                       # Next.js App Router pages
│   │   │   ├── page.tsx              # Home/Landing page
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── dashboard/            # User dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── setup/                # Practice session setup
│   │   │   │   └── page.tsx
│   │   │   ├── practice/             # Practice session interface
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx
│   │   │   ├── review/               # Session review and analysis
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx
│   │   │   ├── history/              # Session history
│   │   │   │   └── page.tsx
│   │   │   ├── profile/              # User profile and settings
│   │   │   │   └── page.tsx
│   │   │   └── api/                  # API routes (if needed)
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── auth/                 # Authentication components
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── OnboardingFlow.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   │
│   │   │   ├── dashboard/            # Dashboard components
│   │   │   │   ├── StatsOverview.tsx
│   │   │   │   ├── RecentSessions.tsx
│   │   │   │   ├── ProgressChart.tsx
│   │   │   │   ├── SkillBreakdown.tsx
│   │   │   │   └── QuickStartCard.tsx
│   │   │   │
│   │   │   ├── setup/                # Setup flow components
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   ├── PersonaBuilder.tsx
│   │   │   │   ├── TemplateLibrary.tsx
│   │   │   │   ├── DifficultySelector.tsx
│   │   │   │   └── PreferencesPanel.tsx
│   │   │   │
│   │   │   ├── practice/             # Practice session components
│   │   │   │   ├── ConversationView.tsx
│   │   │   │   ├── AudioVisualizer.tsx
│   │   │   │   ├── TranscriptLive.tsx
│   │   │   │   ├── TimerDisplay.tsx
│   │   │   │   ├── NotesPanel.tsx
│   │   │   │   └── ControlBar.tsx
│   │   │   │
│   │   │   ├── review/               # Review and analysis components
│   │   │   │   ├── ScoreOverview.tsx
│   │   │   │   ├── CategoryBreakdown.tsx
│   │   │   │   ├── TranscriptViewer.tsx
│   │   │   │   ├── KeyMoments.tsx
│   │   │   │   ├── RecommendationsPanel.tsx
│   │   │   │   └── CompareSession.tsx
│   │   │   │
│   │   │   ├── history/              # History components
│   │   │   │   ├── SessionList.tsx
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   ├── ComparisonView.tsx
│   │   │   │   └── ExportData.tsx
│   │   │   │
│   │   │   ├── profile/              # Profile components
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   ├── SubscriptionManagement.tsx
│   │   │   │   ├── NotificationSettings.tsx
│   │   │   │   └── IntegrationSettings.tsx
│   │   │   │
│   │   │   └── shared/               # Shared/reusable UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Loading.tsx
│   │   │
│   │   ├── stores/                   # Zustand state management
│   │   │   ├── sessionStore.ts       # Practice session state
│   │   │   ├── userStore.ts          # User profile and auth state
│   │   │   └── analyticsStore.ts     # Analytics and stats state
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useSession.ts         # Session management hook
│   │   │   ├── useAudio.ts           # Audio recording/playback hook
│   │   │   ├── useWebSocket.ts       # WebSocket connection hook
│   │   │   ├── useAuth.ts            # Authentication hook
│   │   │   └── useAnalytics.ts       # Analytics hook
│   │   │
│   │   ├── lib/                      # Core utilities and clients
│   │   │   ├── api.ts                # API client (fetch wrapper)
│   │   │   ├── auth.ts               # Auth utilities (NextAuth, etc.)
│   │   │   ├── audio.ts              # Web Audio API utilities
│   │   │   └── websocket.ts          # WebSocket client
│   │   │
│   │   ├── types/                    # TypeScript types and interfaces
│   │   │   ├── index.ts              # Barrel exports
│   │   │   ├── session.ts            # Session-related types
│   │   │   ├── user.ts               # User-related types
│   │   │   ├── analysis.ts           # Analysis-related types
│   │   │   ├── product.ts            # Product-related types
│   │   │   └── template.ts           # Template-related types
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── format.ts             # Formatting utilities (dates, numbers, etc.)
│   │   │   ├── validation.ts         # Validation helpers
│   │   │   └── constants.ts          # Constants
│   │   │
│   │   ├── styles/                   # Global styles
│   │   │   ├── globals.css           # Global CSS
│   │   │   └── variables.css         # CSS variables
│   │   │
│   │   └── __tests__/                # Frontend tests
│   │       ├── components/           # Component tests
│   │       ├── hooks/                # Hook tests
│   │       ├── utils/                # Utility tests
│   │       └── setup.ts              # Test setup
│   │
│   ├── package.json                  # Frontend dependencies
│   ├── tsconfig.json                 # TypeScript config
│   ├── next.config.js                # Next.js config
│   ├── tailwind.config.ts            # Tailwind CSS config
│   ├── postcss.config.js             # PostCSS config
│   └── .eslintrc.json                # ESLint config
│
├── backend/                          # FastAPI backend application
│   ├── api/                          # API route handlers
│   │   ├── auth/                     # Authentication endpoints
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # POST /auth/login, /auth/register, etc.
│   │   │
│   │   ├── users/                    # User endpoints
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # GET /users/me, PATCH /users/me, etc.
│   │   │
│   │   ├── products/                 # Product endpoints
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # CRUD for products
│   │   │
│   │   ├── templates/                # Template endpoints
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # GET /templates, etc.
│   │   │
│   │   ├── sessions/                 # Session endpoints
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # POST /sessions, GET /sessions/:id, etc.
│   │   │
│   │   └── analytics/                # Analytics endpoints
│   │       ├── __init__.py
│   │       └── routes.py            # GET /analytics/overview, etc.
│   │
│   ├── services/                     # Business logic services
│   │   ├── auth/                     # Authentication service
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py      # Main auth service
│   │   │   ├── jwt_handler.py       # JWT token handling
│   │   │   └── oauth_handler.py     # OAuth integration
│   │   │
│   │   ├── scenario/                 # Scenario generation service
│   │   │   ├── __init__.py
│   │   │   ├── scenario_generator.py  # Main scenario generation
│   │   │   ├── prompt_builder.py     # Build prompts for Claude
│   │   │   └── scenario_parser.py    # Parse Claude responses
│   │   │
│   │   ├── conversation/             # Real-time conversation service
│   │   │   ├── __init__.py
│   │   │   ├── conversation_service.py  # Manage voice conversations
│   │   │   ├── audio_handler.py        # Audio processing
│   │   │   └── transcript_collector.py  # Collect transcripts
│   │   │
│   │   ├── analysis/                 # Post-call analysis service
│   │   │   ├── __init__.py
│   │   │   ├── analysis_service.py     # Main analysis service
│   │   │   ├── grading_engine.py       # Score calculation
│   │   │   ├── key_moment_extractor.py # Extract key moments
│   │   │   └── metrics_calculator.py   # Calculate metrics
│   │   │
│   │   └── analytics/                # User analytics service
│   │       ├── __init__.py
│   │       ├── analytics_service.py    # Main analytics service
│   │       ├── stats_aggregator.py     # Aggregate stats
│   │       └── recommendation_engine.py # Generate recommendations
│   │
│   ├── models/                       # SQLAlchemy database models
│   │   ├── __init__.py
│   │   ├── user.py                   # User model
│   │   ├── product.py                # Product model
│   │   ├── session.py                # Session model
│   │   ├── transcript.py             # Transcript model
│   │   ├── analysis.py               # Analysis model
│   │   ├── template.py               # Template model
│   │   ├── achievement.py            # Achievement model
│   │   └── audio_file.py             # AudioFile model
│   │
│   ├── schemas/                      # Pydantic schemas (validation)
│   │   ├── __init__.py
│   │   ├── auth.py                   # Auth request/response schemas
│   │   ├── user.py                   # User schemas
│   │   ├── product.py                # Product schemas
│   │   ├── session.py                # Session schemas
│   │   ├── scenario.py               # Scenario schemas
│   │   ├── analysis.py               # Analysis schemas
│   │   └── template.py               # Template schemas
│   │
│   ├── database/                     # Database configuration
│   │   ├── __init__.py
│   │   ├── connection.py             # PostgreSQL connection
│   │   └── redis_client.py           # Redis client
│   │
│   ├── websockets/                   # WebSocket handling
│   │   ├── __init__.py
│   │   ├── connection_manager.py     # Manage WebSocket connections
│   │   └── handlers/
│   │       ├── __init__.py
│   │       └── conversation_handler.py  # Handle conversation WebSocket
│   │
│   ├── utils/                        # Utility functions
│   │   ├── __init__.py
│   │   ├── exceptions.py             # Custom exceptions
│   │   ├── validators.py             # Validation helpers
│   │   ├── helpers.py                # General helpers
│   │   └── llm_clients.py            # LLM API clients (Claude, OpenAI)
│   │
│   ├── tests/                        # Backend tests
│   │   ├── __init__.py
│   │   ├── conftest.py               # Pytest configuration
│   │   ├── unit/                     # Unit tests
│   │   ├── integration/              # Integration tests
│   │   └── e2e/                      # End-to-end tests
│   │
│   ├── main.py                       # FastAPI application entry point
│   ├── config.py                     # Configuration management
│   ├── dependencies.py               # Dependency injection
│   ├── requirements.txt              # Python dependencies
│   ├── pyproject.toml                # Python project config
│   ├── .env.example                  # Environment variables example
│   └── alembic.ini                   # Alembic migration config
│
├── database/                         # Database scripts
│   ├── migrations/                   # SQL migrations
│   │   ├── 001_initial_schema.sql    # Initial database schema
│   │   ├── 002_add_indexes.sql       # Performance indexes
│   │   └── 003_add_templates.sql     # Template table
│   │
│   └── seeds/                        # Seed data
│       ├── dev_users.sql             # Development user data
│       └── sample_templates.sql      # Sample scenario templates
│
├── shared/                           # Shared code between frontend/backend
│   ├── types/                        # Shared TypeScript types
│   │   ├── session.ts
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── analysis.ts
│   │   └── scenario.ts
│   │
│   └── constants/                    # Shared constants
│       ├── api-endpoints.ts
│       ├── error-codes.ts
│       └── feature-flags.ts
│
├── config/                           # Infrastructure configuration
│   ├── docker-compose.yml            # Docker services (Postgres, Redis)
│   ├── .env.example                  # Environment variables template
│   └── .env.local.example            # Local development env vars
│
├── scripts/                          # Utility scripts
│   ├── setup.sh                      # Initial setup script
│   ├── start-dev.sh                  # Start development servers
│   ├── run-migrations.sh             # Run database migrations
│   └── seed-db.sh                    # Seed database with sample data
│
├── docs/                             # Documentation
│   ├── API.md                        # API documentation
│   ├── ARCHITECTURE.md               # Architecture overview
│   ├── DEPLOYMENT.md                 # Deployment guide
│   └── DEVELOPMENT.md                # Development guide
│
├── .gitignore                        # Git ignore rules
├── .dockerignore                     # Docker ignore rules
├── README.md                         # Project README
├── CLAUDE.md                         # System design document (already exists)
├── PROJECT_STRUCTURE.md              # This file
├── LICENSE                           # License file
└── CONTRIBUTING.md                   # Contributing guidelines

```

---

## Key Components by Feature

### 1. Authentication Flow
**Frontend:**
- `frontend/src/components/auth/` - Auth UI components
- `frontend/src/hooks/useAuth.ts` - Auth state management
- `frontend/src/lib/auth.ts` - Auth utilities

**Backend:**
- `backend/api/auth/routes.py` - Auth endpoints
- `backend/services/auth/` - Auth business logic
- `backend/models/user.py` - User model

### 2. Scenario Generation (Phase 1)
**Frontend:**
- `frontend/src/app/setup/page.tsx` - Setup page
- `frontend/src/components/setup/` - Setup form components

**Backend:**
- `backend/api/sessions/routes.py` - POST /sessions/generate-scenario
- `backend/services/scenario/scenario_generator.py` - Claude API integration
- `backend/models/session.py` - Session model

### 3. Real-time Conversation (Phase 2)
**Frontend:**
- `frontend/src/app/practice/[sessionId]/page.tsx` - Practice interface
- `frontend/src/components/practice/` - Practice components
- `frontend/src/hooks/useWebSocket.ts` - WebSocket hook
- `frontend/src/hooks/useAudio.ts` - Audio handling

**Backend:**
- `backend/websockets/handlers/conversation_handler.py` - WebSocket handler
- `backend/services/conversation/` - Conversation management
- `backend/models/transcript.py` - Transcript model

### 4. Post-Call Analysis (Phase 3)
**Frontend:**
- `frontend/src/app/review/[sessionId]/page.tsx` - Review page
- `frontend/src/components/review/` - Review components

**Backend:**
- `backend/api/sessions/routes.py` - GET /sessions/:id/analysis
- `backend/services/analysis/` - Analysis service
- `backend/models/analysis.py` - Analysis model

### 5. Dashboard & Analytics
**Frontend:**
- `frontend/src/app/dashboard/page.tsx` - Dashboard page
- `frontend/src/components/dashboard/` - Dashboard components
- `frontend/src/stores/analyticsStore.ts` - Analytics state

**Backend:**
- `backend/api/analytics/routes.py` - Analytics endpoints
- `backend/services/analytics/` - Analytics service

---

## Implementation Priority

### Phase 1: MVP Foundation (Weeks 1-6)
1. **Authentication** - `frontend/src/components/auth/`, `backend/services/auth/`
2. **Setup Flow** - `frontend/src/components/setup/`, `backend/services/scenario/`
3. **Practice Session** - `frontend/src/components/practice/`, `backend/services/conversation/`

### Phase 2: Analysis & Feedback (Weeks 7-10)
1. **Analysis Service** - `backend/services/analysis/`
2. **Review UI** - `frontend/src/components/review/`

### Phase 3: Analytics & Polish (Weeks 11-13)
1. **Dashboard** - `frontend/src/components/dashboard/`
2. **History** - `frontend/src/components/history/`
3. **Analytics** - `backend/services/analytics/`

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Audio**: Web Audio API
- **Real-time**: Native WebSocket

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL + SQLAlchemy
- **Cache**: Redis
- **LLM**: Anthropic Claude API, OpenAI Realtime API
- **Validation**: Pydantic
- **WebSocket**: FastAPI WebSocket

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Storage**: S3 (for audio files)

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Initial Setup
```bash
# Clone the repository
git clone <repo-url>
cd convo-ai

# Run setup script
./scripts/setup.sh

# Start development servers
./scripts/start-dev.sh
```

### Development Workflow
1. **Frontend**: `cd frontend && npm run dev`
2. **Backend**: `cd backend && uvicorn main:app --reload`
3. **Database**: `docker-compose up postgres redis`

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=http://localhost:3000
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/convo_ai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=<key>
OPENAI_API_KEY=<key>
JWT_SECRET=<secret>
S3_BUCKET=<bucket-name>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
```

---

## Next Steps

1. **Review the structure** - Familiarize yourself with the organization
2. **Set up development environment** - Install dependencies and configure environment variables
3. **Start with authentication** - Implement basic auth flow first
4. **Build incrementally** - Follow the phased implementation plan in CLAUDE.md
5. **Refer to CLAUDE.md** - Detailed system design and technical specifications

For detailed implementation guidance, see `CLAUDE.md` (System Design Document).
