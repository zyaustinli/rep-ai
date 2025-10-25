export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  experience_level?: string;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  price?: number;
  features?: string[];
  unique_selling_points?: string[];
  target_market?: string;
  competitors?: string[];
  created_at: string;
  updated_at: string;
}

export interface Persona {
  name: string;
  role: string;
  company: string;
  personality: string;
  communicationStyle: string;
  decisionAuthority: string;
  reportingTo?: string;
}

export interface ScenarioContext {
  currentSituation: string;
  painPoints: string[];
  budget?: string;
  timeline?: string;
  competitorsConsidering?: string[];
}

export interface Objection {
  type: string;
  objection: string;
  idealResponse: string;
}

export interface Scenario {
  persona: Persona;
  context: ScenarioContext;
  objectives: {
    scenarioGoal: string;
    challengeLevel: string;
    expectedDuration: string;
  };
  objections: Objection[];
  successCriteria: {
    must: string[];
    should: string[];
    bonus: string[];
  };
}

export interface Session {
  id: string;
  user_id: string;
  product_id?: string;
  scenario: Scenario;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  call_type: 'cold' | 'warm' | 'follow-up' | 'closing';
  duration_seconds?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  overall_score?: number;
  overall_grade?: string;
  created_at: string;
}

export interface TranscriptEntry {
  timestamp: number;
  speaker: 'user' | 'ai';
  text: string;
  duration: number;
}

export interface Transcript {
  id: string;
  session_id: string;
  entries: TranscriptEntry[];
  total_user_words: number;
  total_ai_words: number;
  user_talk_time_seconds: number;
  ai_talk_time_seconds: number;
  questions_asked: number;
  created_at: string;
}

export interface CategoryAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  examples: Array<{
    timestamp: number;
    quote: string;
    feedback: string;
  }>;
}

export interface Analysis {
  id: string;
  session_id: string;
  discovery_score: number;
  product_knowledge_score: number;
  objection_handling_score: number;
  rapport_building_score: number;
  value_communication_score: number;
  closing_score: number;
  communication_score: number;
  strengths: Record<string, string[]>;
  weaknesses: Record<string, string[]>;
  key_moments: Array<{
    timestamp: number;
    title: string;
    description: string;
    evaluation: string;
    rating: 'excellent' | 'good' | 'needs_improvement';
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
    reasoning: string;
    practiceExercise: string;
  }>;
  detailed_feedback: string;
  created_at: string;
}

export interface UserStats {
  totalSessions: number;
  averageScore: number;
  lastSessionDate?: string;
  practiceStreak: number;
  totalPracticeTime: number;
}

export interface AnalyticsOverview {
  totalSessions: number;
  avgScore: number;
  trending: 'up' | 'down' | 'stable';
  skillBreakdown: Record<string, number>;
}

export interface ProgressDataPoint {
  date: string;
  avgScore: number;
  sessions: number;
}
