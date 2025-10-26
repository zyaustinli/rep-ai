'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useVapi } from '@/hooks/useVapi';
import { useHints } from '@/hooks/useHints';
import HintPanel from '@/components/practice/HintPanel';

export default function PracticePage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Initialize Vapi hook
  const vapi = useVapi();

  // Ref for auto-scrolling transcript
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Hints state and hook
  const [hintsVisible, setHintsVisible] = useState(true);
  const { hints } = useHints(params.sessionId, vapi.isConnected);

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

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (vapi.transcript.length > 0) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [vapi.transcript.length]);

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
    // Immediately set ending state to show loading screen
    setIsEnding(true);
    setSaving(true);

    try {
      // End the call
      vapi.endCall();

      // Wait a moment for call to fully end
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save transcript to backend
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

      // Navigate to review page (using replace to avoid back button showing call screen)
      router.replace(`/review/${params.sessionId}`);
      // Note: Don't set saving/ending to false - let navigation happen while showing loading state
    } catch (err: any) {
      console.error('Error saving transcript:', err);
      setError('Failed to save transcript. Please try again.');
      setSaving(false);
      setIsEnding(false);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Session</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state when ending call (prevents flash of start call screen)
  if (isEnding) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Saving Your Session</h2>
            <p className="text-slate-600 mb-8">
              Preparing your performance analysis...
            </p>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-900">
            Rep
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-slate-600 text-sm">Session ID: {params.sessionId.slice(0, 8)}...</div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!vapi.isConnected && !vapi.isConnecting ? (
          /* Pre-Call Screen */
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center mb-12">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-4">
                Ready to Practice?
              </h1>
              <p className="text-xl text-slate-700 mb-2">
                You'll be calling: <span className="font-semibold">{personaName}, {personaRole}</span>
              </p>
              <p className="text-lg text-slate-600">
                {personaCompany} • {session?.difficulty} difficulty • {session?.call_type} call
              </p>
            </div>

            {/* Error display */}
            {(error || vapi.error) && (
              <div className="mb-6 max-w-md bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">
                    {error || (typeof vapi.error === 'string' ? vapi.error : JSON.stringify(vapi.error))}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleStartCall}
                disabled={!assistantId}
                className="group px-12 py-5 bg-emerald-600 text-white text-xl font-bold rounded-2xl hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {assistantId ? 'Start Call' : 'Loading...'}
              </button>
              <Link
                href="/dashboard"
                className="px-12 py-5 bg-slate-100 text-slate-700 text-xl font-bold rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
              >
                Cancel
              </Link>
            </div>

            {/* Tips Card */}
            <div className="mt-16 max-w-2xl bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick Tips
              </h3>
              <ul className="text-slate-600 text-sm space-y-2">
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
              <div className="w-24 h-24 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Connecting...</h2>
              <p className="text-slate-600">Setting up your practice call</p>
            </div>
          </div>
        ) : (
          /* Active Call Screen */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Transcript */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-slate-200 flex flex-col" style={{ height: '75vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900 font-semibold text-lg">Live Transcript</h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  vapi.isSpeaking ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${vapi.isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                  <span className="text-sm font-medium">{vapi.isSpeaking ? 'AI Speaking' : 'Listening'}</span>
                </div>
              </div>

              {/* Transcript Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {vapi.transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>Start speaking to see the transcript...</p>
                  </div>
                ) : (
                  <>
                    {vapi.transcript.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          msg.speaker === 'user' ? 'bg-blue-100' : 'bg-slate-100'
                        }`}>
                          <svg className={`w-5 h-5 ${msg.speaker === 'user' ? 'text-blue-600' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {msg.speaker === 'user' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            )}
                          </svg>
                        </div>
                        <div className={`flex-1 ${msg.speaker === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                            msg.speaker === 'user'
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-sm'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.speaker === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Right: Controls & Stats */}
            <div className="space-y-6">
              {/* Timer Card */}
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-sm">
                <div className="text-sm font-medium mb-2 opacity-90">Call Duration</div>
                <div className="text-5xl font-bold mb-4">{formatTime(vapi.callDuration)}</div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Recording in progress
                </div>
              </div>

              {/* Product Knowledge Hints */}
              <HintPanel
                hints={hints}
                isVisible={hintsVisible}
                onToggle={() => setHintsVisible(!hintsVisible)}
              />

              {/* Audio Visualizer */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-4">Audio Level</h3>
                <div className="flex items-end justify-between h-32 gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-600 rounded-t-full transition-all"
                      style={{
                        height: `${Math.min(100, vapi.volumeLevel * 100 + Math.random() * 20)}%`,
                        opacity: vapi.isConnected ? 0.8 : 0.2
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-4">Controls</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => vapi.setMuted(!vapi.isMuted)}
                    className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      vapi.isMuted
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
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
                    className="w-full px-4 py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
