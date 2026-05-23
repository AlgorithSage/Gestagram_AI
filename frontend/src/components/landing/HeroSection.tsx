import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Props {
  onLaunch: () => void;
}

export const HeroSection: React.FC<Props> = ({ onLaunch }) => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-8 md:px-12 py-8 md:py-0 z-10 flex flex-col md:flex-row items-center gap-0 grow">

      {/* Left Column: Text & CTA */}
      <div className="w-full md:w-[50%] flex flex-col items-start justify-center shrink-0 z-10 relative">
        <h1 className="text-3xl md:text-[5.3rem] font-black text-gesta-dark tracking-tighter leading-[0.95] mb-6" style={{ fontFamily: "'Garet', sans-serif" }}>
          GestagramAI
        </h1>

        <p className="text-lg md:text-2xl text-[#4A4A4A] font-medium tracking-tight leading-relaxed mb-4 max-w-lg"
          style={{ fontFamily: "'Garet', sans-serif" }}>
          Your ultimate AI-powered gesture-controlled drawing canvas
        </p>

        <p className="text-base text-[#6B6B6B] font-medium leading-relaxed mb-10 max-w-sm">
          A truly hybrid creative environment marrying seamless AI gesture mapping with professional drawing tools, all wrapped in a stunning iridescent spatial UI.
        </p>

        <div className="flex flex-row items-center gap-4">
          <button
            onClick={onLaunch}
            className="w-40 py-3.5 rounded-xl glass-btn-primary font-bold text-base"
          >
            Try Now
          </button>

          <button
            className="w-40 py-3.5 rounded-xl glass-btn-secondary font-bold text-base"
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Right Column: Lottie Animation + Drawing Elements */}
      <div
        className="w-full md:w-[50%] flex items-center justify-center overflow-visible relative"
        style={{ mixBlendMode: 'multiply' }}
      >
        <DotLottieReact
          src="/animator.lottie"
          loop
          autoplay
          className="w-[200%] md:w-[280%] scale-110 md:scale-[1.35] h-auto z-0"
        />

        {/* Floating Drawing Elements */}
        {/* Pencil icon — top right */}
        <div className="absolute top-4 right-8 md:top-8 md:right-12 z-10 animate-float">
          <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D2D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </div>
        </div>

        {/* Color palette — bottom right */}
        <div className="absolute bottom-8 right-4 md:bottom-12 md:right-8 z-10 animate-float-delayed">
          <div className="flex gap-1.5 px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 shadow-md">
            <div className="w-5 h-5 rounded-full bg-[#FF6B6B]" />
            <div className="w-5 h-5 rounded-full bg-[#4ECDC4]" />
            <div className="w-5 h-5 rounded-full bg-[#FFE66D]" />
            <div className="w-5 h-5 rounded-full bg-[#A78BFA]" />
            <div className="w-5 h-5 rounded-full bg-gesta-dark" />
          </div>
        </div>

        {/* Brush icon — top left area */}
        <div className="absolute top-16 left-0 md:top-20 md:-left-4 z-10 animate-float-slow">
          <div className="w-11 h-11 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-md flex items-center justify-center rotate-[-15deg]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D2D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>
          </div>
        </div>

        {/* Cursor click — bottom left */}
        <div className="absolute bottom-20 left-8 md:bottom-24 md:left-4 z-10 animate-float-delayed">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D2D2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z"/></svg>
          </div>
        </div>

        {/* Star sparkle — mid right */}
        <div className="absolute top-1/2 -right-2 md:right-0 z-10 animate-float-slow">
          <div className="w-9 h-9 rounded-lg bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>
          </div>
        </div>
      </div>

    </section>
  );
};
