import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { voiceEngine } from '../../engine/voiceEngine';

export const VoiceIndicator: React.FC = () => {
  const { isListening, lastTranscript, voiceEnabled, setVoiceEnabled } = useCanvasStore();
  const [interimText, setInterimText] = useState('');
  const isSupported = voiceEngine.isSupported();

  useEffect(() => {
    if (!isSupported) return;

    if (voiceEnabled) {
      voiceEngine.startListening((text, isFinal) => {
        setInterimText(text);
        if (isFinal) {
          // Clear interim text after a brief moment
          setTimeout(() => setInterimText(''), 1000);
        }
      });
    } else {
      voiceEngine.stopListening();
      setInterimText('');
    }

    return () => {
      voiceEngine.stopListening();
    };
  }, [voiceEnabled, isSupported]);

  const handleToggle = () => {
    if (!isSupported) return;
    setVoiceEnabled(!voiceEnabled);
  };

  if (!isSupported) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono font-medium shadow-sm">
        <MicOff className="w-3.5 h-3.5" />
        <span>Voice features not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {/* Primary Pill */}
      <button
        onClick={handleToggle}
        className={`pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-lg transition-all duration-300 backdrop-blur-xl ${
          voiceEnabled
            ? isListening
              ? 'bg-cyan-950/40 border-cyan-400/50 text-cyan-200 shadow-cyan-500/10 scale-105 hover:bg-cyan-900/40'
              : 'bg-slate-900/40 border-slate-400/40 text-slate-200 hover:bg-slate-800/40'
            : 'bg-white/40 border-white/60 text-slate-700 hover:bg-white/50'
        }`}
        aria-label={voiceEnabled ? 'Disable voice command' : 'Enable voice command'}
      >
        <div className="relative">
          {voiceEnabled && isListening && (
            <span className="absolute -inset-1.5 rounded-full bg-cyan-400/30 animate-ping" />
          )}
          {voiceEnabled ? (
            <Mic className={`w-4 h-4 ${isListening ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
          ) : (
            <MicOff className="w-4 h-4 text-slate-500" />
          )}
        </div>

        <span className="text-xs font-mono font-semibold tracking-wide uppercase">
          {voiceEnabled ? (isListening ? 'Listening' : 'Voice Enabled') : 'Voice Off'}
        </span>

        {voiceEnabled && (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </button>

      {/* Transcript Rolling Display */}
      {voiceEnabled && (interimText || lastTranscript) && (
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-card text-xs font-medium max-w-md shadow-md animate-fade-in text-gesta-dark">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="truncate italic">
            {interimText || lastTranscript}
          </span>
        </div>
      )}
    </div>
  );
};
