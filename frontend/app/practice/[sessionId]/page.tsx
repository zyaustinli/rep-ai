'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PracticePage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: 'user' | 'ai', text: string, time: string }>>([]);

  // Simulate audio level animation
  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isCallActive]);

  // Timer
  useEffect(() => {
    if (isCallActive) {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isCallActive]);

  // Demo transcript simulation
  const addDemoMessage = (speaker: 'user' | 'ai', text: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setTranscript(prev => [...prev, { speaker, text, time }]);
  };

  const startCall = () => {
    setIsCallActive(true);
    setDuration(0);
    // Demo: Add AI greeting
    setTimeout(() => {
      setIsAISpeaking(true);
      addDemoMessage('ai', "Hi, this is Sarah Chen. Thanks for reaching out!");
      setTimeout(() => setIsAISpeaking(false), 2000);
    }, 1000);
  };

  const endCall = () => {
    setIsCallActive(false);
    // Navigate to review page
    setTimeout(() => {
      router.push(`/review/${params.sessionId}`);
    }, 500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <div className="text-gray-600 text-sm">Session: {params.sessionId}</div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!isCallActive ? (
          /* Pre-Call Screen */
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center mb-12">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl animate-pulse">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">Ready to Practice?</h1>
              <p className="text-xl text-gray-700 mb-2">You'll be calling: <span className="font-semibold">Sarah Chen, VP of Sales</span></p>
              <p className="text-lg text-gray-600">Medium difficulty • Cold call • 15 minutes</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startCall}
                className="group px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:shadow-2xl hover:scale-110 transition-all flex items-center gap-3"
              >
                <svg className="w-8 h-8 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Start Call
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
        ) : (
          /* Active Call Screen */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Transcript */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-200 flex flex-col" style={{ height: '75vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-800 font-semibold text-lg">Live Transcript</h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  isAISpeaking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isAISpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">{isAISpeaking ? 'AI Speaking' : 'Listening'}</span>
                </div>
              </div>

              {/* Transcript Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Start speaking to see the transcript...</p>
                  </div>
                ) : (
                  transcript.map((msg, idx) => (
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
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area (Demo) */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Your microphone is active..."
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  disabled
                />
                <button
                  onClick={() => addDemoMessage('user', "I'd love to learn more about your current CRM challenges.")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium"
                >
                  Demo Message
                </button>
              </div>
            </div>

            {/* Right: Controls & Stats */}
            <div className="space-y-6">
              {/* Timer Card */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-2xl">
                <div className="text-sm font-medium mb-2 opacity-90">Call Duration</div>
                <div className="text-5xl font-bold mb-4">{formatTime(duration)}</div>
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
                        height: `${Math.random() * 100}%`,
                        opacity: isCallActive ? 0.8 : 0.2
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
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isMuted
                        ? 'bg-red-50 text-red-600 border-2 border-red-200'
                        : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} />
                    </svg>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>

                  <button
                    onClick={endCall}
                    className="w-full px-4 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                    End Call & Review
                  </button>
                </div>
              </div>

              {/* Quick Notes */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-gray-800 font-semibold mb-3">Quick Notes</h3>
                <textarea
                  placeholder="Jot down thoughts during the call..."
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 outline-none resize-none text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
