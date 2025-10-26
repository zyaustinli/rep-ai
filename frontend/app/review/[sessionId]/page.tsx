'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { Session, Transcript, Analysis } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export default function ReviewPage({ params }: { params: { sessionId: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'recommendations'>('overview');

  // State for data
  const [session, setSession] = useState<Session | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingAnalysis, setRetryingAnalysis] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch session
        const sessionResponse = await apiClient.sessions.get(params.sessionId);
        setSession(sessionResponse.data);

        // Fetch transcript
        try {
          const transcriptResponse = await apiClient.sessions.getTranscript(params.sessionId);
          setTranscript(transcriptResponse.data);
        } catch (err) {
          console.warn('Transcript not available yet');
        }

        // Fetch analysis
        try {
          const analysisResponse = await apiClient.analysis.get(params.sessionId);
          setAnalysis(analysisResponse.data);
        } catch (err: any) {
          if (err.response?.status === 404) {
            console.warn('Analysis not ready yet');
          } else {
            throw err;
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.detail || 'Failed to load session data');
        setLoading(false);
      }
    };

    fetchData();
  }, [params.sessionId]);

  // Auto-poll for analysis if not available
  useEffect(() => {
    if (!loading && !analysis && session) {
      setRetryingAnalysis(true);

      // Trigger analysis
      apiClient.analysis.triggerAudioAnalysis(params.sessionId).catch(err => {
        console.error('Error triggering analysis:', err);
      });

      // Poll for results every 3 seconds
      const pollInterval = setInterval(async () => {
        try {
          const analysisResponse = await apiClient.analysis.get(params.sessionId);
          setAnalysis(analysisResponse.data);

          // DEBUG: Check if transcriptAnalysis is present
          const audioAnalysis = analysisResponse.data?.audio_analysis;
          if (audioAnalysis) {
            console.log('[DEBUG] Audio analysis received');
            if (audioAnalysis.transcriptAnalysis) {
              console.log(`[DEBUG] ✓ transcriptAnalysis found with ${audioAnalysis.transcriptAnalysis.length} entries`);
              console.log('[DEBUG] First entry:', audioAnalysis.transcriptAnalysis[0]);
            } else {
              console.log('[DEBUG] ✗ transcriptAnalysis NOT found in audio_analysis');
              console.log('[DEBUG] Available keys:', Object.keys(audioAnalysis));
            }
          }

          setRetryingAnalysis(false);
          clearInterval(pollInterval);
        } catch (err) {
          // Keep polling if analysis not ready yet
          console.log('Analysis not ready, continuing to poll...');
        }
      }, 3000);

      // Cleanup on unmount
      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [loading, analysis, session, params.sessionId]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-teal-600';
    if (score >= 80) return 'from-blue-500 to-indigo-600';
    if (score >= 70) return 'from-amber-500 to-orange-600';
    return 'from-rose-500 to-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimestamp = (timestamp: string): number => {
    // Parse MM:SS format to milliseconds
    const parts = timestamp.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return (minutes * 60 + seconds) * 1000;
    }
    return 0;
  };

  const formatMarkdownBold = (text: string): JSX.Element => {
    // Replace **text** with <strong>text</strong>
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Remove ** and make bold
            return <strong key={idx}>{part.slice(2, -2)}</strong>;
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-6 text-slate-600 font-medium">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <ErrorMessage message={error || 'Session not found'} />
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Analysis not ready state
  if (!analysis) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-6 py-4">
            <Link href="/dashboard">
              <Image
                src="/rep-logo.png"
                alt="Rep Logo"
                width={90}
                height={36}
                className="h-9 w-auto cursor-pointer"
                priority
              />
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Analyzing Your Performance</h2>
            <p className="text-slate-600 mb-2 max-w-md mx-auto">
              Our AI is analyzing your call recording and preparing detailed feedback.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              This typically takes 30-60 seconds...
            </p>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            <div className="mt-8">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 text-sm font-medium inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const audioAnalysis = analysis.audio_analysis;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <Image
              src="/rep-logo.png"
              alt="Rep Logo"
              width={90}
              height={36}
              className="h-9 w-auto cursor-pointer"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 font-medium text-sm">
              Dashboard
            </Link>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium text-sm">
              Export Report
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Session Complete
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-3">Performance Review</h1>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(session.completed_at || session.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDuration(session.duration_seconds || 0)}
                </div>
              </div>
            </div>

            {/* Grade Badge */}
            <div className="text-right">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${getScoreGradient(analysis.overall_score)} shadow-lg`}>
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{analysis.overall_grade}</div>
                  <div className="text-xs font-medium text-white/90">{analysis.overall_score}/100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">{audioAnalysis.categories.filter(c => c.overallScore >= 85).length}/{audioAnalysis.categories.length}</div>
              <div className="text-sm text-slate-600 mt-1">Strong Categories</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">{analysis.strengths.length}</div>
              <div className="text-sm text-slate-600 mt-1">Key Strengths</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">{analysis.weaknesses.length}</div>
              <div className="text-sm text-slate-600 mt-1">Areas to Improve</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="text-2xl font-bold text-slate-900">{audioAnalysis.audioSpecificInsights.clarityScore}%</div>
              <div className="text-sm text-slate-600 mt-1">Clarity Score</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-8 inline-flex gap-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'transcript', label: 'Transcript' },
            { id: 'recommendations', label: 'Recommendations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Audio Insights */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Vocal Delivery</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">Tone</h3>
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{audioAnalysis.audioSpecificInsights.toneAnalysis}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">Pacing</h3>
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{audioAnalysis.audioSpecificInsights.pacingAnalysis}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Clarity</h3>
                    <span className={`text-lg font-bold ${getScoreColor(audioAnalysis.audioSpecificInsights.clarityScore)}`}>
                      {audioAnalysis.audioSpecificInsights.clarityScore}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getScoreGradient(audioAnalysis.audioSpecificInsights.clarityScore)} transition-all duration-500`}
                      style={{ width: `${audioAnalysis.audioSpecificInsights.clarityScore}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">Filler Words</h3>
                      <p className="text-xs text-slate-500 mt-1">um, uh, like</p>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {audioAnalysis.audioSpecificInsights.fillerWordCount}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">Energy Level</h4>
                    <p className="text-sm text-slate-600 mt-1">{audioAnalysis.audioSpecificInsights.energyLevel}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Performance Breakdown</h2>
              </div>

              <div className="space-y-6">
                {audioAnalysis.categories.map((category, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-900">{category.category}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${getScoreColor(category.overallScore)}`}>
                          {category.overallScore}
                        </span>
                        <span className="text-slate-400 text-sm font-medium">/100</span>
                      </div>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                      <div
                        className={`h-full bg-gradient-to-r ${getScoreGradient(category.overallScore)} transition-all duration-500`}
                        style={{ width: `${category.overallScore}%` }}
                      />
                    </div>

                    {/* Criteria */}
                    <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                      {category.criteria.map((criterion, cIdx) => (
                        <div key={cIdx} className="group relative">
                          <div className="flex items-center justify-between cursor-help py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                              {criterion.area}
                            </span>
                            <span className={`text-sm font-bold ${getScoreColor(criterion.score)}`}>
                              {criterion.score}
                            </span>
                          </div>

                          {/* Tooltip */}
                          <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h4 className="font-bold text-slate-900">{criterion.area}</h4>
                                <span className={`text-lg font-bold ${getScoreColor(criterion.score)}`}>
                                  {criterion.score}/100
                                </span>
                              </div>

                              {criterion.keyFactors && criterion.keyFactors.length > 0 && (
                                <div className="space-y-4">
                                  {criterion.keyFactors.map((factor, fIdx) => (
                                    <div key={fIdx} className="border-l-2 border-indigo-200 pl-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-semibold text-sm text-slate-800">{factor.factor}</h5>
                                        <span className={`text-sm font-bold ${getScoreColor(factor.score)}`}>
                                          {factor.score}
                                        </span>
                                      </div>

                                      {factor.evidence && (
                                        <div className="mb-3">
                                          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {factor.evidence}
                                          </p>
                                        </div>
                                      )}

                                      {factor.strengths && factor.strengths.length > 0 && (
                                        <div className="mb-2">
                                          <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Strengths
                                          </p>
                                          <ul className="text-xs text-slate-700 space-y-1">
                                            {factor.strengths.map((strength, sIdx) => (
                                              <li key={sIdx} className="flex items-start gap-2">
                                                <span className="text-emerald-500 mt-0.5">•</span>
                                                <span>{strength}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {factor.improvements && factor.improvements.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Areas for Improvement
                                          </p>
                                          <ul className="text-xs text-slate-700 space-y-1">
                                            {factor.improvements.map((improvement, iIdx) => (
                                              <li key={iIdx} className="flex items-start gap-2">
                                                <span className="text-amber-500 mt-0.5">•</span>
                                                <span>{improvement}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Arrow */}
                            <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-slate-200 transform rotate-45"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Key Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Areas to Improve</h3>
                </div>
                <ul className="space-y-3">
                  {analysis.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-700">
                      <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm leading-relaxed">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div className="space-y-6">
            {transcript && transcript.entries.length > 0 ? (
              <>
                {/* DEBUG: Log data availability */}
                {(() => {
                  console.log('[DEBUG] Transcript tab loaded');
                  console.log('[DEBUG] Transcript entries:', transcript.entries.length);
                  console.log('[DEBUG] Audio analysis exists:', !!audioAnalysis);
                  console.log('[DEBUG] transcriptAnalysis exists:', !!audioAnalysis?.transcriptAnalysis);
                  if (audioAnalysis?.transcriptAnalysis) {
                    console.log('[DEBUG] transcriptAnalysis count:', audioAnalysis.transcriptAnalysis.length);
                    console.log('[DEBUG] Sample analysis:', audioAnalysis.transcriptAnalysis[0]);
                  }
                  return null;
                })()}
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{transcript.total_user_words}</div>
                        <div className="text-xs font-medium text-slate-600">Your Words</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{transcript.total_ai_words}</div>
                        <div className="text-xs font-medium text-slate-600">AI Words</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {Math.round((transcript.user_talk_time_seconds / (transcript.user_talk_time_seconds + transcript.ai_talk_time_seconds)) * 100)}%
                        </div>
                        <div className="text-xs font-medium text-slate-600">Your Talk Time</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{transcript.questions_asked}</div>
                        <div className="text-xs font-medium text-slate-600">Questions Asked</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 p-8 pb-6 border-b border-slate-100">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Conversation</h2>
                  </div>

                  <div className="space-y-6 max-h-[700px] overflow-y-auto p-8 custom-scrollbar">
                    {transcript.entries.map((entry, idx) => {
                      // Get relative time from start of call (in milliseconds)
                      const firstEntryTime = transcript.entries[0]?.timestamp;
                      const entryRelativeTime = firstEntryTime
                        ? new Date(entry.timestamp).getTime() - new Date(firstEntryTime).getTime()
                        : 0;

                      // Find analysis for this message (only for user messages)
                      const messageAnalysis = entry.speaker === 'user' && audioAnalysis?.transcriptAnalysis
                        ? audioAnalysis.transcriptAnalysis.find((ta: any) => {
                            // Match by approximate timestamp (within 10 seconds)
                            const analysisTime = parseTimestamp(ta.timestamp); // Returns milliseconds
                            const timeDiff = Math.abs(entryRelativeTime - analysisTime);

                            // DEBUG: Log matching attempts for first 5 user messages
                            if (idx < 5 && entry.speaker === 'user') {
                              console.log(`[DEBUG] Matching entry ${idx}:`, {
                                entryText: entry.text.substring(0, 50),
                                entryRelativeTime: entryRelativeTime,
                                entryRelativeSeconds: (entryRelativeTime / 1000).toFixed(1),
                                analysisTimestamp: ta.timestamp,
                                analysisTime: analysisTime,
                                analysisSeconds: (analysisTime / 1000).toFixed(1),
                                timeDiff: timeDiff,
                                timeDiffSeconds: (timeDiff / 1000).toFixed(1),
                                matched: timeDiff < 10000
                              });
                            }

                            return timeDiff < 10000; // Within 10 seconds
                          })
                        : null;

                      // DEBUG: Log if analysis was found
                      if (idx < 5 && entry.speaker === 'user') {
                        console.log(`[DEBUG] Entry ${idx} analysis result:`, messageAnalysis ? 'FOUND ✓' : 'NOT FOUND ✗');
                        if (messageAnalysis) {
                          console.log(`[DEBUG] Matched with rating: ${messageAnalysis.rating}, score: ${messageAnalysis.score}`);
                        }
                      }

                      // Get border/background color based on rating
                      const getRatingStyle = (rating: string | undefined) => {
                        if (!rating) return '';
                        switch (rating) {
                          case 'good':
                            return 'border-2 border-emerald-400 shadow-emerald-100';
                          case 'average':
                            return 'border-2 border-amber-400 shadow-amber-100';
                          case 'poor':
                            return 'border-2 border-red-400 shadow-red-100';
                          default:
                            return '';
                        }
                      };

                      return (
                        <div
                          key={idx}
                          className={`flex gap-4 animate-fadeIn ${entry.speaker === 'user' ? 'flex-row-reverse' : ''} relative group/message hover:z-[100]`}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                            entry.speaker === 'user' ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                            <svg className={`w-5 h-5 ${entry.speaker === 'user' ? 'text-blue-600' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {entry.speaker === 'user' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              )}
                            </svg>
                          </div>

                          <div className={`flex-1 ${entry.speaker === 'user' ? 'text-right' : ''} group relative`}>
                            <div className={`inline-block max-w-[85%] ${
                              entry.speaker === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-50 text-slate-900 border border-slate-200'
                            } px-6 py-4 rounded-2xl ${
                              entry.speaker === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                            } ${messageAnalysis ? getRatingStyle(messageAnalysis.rating) : ''} ${
                              messageAnalysis ? 'cursor-help shadow-lg' : ''
                            } transition-all`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-xs">
                                  {entry.speaker === 'user' ? 'You' : session?.scenario?.persona?.name || 'AI Prospect'}
                                </span>
                                <span className={`text-xs ${entry.speaker === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                {messageAnalysis && (
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    messageAnalysis.rating === 'good' ? 'bg-emerald-100 text-emerald-700' :
                                    messageAnalysis.rating === 'average' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {messageAnalysis.score}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                            </div>

                            {/* Analysis Tooltip */}
                            {messageAnalysis && (
                              <div className={`absolute ${
                                entry.speaker === 'user' ? 'right-0' : 'left-0'
                              } top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]`}>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <h4 className="font-bold text-slate-900">{messageAnalysis.category}</h4>
                                    <span className={`text-lg font-bold ${
                                      messageAnalysis.rating === 'good' ? 'text-emerald-600' :
                                      messageAnalysis.rating === 'average' ? 'text-amber-600' :
                                      'text-red-600'
                                    }`}>
                                      {messageAnalysis.score}/100
                                    </span>
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                      {messageAnalysis.rating === 'good' ? (
                                        <>
                                          <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          Well Done
                                        </>
                                      ) : messageAnalysis.rating === 'average' ? (
                                        <>
                                          <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          Needs Improvement
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                          </svg>
                                          Significant Issues
                                        </>
                                      )}
                                    </p>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                      {messageAnalysis.feedback}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Transcript Available</h3>
                <p className="text-sm text-slate-600">The conversation transcript for this session is not available.</p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-10 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Keep Practicing</h2>
              </div>
              <p className="text-indigo-100 mb-8 text-lg">Based on your performance, continue practicing to improve your skills.</p>
              <Link
                href="/setup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-2xl transition-all"
              >
                Start Next Practice Session
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Actionable Recommendations</h2>
              </div>

              <div className="space-y-4">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-slate-700 leading-relaxed flex-1">{formatMarkdownBold(rec)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex justify-between items-center mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Link
            href="/dashboard"
            className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium text-sm">
              Share Results
            </button>
            <Link
              href="/setup"
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium text-sm inline-flex items-center gap-2"
            >
              Practice Again
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
