export interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  experience_level?: string;
  created_at: string;
}

export interface ContentSection {
  name: string;  // Section name (e.g., "Technical Specifications", "Pricing Details")
  content: string;  // Rich text content
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

  // RAG-specific fields
  content_sections?: ContentSection[];  // Custom product knowledge sections
  vectorized_at?: string;  // When product was last vectorized
  document_count?: number;  // Number of uploaded documents

  created_at: string;
  updated_at: string;
}

export interface ProductDocument {
  id: string;
  product_id: string;
  user_id: string;
  filename: string;
  file_type: 'pdf' | 'txt' | 'md';
  file_size: number;  // in bytes
  storage_path: string;
  extracted_text?: string;
  chunk_count: number;
  is_vectorized: boolean;
  created_at: string;
  updated_at: string;
}

export interface VectorizeResponse {
  product_id: string;
  sections_vectorized: number;
  documents_vectorized: number;
  total_chunks: number;
  vectorized_at: string;
  message: string;
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

// Gemini Audio Analysis Types
export interface GeminiKeyFactor {
  factor: string;
  score: number;
  evidence: string;
  strengths: string[];
  improvements: string[];
}

export interface GeminiCriterion {
  area: string;
  score: number;
  keyFactors: GeminiKeyFactor[];
}

export interface GeminiCategory {
  category: string;
  overallScore: number;
  criteria: GeminiCriterion[];
}

export interface AudioSpecificInsights {
  toneAnalysis: string;
  pacingAnalysis: string;
  fillerWordCount: number;
  energyLevel: string;
  clarityScore: number;
}

export interface TranscriptMessageAnalysis {
  timestamp: string;
  speaker: string;
  text: string;
  rating: 'good' | 'average' | 'poor';
  score: number;
  feedback: string;
  category: string;
}

export interface GeminiAudioAnalysis {
  categories: GeminiCategory[];
  overallScore: number;
  overallGrade: string;
  keyStrengths: string[];
  criticalWeaknesses: string[];
  audioSpecificInsights: AudioSpecificInsights;
  actionableRecommendations: string[];
  transcriptAnalysis?: TranscriptMessageAnalysis[];
}

// Updated Analysis interface matching new database schema
export interface Analysis {
  id: string;
  session_id: string;
  overall_score: number;
  overall_grade: string;
  strengths: string[];  // From Gemini keyStrengths
  weaknesses: string[];  // From Gemini criticalWeaknesses
  recommendations: string[];  // From Gemini actionableRecommendations
  audio_analysis: GeminiAudioAnalysis;  // Complete Gemini response
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

export interface SessionHint {
  id: string;
  session_id: string;
  question: string;           // AI's question that triggered the hint
  hint_text: string;          // The hint/answer to display
  source_type?: string;       // "section" or "document"
  source_name?: string;       // Human-readable source name
  relevance_score?: number;   // Similarity score (0-1)
  created_at: string;
}
