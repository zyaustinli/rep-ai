'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReviewPage({ params }: { params: { sessionId: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'recommendations'>('overview');

  // Mock data - would come from API
  const analysis = {
    overallGrade: 'B+',
    overallScore: 87,
    duration: '12:34',
    date: 'October 25, 2025',
    categories: {
      discovery: { score: 85, trend: 'up' },
      productKnowledge: { score: 92, trend: 'up' },
      objectionHandling: { score: 78, trend: 'down' },
      rapportBuilding: { score: 90, trend: 'up' },
      valueCommunication: { score: 88, trend: 'same' },
      closing: { score: 82, trend: 'up' },
      communication: { score: 91, trend: 'up' },
    },
    strengths: [
      'Excellent product knowledge and confidence',
      'Strong rapport building with active listening',
      'Clear value communication with concrete examples',
      'Professional communication style',
    ],
    improvements: [
      'Practice handling price objections more effectively',
      'Ask more discovery questions before pitching',
      'Work on creating urgency for next steps',
    ],
    keyMoments: [
      {
        time: '02:15',
        title: 'Great Opening',
        description: 'Strong introduction with clear value proposition',
        rating: 'excellent',
      },
      {
        time: '07:32',
        title: 'Price Objection',
        description: 'Could have used ROI framework to handle objection',
        rating: 'needs-work',
      },
      {
        time: '11:20',
        title: 'Closing Attempt',
        description: 'Good assumptive close, successfully booked demo',
        rating: 'good',
      },
    ],
    transcript: [
      { speaker: 'ai', text: "Hi, this is Sarah Chen. Thanks for reaching out!", time: '00:05' },
      { speaker: 'user', text: "Hi Sarah! Thanks for taking my call. I'm reaching out because I noticed your company has been growing rapidly, and I wanted to share how we've helped similar companies streamline their sales process.", time: '00:10' },
      { speaker: 'ai', text: "I appreciate that. To be honest, we're pretty happy with our current CRM system.", time: '00:25' },
      { speaker: 'user', text: "That's great to hear! Out of curiosity, what do you like most about your current solution?", time: '00:30' },
    ],
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Convo AI
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition">
              Back to Dashboard
            </Link>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Export Report
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Session Complete! 🎉</h1>
              <p className="text-blue-100 text-lg">{analysis.date} • {analysis.duration}</p>
            </div>
            <div className="text-center">
              <div className="text-7xl font-bold mb-2">{analysis.overallGrade}</div>
              <div className="text-2xl text-blue-100">{analysis.overallScore}/100</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">{Object.values(analysis.categories).filter(c => c.score >= 85).length}/7</div>
              <div className="text-sm text-blue-100">Strong Areas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">{analysis.strengths.length}</div>
              <div className="text-sm text-blue-100">Key Strengths</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">{analysis.improvements.length}</div>
              <div className="text-sm text-blue-100">Areas to Improve</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold">{analysis.keyMoments.length}</div>
              <div className="text-sm text-blue-100">Key Moments</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6 p-1 flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'transcript', label: 'Transcript', icon: '📝' },
            { id: 'recommendations', label: 'Recommendations', icon: '💡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Category Scores */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                Performance Breakdown
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(analysis.categories).map(([key, data]) => (
                  <div key={key} className="group hover:bg-gray-50 p-4 rounded-xl transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <span className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                          {data.score}
                        </span>
                      </div>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreBgColor(data.score)}/10`}>
                        <span className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                          {data.trend === 'up' ? '↗' : data.trend === 'down' ? '↘' : '→'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBgColor(data.score)} transition-all duration-500`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100">
                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Key Strengths
                </h3>
                <ul className="space-y-3">
                  {analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-green-900">
                      <span className="text-green-600 font-bold text-xl mt-0.5">•</span>
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-100">
                <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Areas to Improve
                </h3>
                <ul className="space-y-3">
                  {analysis.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-orange-900">
                      <span className="text-orange-600 font-bold text-xl mt-0.5">•</span>
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Key Moments */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                Key Moments
              </h2>

              <div className="space-y-4">
                {analysis.keyMoments.map((moment, idx) => (
                  <div
                    key={idx}
                    className={`border-l-4 pl-6 py-4 ${
                      moment.rating === 'excellent'
                        ? 'border-green-500 bg-green-50'
                        : moment.rating === 'good'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-orange-500 bg-orange-50'
                    } rounded-r-xl`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full">
                          {moment.time}
                        </span>
                        <h3 className="font-bold text-gray-800">{moment.title}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        moment.rating === 'excellent'
                          ? 'bg-green-200 text-green-800'
                          : moment.rating === 'good'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-orange-200 text-orange-800'
                      }`}>
                        {moment.rating === 'excellent' ? '⭐ Excellent' : moment.rating === 'good' ? '👍 Good' : '📈 Needs Work'}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{moment.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Full Transcript
            </h2>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4">
              {analysis.transcript.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    msg.speaker === 'user' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {msg.speaker === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`flex-1 ${msg.speaker === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-[85%] ${
                      msg.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    } px-6 py-4 rounded-2xl ${msg.speaker === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {msg.speaker === 'user' ? 'You' : 'Sarah Chen'}
                        </span>
                        <span className={`text-xs ${msg.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Next Practice Suggestion */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Recommended Next Practice
              </h2>
              <p className="text-purple-100 mb-6">Based on your performance, we suggest:</p>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <h3 className="font-bold text-xl mb-2">Hard Difficulty • Objection Handling Focus</h3>
                <p className="text-purple-100 mb-4">
                  Practice handling price and feature objections with a more challenging prospect. This will help you build confidence in areas that need improvement.
                </p>
                <Link
                  href="/setup"
                  className="inline-block px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all"
                >
                  Start Practice Session →
                </Link>
              </div>
            </div>

            {/* Detailed Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                Personalized Recommendations
              </h2>

              <div className="space-y-6">
                {[
                  {
                    priority: 'high',
                    category: 'Objection Handling',
                    title: 'Master the ROI Framework',
                    description: 'When prospects raise price concerns, use the ROI framework: Help them calculate the cost of NOT solving the problem vs. the investment in your solution.',
                    action: 'Practice: Role-play 5 different price objections',
                  },
                  {
                    priority: 'medium',
                    category: 'Discovery',
                    title: 'Ask More "Why" Questions',
                    description: 'Dig deeper into the root causes of their pain points. Every surface-level problem has a deeper business impact.',
                    action: 'Tip: Use the "5 Whys" technique to uncover true motivations',
                  },
                  {
                    priority: 'low',
                    category: 'Closing',
                    title: 'Create Time-Based Urgency',
                    description: 'While your assumptive closes are strong, adding legitimate urgency (limited slots, pricing changes, seasonal factors) can improve conversion.',
                    action: 'Resource: Read "Creating Authentic Urgency" guide',
                  },
                ].map((rec, idx) => (
                  <div key={idx} className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority} Priority
                        </span>
                        <span className="text-sm text-gray-500">• {rec.category}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{rec.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{rec.description}</p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-sm font-medium text-blue-900">
                        <span className="font-bold">Action:</span> {rec.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Recommended Resources
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {['Handling Objections Guide', 'Discovery Questions Playbook', 'Closing Techniques Library'].map((resource, idx) => (
                  <button key={idx} className="bg-white p-4 rounded-xl hover:shadow-lg transition-all text-left">
                    <p className="font-semibold text-gray-800">{resource}</p>
                    <p className="text-sm text-gray-500 mt-1">5 min read →</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex justify-between items-center mt-8 bg-white rounded-2xl shadow-lg p-6">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">
              Share Results
            </button>
            <Link
              href="/setup"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition font-bold"
            >
              Practice Again →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
