'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface AnalyticsOverview {
  total_sessions: number;
  avg_score: number;
  trending: string;
  skill_breakdown: Record<string, number>;
}

interface Session {
  id: string;
  created_at: string;
  overall_score: number | null;
  difficulty: string;
  call_type: string;
  status: string;
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TEMP: Auth disabled for testing without Supabase
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, loading, router]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-xl">Loading...</div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return null;
  // }

  // Fetch dashboard data
  const fetchDashboardData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // Remove trailing slash from API URL if present
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

        // Get auth token from Supabase session
        const { supabase } = await import('@/lib/supabase');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to get session. Please try signing in again.');
          setLoadingData(false);
          return;
        }

        const token = session?.access_token;

        // If no token, show guest mode message
        if (!token) {
          setError('Please sign in to view your dashboard data.');
          setLoadingData(false);
          return;
        }

        // Fetch analytics overview
        const analyticsRes = await fetch(`${apiUrl}/api/analytics/overview`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          mode: 'cors',
          credentials: 'include'
        });

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        } else if (analyticsRes.status === 401 || analyticsRes.status === 403) {
          const errorData = await analyticsRes.json().catch(() => ({}));
          setError(`Authentication required. ${errorData.detail || 'Please sign in to continue.'}`);
          return;
        } else {
          const errorData = await analyticsRes.json().catch(() => ({}));
          console.error('Analytics fetch error:', analyticsRes.status, errorData);
          setError(`Failed to load analytics (Status ${analyticsRes.status})`);
        }

        // Fetch recent sessions
        const sessionsRes = await fetch(`${apiUrl}/api/sessions?limit=5`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setRecentSessions(sessionsData);
        } else if (sessionsRes.status === 401 || sessionsRes.status === 403) {
          // Already showed auth error above
          return;
        } else {
          const errorData = await sessionsRes.json().catch(() => ({}));
          console.error('Sessions fetch error:', sessionsRes.status, errorData);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Unable to load dashboard data. Please check your connection and sign in.');
      } finally {
        setLoadingData(false);
      }
    };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
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
            <span className="text-slate-600 text-sm">{user?.email || 'guest@example.com'}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h2>
          <p className="text-slate-600 text-lg">Welcome back! Ready to practice?</p>
        </div>

        {error && (
          <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">Authentication Required</h4>
                <p className="text-amber-800 mb-4">{error}</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Total Sessions
              </h3>
            </div>
            {loadingData ? (
              <p className="text-4xl font-bold text-slate-400">...</p>
            ) : (
              <p className="text-4xl font-bold text-slate-900">{analytics?.total_sessions || 0}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {analytics?.total_sessions === 0 ? 'Start practicing to see stats' : 'Practice sessions completed'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Average Score
              </h3>
            </div>
            {loadingData ? (
              <p className="text-4xl font-bold text-slate-400">...</p>
            ) : analytics?.avg_score ? (
              <p className="text-4xl font-bold text-slate-900">{Math.round(analytics.avg_score)}</p>
            ) : (
              <p className="text-4xl font-bold text-slate-400">-</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {analytics?.avg_score ? 'Keep up the great work!' : 'Complete a session first'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                Recent Activity
              </h3>
            </div>
            {loadingData ? (
              <p className="text-4xl font-bold text-slate-400">...</p>
            ) : (
              <p className="text-4xl font-bold text-slate-900">{recentSessions.length}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {recentSessions.length > 0 ? 'Recent sessions' : 'No recent sessions'}
            </p>
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200 mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Recent Sessions</h3>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/review/${session.id}`}
                  className="block p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : session.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {session.status === 'completed' ? 'Completed' :
                           session.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                        <span className="text-sm text-slate-600 capitalize">{session.difficulty} · {session.call_type}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(session.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {session.overall_score !== null && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">{session.overall_score}</div>
                        <div className="text-xs text-slate-500">Score</div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Quick Start</h3>
          <p className="text-slate-600 mb-6">
            Start a new practice session or manage your products
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/setup"
              className="px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Practice Session
            </Link>
            <Link
              href="/products"
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Manage Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
