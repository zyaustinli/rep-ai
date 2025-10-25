# Sales Call Practice Platform (Convo AI)

An AI-powered platform that enables sales professionals to practice sales calls through realistic role-play scenarios with AI-generated personas, featuring real-time voice conversations and comprehensive performance feedback.

## Features

- **AI-Generated Scenarios**: Custom personas and situations tailored to your product and target market
- **Real-Time Voice Conversations**: Natural voice interactions with AI prospects using OpenAI Realtime API
- **Comprehensive Analysis**: Detailed performance feedback across 7 key sales dimensions
- **Progress Tracking**: Monitor improvement over time with analytics and insights

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (State Management)

### Backend
- Python 3.11+
- FastAPI
- Supabase (PostgreSQL + Auth)
- Claude API (Scenario Generation & Analysis)
- OpenAI Realtime API (Voice Conversations)

## Project Structure

```
convo-ai/
├── frontend/        # Next.js application
├── backend/         # FastAPI application
├── docs/            # Documentation
│   ├── ARCHITECTURE.md
│   └── DATABASE_SETUP.sql
└── shared/          # Shared types/constants
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account
- Anthropic API key (Claude)
- OpenAI API key

### Setup Instructions

See `/docs/ARCHITECTURE.md` for detailed setup and architecture information.

### Quick Start

1. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Add your API keys to .env.local
   npm run dev
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Add your API keys to .env
   uvicorn app.main:app --reload
   ```

3. **Database Setup**
   - Create a Supabase project
   - Run the SQL queries from `/docs/DATABASE_SETUP.sql` in the Supabase SQL editor

## MVP Scope

This MVP includes:
- ✅ User authentication (email/password)
- ✅ Product and persona configuration
- ✅ AI scenario generation
- ✅ Real-time voice conversations
- ✅ Post-call analysis and grading
- ✅ Basic dashboard with session history

## License

MIT
