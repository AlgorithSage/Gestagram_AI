import React, { Suspense, useState, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MousePointer2, Loader2, ArrowLeft } from 'lucide-react';
import { GlobalErrorFallback } from './components/GlobalErrorBoundary';

// Import Landing blocks
import { NavBar } from './components/landing/NavBar';
import { HeroSection } from './components/landing/HeroSection';
// import { MaterialBentoGrid } from './components/landing/MaterialBentoGrid';

const CanvasOverlay = React.lazy(() => import('./components/CanvasOverlay').then(m => ({ default: m.CanvasOverlay })));
const TrackingConfidenceIndicator = React.lazy(() => import('./components/TrackingConfidenceIndicator').then(m => ({ default: m.TrackingConfidenceIndicator })));
import { Toolbar } from './components/canvas/Toolbar';

const queryClient = new QueryClient();

function FallbackLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );
}

function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 1.15;

    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, []);

  return (
    <video
      ref={videoRef}
      src="/BACKGROUND.mp4"
      autoPlay
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover opacity-60"
    />
  );
}

function App() {
  const [appState, setAppState] = useState<'booting' | 'landing' | 'canvas'>('booting');

  // Safety timeout: always exit booting state after 4s even if video events don't fire
  React.useEffect(() => {
    if (appState !== 'booting') return;
    const timer = setTimeout(() => setAppState('landing'), 4000);
    return () => clearTimeout(timer);
  }, [appState]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
        <div className="relative w-full min-h-screen overflow-x-hidden font-sans flex flex-col bg-gesta-cream">
          
          {appState === 'booting' && (
            <div className="fixed inset-0 w-full h-full z-100 bg-black">
              <video 
                src="/loading.mp4" 
                autoPlay 
                muted 
                playsInline 
                onEnded={() => setAppState('landing')}
                onError={() => setAppState('landing')}
                onStalled={() => setTimeout(() => setAppState('landing'), 3000)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}

          {appState === 'landing' && (
            <main className="w-full relative grow flex flex-col">
              {/* Full Webpage Background Video Layer */}
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-gesta-cream">
                <BackgroundVideo />
              </div>

              <div className="relative z-10 flex flex-col grow">
                <NavBar />
                <HeroSection onLaunch={() => setAppState('canvas')} />
              </div>
            </main>
          )}

          {appState === 'canvas' && (
            <div className="relative w-full h-[calc(100vh-16px)] bg-gesta-cream overflow-hidden rounded-md">
               {/* Background Decor: Dot Grid */}
               <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
               
               {/* Back to landing button */}
               <button 
                 onClick={() => setAppState('landing')}
                 className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm glass-btn-secondary"
               >
                 <ArrowLeft className="w-4 h-4" /> Exit Canvas
               </button>

               <Suspense fallback={<FallbackLoader />}>
                 {/* Status Overlay */}
                 <TrackingConfidenceIndicator />
               </Suspense>
               
               {/* Primary Hybrid Workspace Toolbar */}
               <Toolbar />

               {/* Dynamic Instruction Banner */}
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 px-6 py-3 rounded-2xl glass-panel">
                 <span className="text-sm font-semibold tracking-wide text-gesta-dark" role="status">
                   Hold your hand in a fist to draw. Open it to pause.
                 </span>
                 <div className="px-3 py-1 bg-white/60 rounded-lg text-xs font-mono font-semibold border border-white flex items-center gap-2 shadow-sm text-gesta-dark" aria-live="polite">
                   <MousePointer2 className="w-3 h-3" aria-hidden="true" />
                   <span>Hybrid Setup</span>
                 </div>
               </div>

               {/* Primary Interaction Surface */}
               <Suspense fallback={<FallbackLoader />}>
                 <CanvasOverlay />
               </Suspense>
            </div>
          )}
          
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
