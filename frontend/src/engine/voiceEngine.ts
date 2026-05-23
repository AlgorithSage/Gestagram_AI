import { useCanvasStore } from '../store/canvasStore';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

class VoiceEngine {
  private recognition: any = null;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        useCanvasStore.getState().setListening(true);
      };

      this.recognition.onend = () => {
        useCanvasStore.getState().setListening(false);
      };

      this.recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error);
        useCanvasStore.getState().setListening(false);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(currentText, !!finalTranscript);
        }

        if (finalTranscript) {
          this.processFinalTranscript(finalTranscript.trim());
        }
      };
    }
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  startListening(onTranscript: (text: string, isFinal: boolean) => void) {
    if (!this.recognition) return;
    this.onTranscriptCallback = onTranscript;
    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Speech recognition already started:', err);
    }
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
  }

  private processFinalTranscript(text: string) {
    const lowerText = text.toLowerCase();
    const store = useCanvasStore.getState();

    // 1. Command: "clear canvas" or "clear board"
    if (lowerText.includes('clear canvas') || lowerText.includes('clear board') || lowerText.includes('clear all')) {
      window.dispatchEvent(new CustomEvent('clear-canvas'));
      store.setLastTranscript('Command: Clear Canvas');
      return;
    }

    // 2. Command: "select tool [select/pen/eraser/text]" or "change tool to..."
    if (lowerText.includes('select tool') || lowerText.includes('change tool to') || lowerText.startsWith('tool ')) {
      if (lowerText.includes('select') || lowerText.includes('pointer')) {
        store.setSelectedTool('select');
        store.setLastTranscript('Command: Selected tool Pointer');
        return;
      } else if (lowerText.includes('pen') || lowerText.includes('draw')) {
        store.setSelectedTool('pen');
        store.setLastTranscript('Command: Selected tool Pen');
        return;
      } else if (lowerText.includes('eraser') || lowerText.includes('erase')) {
        store.setSelectedTool('eraser');
        store.setLastTranscript('Command: Selected tool Eraser');
        return;
      } else if (lowerText.includes('text') || lowerText.includes('type')) {
        store.setSelectedTool('text');
        store.setLastTranscript('Command: Selected tool Text');
        return;
      }
    }

    // 3. Command: "change color to [color]" or "color [color]"
    if (lowerText.includes('color to ') || lowerText.startsWith('color ')) {
      const colorsMap: Record<string, string> = {
        cyan: '#06b6d4',
        green: '#1CBC80',
        red: '#FF6B6B',
        yellow: '#FFE66D',
        purple: '#A78BFA',
        black: '#2D2D2D',
        dark: '#2D2D2D'
      };

      for (const [name, value] of Object.entries(colorsMap)) {
        if (lowerText.includes(name)) {
          store.setBrushColor(value);
          store.setLastTranscript(`Command: Changed color to ${name}`);
          return;
        }
      }
    }

    // 4. Dictation: apply text label to the selected or last drawn shape
    store.setLastTranscript(text);
    
    // Find shape to label: either the selected shape or the most recently added shape
    const { shapes, selectedShapeId, updateShape } = store;
    const targetId = selectedShapeId || (shapes.length > 0 ? shapes[shapes.length - 1].id : null);
    
    if (targetId) {
      updateShape(targetId, { label: text });
      
      // Sync the updated label to other users via socket
      window.dispatchEvent(new CustomEvent('sync-shape-label', { 
        detail: { id: targetId, label: text } 
      }));
    }
  }
}

export const voiceEngine = new VoiceEngine();
