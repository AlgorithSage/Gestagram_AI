import * as mpHands from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { useCanvasStore } from '../store/canvasStore';

// Access the UMD export robustly across both local bundling and CDN fallback environments
const HandsClass = mpHands.Hands || (window as any).Hands;

class HandTracker {
  private hands: any = null;
  private onResultsCallback: ((results: Results) => void) | null = null;

  async init(): Promise<void> {
    if (this.hands) return;

    try {
      this.hands = new HandsClass({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
      });

      this.hands.onResults((results: Results) => {
        this.processTrackingResults(results);
        if (this.onResultsCallback) {
          this.onResultsCallback(results);
        }
      });

      // Warm up the hands engine
      await this.hands.initialize();
      console.log('✅ MediaPipe Gesture Engine warmed up.');
    } catch (err) {
      console.error('Failed to initialize MediaPipe Hands:', err);
    }
  }

  onResults(callback: (results: Results) => void) {
    this.onResultsCallback = callback;
  }

  async send(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.hands) {
      await this.init();
    }
    if (this.hands) {
      try {
        await this.hands.send({ image: videoElement });
      } catch (err) {
        console.error('Failed to process webcam frame:', err);
      }
    }
  }

  private processTrackingResults(results: Results) {
    const store = useCanvasStore.getState();
    
    // Check if hands were successfully located
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      store.setTrackingConfidence('lost');
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const score = results.multiHandedness[0].score;
    
    // Set confidence level
    if (score > 0.85) {
      store.setTrackingConfidence('high');
    } else if (score > 0.65) {
      store.setTrackingConfidence('medium');
    } else {
      store.setTrackingConfidence('low');
    }

    // Classify gesture: Open Hand (Hover/Select) vs Closed Fist (Draw)
    const gesture = this.classifyGesture(landmarks);
    
    // Trigger virtual coordinates and mouse-like state simulations
    this.simulateCanvasInteraction(landmarks, gesture);
  }

  private classifyGesture(landmarks: any[]): 'draw' | 'select' {
    // WRIST: 0, MCP joints: 5, 9, 13, 17, TIPS: 8, 12, 16, 20
    const wrist = landmarks[0];
    
    const fingerTips = [8, 12, 16, 20];
    const fingerMcps = [5, 9, 13, 17];
    
    let closedFingersCount = 0;
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMcps[i]];
      
      const distTipToWrist = Math.sqrt((tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2);
      const distMcpToWrist = Math.sqrt((mcp.x - wrist.x) ** 2 + (mcp.y - wrist.y) ** 2);
      
      // If fingertip is closer to palm base (wrist) than its base knuckle joint (MCP), it's folded (closed)
      if (distTipToWrist < distMcpToWrist) {
        closedFingersCount++;
      }
    }

    // If at least 3 fingers are folded down, classify as a Fist (Draw mode)
    return closedFingersCount >= 3 ? 'draw' : 'select';
  }

  private simulateCanvasInteraction(landmarks: any[], gesture: 'draw' | 'select') {
    // INDEX_FINGER_TIP is landmark index 8
    const indexTip = landmarks[8];
    
    // Map normalized [0, 1] coordinate space to screen pixel coordinates
    // MediaPipe coordinates are mirrored in horizontal axis usually, so we invert X
    const screenX = (1 - indexTip.x) * window.innerWidth;
    const screenY = indexTip.y * window.innerHeight;

    // Dispatches custom virtual cursor events to CanvasOverlay
    const eventType = gesture === 'draw' ? 'gesture-draw' : 'gesture-hover';
    window.dispatchEvent(new CustomEvent(eventType, {
      detail: { x: screenX, y: screenY }
    }));
  }

  close() {
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
  }
}

export const handTracker = new HandTracker();
