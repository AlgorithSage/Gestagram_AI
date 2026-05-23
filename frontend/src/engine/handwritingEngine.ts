declare global {
  interface Navigator {
    createHandwritingRecognizer?: (query: { languages: string[] }) => Promise<any>;
  }
}

class HandwritingEngine {
  private recognizer: any = null;

  async init() {
    if (typeof navigator.createHandwritingRecognizer === 'function') {
      try {
        this.recognizer = await navigator.createHandwritingRecognizer({
          languages: ['en']
        });
        console.log('Native Handwriting Recognition API initialized successfully.');
      } catch (err) {
        console.error('Failed to initialize native handwriting recognizer:', err);
      }
    }
  }

  isSupported(): boolean {
    return typeof navigator.createHandwritingRecognizer === 'function';
  }

  async recognize(strokePoints: number[]): Promise<string> {
    if (!this.recognizer) {
      if (this.isSupported()) {
        await this.init();
      }
      if (!this.recognizer) {
        return ''; // Fallback for unsupported browsers
      }
    }

    try {
      // Format points for the native Handwriting API: [{ x, y, t }]
      // Our stroke points are flat: [x1, y1, x2, y2, ...]
      const points = [];
      for (let i = 0; i < strokePoints.length; i += 2) {
        points.push({
          x: strokePoints[i],
          y: strokePoints[i+1],
          t: i * 10 // Mock timestamp increment
        });
      }

      const modelInput = {
        strokes: [{ points }]
      };

      const result = await this.recognizer.getResult([modelInput]);
      if (result && result.length > 0 && result[0].candidates.length > 0) {
        // Return the top-scoring candidate transcript
        return result[0].candidates[0].label || '';
      }
    } catch (err) {
      console.error('Handwriting recognition failed:', err);
    }
    return '';
  }
}

export const handwritingEngine = new HandwritingEngine();
