# Frontend - Convo AI

Next.js 14 application for the Sales Call Practice Platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your API keys:
   - Supabase URL and Anon Key
   - Backend API URL
   - OpenAI API Key (if needed for client-side)

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                 # Next.js 14 App Router
│   ├── (auth)/         # Auth pages (login, register)
│   ├── dashboard/      # Main dashboard
│   ├── setup/          # Session setup
│   ├── practice/       # Practice session interface
│   └── review/         # Session review & analysis
├── components/         # React components
│   ├── auth/
│   ├── dashboard/
│   ├── setup/
│   ├── practice/
│   └── review/
├── lib/                # Utilities
│   ├── supabase.ts    # Supabase client
│   ├── api.ts         # API client
│   └── utils.ts       # Helper functions
├── hooks/              # React hooks
│   └── useAuth.ts     # Authentication hook
├── types/              # TypeScript types
├── store/              # Zustand stores
└── public/             # Static assets
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **API Client**: Axios
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Key Features

- Server-side rendering with Next.js App Router
- Type-safe API calls with TypeScript
- Real-time audio streaming with Web Audio API
- Responsive design with Tailwind CSS
- Form validation with Zod
- Global state management with Zustand
