import React, { useEffect, useRef, useState } from 'react';
import { handTracker } from '../../engine/handTracker';
import { Loader2 } from 'lucide-react';

export const CameraPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Initialize local webcam stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: { ideal: 30 } },
          audio: false
        });
        
        if (active) {
          video.srcObject = stream;
          await video.play();
        }
      } catch (err) {
        console.error('Webcam access was denied or failed:', err);
        return;
      }

      // 2. Initialize MediaPipe Hands model
      await handTracker.init();
      if (!active) return;
      setIsLoading(false);

      // 3. Define draw listener to overlay skeleton
      handTracker.onResults((results) => {
        if (!active) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw mirrored camera frame first
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Check if hand points are captured
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];

          // Draw skeletal connections (Bones)
          ctx.strokeStyle = '#06b6d4'; // Gesta Cyan
          ctx.lineWidth = 3.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#06b6d4';

          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [5, 9], [9, 10], [10, 11], [11, 12], // Middle
            [9, 13], [13, 14], [14, 15], [15, 16], // Ring
            [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [0, 17] // Palm bottom
          ];

          ctx.beginPath();
          connections.forEach(([p1, p2]) => {
            const pt1 = landmarks[p1];
            const pt2 = landmarks[p2];
            
            // Mirror horizontal coordinates
            ctx.moveTo((1 - pt1.x) * canvas.width, pt1.y * canvas.height);
            ctx.lineTo((1 - pt2.x) * canvas.width, pt2.y * canvas.height);
          });
          ctx.stroke();

          // Draw joints (Landmark dots)
          ctx.shadowBlur = 0;
          landmarks.forEach((pt: any, index: number) => {
            ctx.fillStyle = index === 8 ? '#1CBC80' : '#ffffff'; // Highlight index finger tip in green
            ctx.beginPath();
            ctx.arc((1 - pt.x) * canvas.width, pt.y * canvas.height, index === 8 ? 6 : 4, 0, 2 * Math.PI);
            ctx.fill();
            
            if (index === 8) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          });
        }
      });

      // 4. Start requestAnimationFrame loop feeding frames to handTracker
      const cameraLoop = async () => {
        if (!active) return;
        if (video.readyState >= 2) {
          await handTracker.send(video);
        }
        requestAnimationFrame(cameraLoop);
      };
      
      requestAnimationFrame(cameraLoop);
    }

    setupCamera();

    return () => {
      active = false;
      handTracker.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="absolute top-4 right-16 z-50 flex flex-col items-center">
      {/* Floating preview glass wrapper */}
      <div className="relative w-48 h-36 rounded-2xl overflow-hidden glass-panel border border-white/60 shadow-xl">
        <video
          ref={videoRef}
          muted
          playsInline
          className="hidden"
          style={{ width: '192px', height: '144px' }}
        />
        <canvas
          ref={canvasRef}
          width={192}
          height={144}
          className="w-full h-full object-cover"
        />

        {/* Floating loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white z-50 p-2">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mb-1.5" />
            <span className="text-[10px] font-mono font-semibold tracking-wide uppercase text-slate-300">Loading AI...</span>
          </div>
        )}
      </div>
      
      <span className="mt-1 text-[9px] font-bold font-mono tracking-widest text-slate-500 uppercase">webcam tracker</span>
    </div>
  );
};
