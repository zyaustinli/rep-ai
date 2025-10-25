'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Convo AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email || 'guest@example.com'}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Dashboard</h2>
          <p className="text-gray-700 text-lg">Welcome back! Ready to practice?</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Total Sessions
            </h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">0</p>
            <p className="text-xs text-gray-500 mt-2">Start practicing to see stats</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Average Score
            </h3>
            <p className="text-4xl font-bold text-gray-400">-</p>
            <p className="text-xs text-gray-500 mt-2">Complete a session first</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Practice Streak
            </h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">0 days</p>
            <p className="text-xs text-gray-500 mt-2">Keep the momentum going!</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Quick Start</h3>
          <p className="text-gray-600 mb-6">
            Start a new practice session or review your past sessions
          </p>
          <div className="flex gap-4">
            <Link
              href="/setup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Practice Session
            </Link>
            <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
