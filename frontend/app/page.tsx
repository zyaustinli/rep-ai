import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Sales Calls with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Practice realistic sales conversations with AI-powered personas.
            Get detailed feedback and improve your skills.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">AI-Generated Scenarios</h3>
              <p className="text-gray-600">
                Custom personas tailored to your product and target market
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Real-Time Conversations</h3>
              <p className="text-gray-600">
                Natural voice interactions with realistic AI prospects
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Detailed Feedback</h3>
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
