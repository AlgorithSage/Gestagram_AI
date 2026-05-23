import React from 'react';
import { 
  MousePointer2, 
  PenTool, 
  Eraser, 
  Type,
  Trash2,
  Mic,
  MicOff,
  Video,
  VideoOff
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ToolType } from '../../store/canvasStore';

export const Toolbar: React.FC = () => {
  const { 
    selectedTool, 
    brushColor, 
    brushWidth,
    voiceEnabled, 
    cameraEnabled,
    setSelectedTool, 
    setBrushColor, 
    setBrushWidth,
    setVoiceEnabled,
    setCameraEnabled
  } = useCanvasStore();

  const colors = [
    '#06b6d4', // Gesta Cyan (Default)
    '#1CBC80', // Gesta Green
    '#FF6B6B', // Red
    '#FFE66D', // Yellow
    '#A78BFA', // Purple
    '#2D2D2D'  // Dark
  ];

  const handleClear = () => {
    window.dispatchEvent(new CustomEvent('clear-canvas'));
  };

  const getBtnClass = (tool: ToolType) => {
    const baseClass = "glass-icon-btn group relative transition-all duration-200";
    if (selectedTool === tool) {
      return `${baseClass} bg-gesta-dark text-[#F9F9F9] scale-105 border-gesta-dark/50 shadow-md hover:bg-gesta-dark/90`;
    }
    return baseClass;
  };

  return (
    <div className="absolute top-1/2 left-6 -translate-y-1/2 z-50 flex flex-col items-center space-y-3 px-2.5 py-4 rounded-3xl glass-panel">
      
      {/* Selection Tool */}
      <button 
        onClick={() => setSelectedTool('select')}
        className={getBtnClass('select')}
        aria-label="Select Tool"
      >
        <MousePointer2 className="w-5 h-5" />
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Select (V)
        </span>
      </button>

      {/* Separator */}
      <div className="w-10 h-px bg-slate-300/50 my-1" />

      {/* Drawing Tools */}
      <button 
        onClick={() => setSelectedTool('pen')}
        className={getBtnClass('pen')}
        aria-label="Draw Tool"
      >
        <PenTool className="w-5 h-5" />
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Draw (P) / AI Gesture
        </span>
      </button>

      <button 
        onClick={() => setSelectedTool('eraser')}
        className={getBtnClass('eraser')}
        aria-label="Eraser Tool"
      >
        <Eraser className="w-5 h-5" />
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Erase (E)
        </span>
      </button>

      <button 
        onClick={() => setSelectedTool('text')}
        className={getBtnClass('text')}
        aria-label="Text Tool"
      >
        <Type className="w-5 h-5" />
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Text (T)
        </span>
      </button>

      {/* Separator */}
      <div className="w-10 h-px bg-slate-300/50 my-1" />

      {/* Voice Toggle */}
      <button 
        onClick={() => setVoiceEnabled(!voiceEnabled)}
        className={`glass-icon-btn group relative transition-all duration-200 ${
          voiceEnabled ? 'bg-cyan-100 border-cyan-300 text-cyan-700 shadow-xs' : ''
        }`}
        aria-label="Voice Commands"
      >
        {voiceEnabled ? <Mic className="w-5 h-5 text-cyan-600" /> : <MicOff className="w-5 h-5 text-slate-500" />}
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Voice Control ({voiceEnabled ? 'On' : 'Off'})
        </span>
      </button>

      {/* AI Webcam Gesture Tracking Toggle */}
      <button 
        onClick={() => setCameraEnabled(!cameraEnabled)}
        className={`glass-icon-btn group relative transition-all duration-200 ${
          cameraEnabled ? 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-xs' : ''
        }`}
        aria-label="Webcam Gesture Controls"
      >
        {cameraEnabled ? <Video className="w-5 h-5 text-emerald-600 animate-pulse" /> : <VideoOff className="w-5 h-5 text-slate-500" />}
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          AI Hand Gesture Tracker ({cameraEnabled ? 'On' : 'Off'})
        </span>
      </button>

      {/* Separator */}
      <div className="w-10 h-px bg-slate-300/50 my-1" />

      {/* Brush Size Slider */}
      <div className="flex flex-col items-center gap-1.5 py-1">
        <span className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-wider">Size</span>
        <input 
          type="range" 
          min="2" 
          max="24" 
          value={brushWidth} 
          onChange={(e) => setBrushWidth(parseInt(e.target.value))}
          className="w-12 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gesta-dark"
          style={{ transform: 'rotate(0deg)' }}
          aria-label="Brush width controller"
        />
        <span className="text-[10px] font-bold font-mono text-gesta-dark">{brushWidth}px</span>
      </div>

      {/* Separator */}
      <div className="w-10 h-px bg-slate-300/50 my-1" />

      {/* Color Palette */}
      <div className="flex flex-col gap-2 py-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setBrushColor(color)}
            style={{ backgroundColor: color }}
            className={`w-6 h-6 rounded-full border border-white/50 shadow-xs hover:scale-110 transition-transform duration-200 cursor-pointer ${
              brushColor === color ? 'ring-2 ring-gesta-dark ring-offset-2 scale-110' : ''
            }`}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>

      {/* Separator */}
      <div className="w-10 h-px bg-slate-300/50 my-1" />

      {/* Utilities */}
      <button 
        onClick={handleClear}
        className="glass-icon-btn group relative hover:text-red-500 hover:border-red-200 transition-all duration-200"
        aria-label="Clear Canvas"
      >
        <Trash2 className="w-5 h-5" />
        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Clear Canvas
        </span>
      </button>

    </div>
  );
};
