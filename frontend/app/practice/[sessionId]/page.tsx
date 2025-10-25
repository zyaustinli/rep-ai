'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useVapi } from '@/hooks/useVapi';

export default function PracticePage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize Vapi hook
  const vapi = useVapi();

  // Fetch session data on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);

        // Fetch session details
        const sessionResponse = await apiClient.sessions.get(params.sessionId);
        setSession(sessionResponse.data);

        // Fetch assistant ID
        const assistantResponse = await apiClient.sessions.getAssistant(params.sessionId);
        setAssistantId(assistantResponse.data.assistant_id);

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.response?.data?.detail || 'Failed to load session');
        setLoading(false);
      }
    };

    fetchSession();
  }, [params.sessionId]);

  // Start the call
  const handleStartCall = async () => {
    if (!assistantId) {
      setError('No assistant available for this session');
      return;
    }

    await vapi.startCall(assistantId);
  };

  // End the call and save transcript
  const handleEndCall = async () => {
    setSaving(true);

    // End the call
    vapi.endCall();

    // Wait a moment for call to fully end
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Save transcript to backend
    try {
      await apiClient.sessions.saveTranscript(params.sessionId, {
        entries: vapi.transcript.map(entry => ({
          timestamp: entry.timestamp,
          speaker: entry.speaker,
          text: entry.text,
          duration: entry.duration,
        })),
        duration_seconds: vapi.callDuration,
        vapi_call_id: vapi.callId,
      });

      // Navigate to review page
      router.push(`/review/${params.sessionId}`);
    } catch (err: any) {
      console.error('Error saving transcript:', err);
      setError('Failed to save transcript. Please try again.');
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get persona details from scenario
  const persona = session?.scenario?.persona || {};
  const personaName = persona.name || 'Sales Prospect';
  const personaRole = persona.role || 'Decision Maker';
  const personaCompany = persona.company || 'Company';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Session</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Convo AI
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-gray-600 text-sm">Session ID: {params.sessionId.slice(0, 8)}...</div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!vapi.isConnected && !vapi.isConnecting ? (
          /* Pre-Call Screen */
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center mb-12">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl animate-pulse">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Ready to Practice?
              </h1>
              <p className="text-xl text-gray-700 mb-2">
                You'll be calling: <span className="font-semibold">{personaName}, {personaRole}</span>
              </p>
              <p className="text-lg text-gray-600">
                {personaCompany} • {session?.difficulty} difficulty • {session?.call_type} call
              </p>
            </div>

            {/* Error display */}
            {(error || vapi.error) && (
              <div className="mb-6 max-w-md bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{error || vapi.error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleStartCall}
                disabled={!assistantId}
                className="group px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:shadow-2xl hover:scale-110 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg className="w-8 h-8 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {assistantId ? 'Start Call' : 'Loading...'}
              </button>
              <Link
                href="/dashboard"
                className="px-12 py-5 bg-white text-gray-700 text-xl font-bold rounded-2xl hover:bg-gray-50 transition-all border-2 border-gray-200 shadow-sm"
              >
                Cancel
              </Link>
            </div>

            {/* Tips Card */}
            <div className="mt-16 max-w-2xl bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h3 className="text-gray-800 font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick Tips
              </h3>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• Speak clearly and naturally</li>
                <li>• Listen for buying signals and objections</li>
                <li>• Ask open-ended questions to discover pain points</li>
                <li>• Always aim to book a next step</li>
              </ul>
            </div>
          </div>
        ) : vapi.isConnecting ? (
          /* Connecting State */
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center">
              <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Connecting...</h2>
              <p className="text-gray-600">Setting up your practice call</p>
            </div>
          </div>
        ) : (
          /* Active Call Screen */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Transcript */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-200 flex flex-col" style={{ height: '75vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-800 font-semibold text-lg">Live Transcript</h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  vapi.isSpeaking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${vapi.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">{vapi.isSpeaking ? 'AI Speaking' : 'Listening'}</span>
                </div>
              </div>

              {/* Transcript Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {vapi.transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Start speaking to see the transcript...</p>
                  </div>
                ) : (
                  vapi.transcript.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        msg.speaker === 'user' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {msg.speaker === 'user' ? '👤' : '🤖'}
                      </div>
                      <div className={`flex-1 ${msg.speaker === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                          msg.speaker === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Controls & Stats */}
            <div className="space-y-6">
              {/* Timer Card */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-2xl">
                <div className="text-sm font-medium mb-2 opacity-90">Call Duration</div>
                <div className="text-5xl font-bold mb-4">{formatTime(vapi.callDuration)}</div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Recording in progress
                </div>
              </div>

              {/* Audio Visualizer */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-gray-800 font-semibold mb-4">Audio Level</h3>
                <div className="flex items-end justify-between h-32 gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-full transition-all"
                      style={{
                        height: `${Math.min(100, vapi.volumeLevel * 100 + Math.random() * 20)}%`,
                        opacity: vapi.isConnected ? 0.8 : 0.2
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-gray-800 font-semibold mb-4">Controls</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => vapi.setMuted(!vapi.isMuted)}
                    className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      vapi.isMuted
                        ? 'bg-red-50 text-red-600 border-2 border-red-200'
                        : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={vapi.isMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} />
                    </svg>
                    {vapi.isMuted ? 'Unmute' : 'Mute'}
                  </button>

                  <button
                    onClick={handleEndCall}
                    disabled={saving}
                    className="w-full px-4 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                        </svg>
                        End Call & Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
