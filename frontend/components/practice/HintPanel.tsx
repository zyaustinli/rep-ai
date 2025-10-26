import { useEffect, useRef } from 'react';
import { SessionHint } from '@/types';

interface HintPanelProps {
  hints: SessionHint[];
  isVisible: boolean;
  onToggle: () => void;
}

export default function HintPanel({ hints, isVisible, onToggle }: HintPanelProps) {
  const hintsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest hint when new ones arrive
  useEffect(() => {
    if (isVisible && hints.length > 0) {
      hintsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hints.length, isVisible]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Header with toggle */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-slate-900 font-semibold">Product Hints</h3>
          {hints.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              {hints.length}
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title={isVisible ? 'Hide hints' : 'Show hints'}
        >
          {isVisible ? (
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Content (collapsible) */}
      {isVisible && (
        <div className="p-4 max-h-64 overflow-y-auto space-y-3">
          {hints.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Listening for questions...</p>
            </div>
          ) : (
            <>
              {hints.map((hint) => (
                <div
                  key={hint.id}
                  className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {hint.hint_text}
                  </p>
                </div>
              ))}
              <div ref={hintsEndRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
