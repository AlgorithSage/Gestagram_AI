import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { ConfidenceType } from '../store/canvasStore';

interface StateConfig {
  color: string;
  text: string;
  aria?: string;
}

const stateConfig: Record<ConfidenceType, StateConfig> = {
  high: { color: 'bg-emerald-500', text: 'Tracker connected' },
  medium: { color: 'bg-amber-500', text: 'Please move closer' },
  low: { color: 'bg-orange-500', text: 'Locating hand...' },
  lost: { color: 'bg-red-500', text: 'Waiting for hand input', aria: 'alert' }
};

export const TrackingConfidenceIndicator: React.FC = () => {
  const confidence = useCanvasStore((state) => state.trackingConfidence);
  const config = stateConfig[confidence];

  return (
    <div 
      role={config.aria || 'status'}
      aria-live="polite" 
      className="absolute top-4 right-4 flex items-center gap-2.5 px-4 py-2 rounded-full glass-card z-50 transition-all duration-300"
    >
      <span className={`w-2.5 h-2.5 rounded-full ${config.color} animate-pulse`} />
      <span className="text-gesta-dark text-xs font-mono font-semibold">{config.text}</span>
    </div>
  );
};
