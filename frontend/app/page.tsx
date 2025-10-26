import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Rep</h1>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-6 py-2 text-slate-700 hover:text-slate-900 font-medium transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-slate-900 mb-6">
            Master Sales Calls with AI
          </h1>
          <p className="text-xl text-slate-700 mb-10 leading-relaxed">
            Practice realistic sales conversations with AI-powered personas.
            Get detailed feedback and improve your skills.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="px-10 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 hover:shadow-lg transition-all font-bold text-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="px-10 py-4 bg-white text-slate-700 rounded-xl border border-slate-200 hover:shadow-sm hover:border-slate-300 transition-all font-bold text-lg"
            >
              Sign In
            </Link>
          </div>
          <p className="text-sm text-slate-500">No credit card required • Start practicing in 2 minutes</p>

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">AI-Generated Scenarios</h3>
              <p className="text-slate-600">
                Custom personas tailored to your product and target market
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Real-Time Conversations</h3>
              <p className="text-slate-600">
                Natural voice interactions with realistic AI prospects
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Detailed Feedback</h3>
              <p className="text-slate-600">
                Comprehensive analysis across 7 key sales dimensions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
