import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Convo AI</h1>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Master Sales Calls with AI
          </h1>
          <p className="text-xl text-gray-700 mb-10 leading-relaxed">
            Practice realistic sales conversations with AI-powered personas.
            Get detailed feedback and improve your skills.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-bold text-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="px-10 py-4 bg-white text-gray-700 rounded-xl border-2 border-gray-200 hover:shadow-lg hover:bg-gray-50 transition-all font-bold text-lg"
            >
              Sign In
            </Link>
          </div>
          <p className="text-sm text-gray-500">No credit card required • Start practicing in 2 minutes</p>

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">AI-Generated Scenarios</h3>
              <p className="text-gray-600">
                Custom personas tailored to your product and target market
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Real-Time Conversations</h3>
              <p className="text-gray-600">
                Natural voice interactions with realistic AI prospects
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Detailed Feedback</h3>
              <p className="text-gray-600">
                Comprehensive analysis across 7 key sales dimensions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
