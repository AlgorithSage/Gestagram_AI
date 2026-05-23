import { create } from 'zustand';
import type { RecognizedShape } from '../engine/types';

export type ToolType = 'select' | 'pen' | 'eraser' | 'text';
export type ConfidenceType = 'high' | 'medium' | 'low' | 'lost';

interface CanvasState {
  selectedTool: ToolType;
  brushColor: string;
  brushWidth: number;
  trackingConfidence: ConfidenceType;
  isListening: boolean;
  lastTranscript: string;
  voiceEnabled: boolean;
  shapes: RecognizedShape[];
  selectedShapeId: string | null;
  cameraEnabled: boolean;
  
  setSelectedTool: (tool: ToolType) => void;
  setBrushColor: (color: string) => void;
  setBrushWidth: (width: number) => void;
  setTrackingConfidence: (confidence: ConfidenceType) => void;
  setListening: (listening: boolean) => void;
  setLastTranscript: (transcript: string) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setShapes: (shapes: RecognizedShape[]) => void;
  addShape: (shape: RecognizedShape) => void;
  updateShape: (id: string, updates: Partial<RecognizedShape>) => void;
  setSelectedShapeId: (id: string | null) => void;
  clearShapes: () => void;
  setCameraEnabled: (enabled: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedTool: 'pen',
  brushColor: '#06b6d4',
  brushWidth: 6,
  trackingConfidence: 'lost',
  isListening: false,
  lastTranscript: '',
  voiceEnabled: false,
  shapes: [],
  selectedShapeId: null,
  cameraEnabled: false,

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setBrushColor: (color) => set({ brushColor: color }),
  setBrushWidth: (width) => set({ brushWidth: width }),
  setTrackingConfidence: (confidence) => set({ trackingConfidence: confidence }),
  setListening: (listening) => set({ isListening: listening }),
  setLastTranscript: (transcript) => set({ lastTranscript: transcript }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setShapes: (shapes) => set({ shapes }),
  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),
  updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map((s) => s.id === id ? { ...s, ...updates } : s)
  })),
  setSelectedShapeId: (id) => set({ selectedShapeId: id }),
  clearShapes: () => set({ shapes: [], selectedShapeId: null }),
  setCameraEnabled: (enabled) => set({ cameraEnabled: enabled }),
}));
