# Backend - Convo AI

FastAPI backend for the Sales Call Practice Platform.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your API keys:
   - Supabase URL, Key, and JWT Secret
   - Anthropic API Key (for Claude)
   - OpenAI API Key (for Realtime API)

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

6. Open [http://localhost:8000/docs](http://localhost:8000/docs) for API documentation

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app initialization
│   ├── config.py         # Configuration settings
│   ├── database.py       # Supabase client
│   ├── models/           # Database models (future)
│   ├── schemas/          # Pydantic schemas
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── session.py
│   │   └── analysis.py
│   ├── api/
│   │   ├── deps.py       # Dependencies (auth, etc.)
│   │   └── routes/       # API endpoints
│   │       ├── auth.py
│   │       ├── products.py
│   │       ├── sessions.py
│   │       └── analysis.py
│   ├── services/         # Business logic
│   │   ├── scenario_generator.py
│   │   ├── conversation.py
│   │   └── analysis.py
│   └── utils/            # Utilities
│       └── prompts.py
└── requirements.txt
```

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **AI APIs**:
  - Anthropic Claude (scenario generation & analysis)
  - OpenAI Realtime API (voice conversations)
- **WebSocket**: Native FastAPI WebSocket support

## API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update user profile
- `GET /api/auth/me/stats` - Get user statistics

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `PATCH /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Sessions
- `POST /api/sessions/generate-scenario` - Generate AI scenario
- `POST /api/sessions` - Create session
- `GET /api/sessions` - List sessions
- `GET /api/sessions/{id}` - Get session
- `GET /api/sessions/{id}/transcript` - Get transcript
- `POST /api/sessions/{id}/analyze` - Trigger analysis
- `WS /api/sessions/{id}/conversation` - WebSocket for real-time conversation

### Analytics
- `GET /api/analytics/overview` - Analytics overview
- `GET /api/analytics/progress` - Progress over time
- `GET /api/analytics/skills` - Skill breakdown

## Development

Run tests (when available):
```bash
pytest
```

Format code:
```bash
black app/
```

Lint code:
```bash
flake8 app/
```
