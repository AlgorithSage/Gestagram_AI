import React from 'react';

export const NavBar: React.FC = () => {
  return (
    <nav className="relative z-50 flex items-center justify-between px-8 md:px-12 py-4 max-w-7xl mx-auto w-full mt-4 rounded-2xl glass-panel">
      <div className="flex items-center gap-2.5">
        <img src="/favicon.png" alt="Gestagram logo" className="w-9 h-9 rounded-full object-cover" />
        <span className="text-xl font-black tracking-tighter text-gesta-dark" style={{ fontFamily: "'Garet', sans-serif" }}>Gestagram</span>
      </div>

      <div className="hidden md:flex items-center gap-1 text-[15px] font-semibold text-[#4A4A4A]">
        <a href="#about" className="px-4 py-2 rounded-xl hover:bg-white/30 hover:backdrop-blur-sm hover:text-black transition-all duration-300">About</a>
        <a href="#features" className="px-4 py-2 rounded-xl hover:bg-white/30 hover:backdrop-blur-sm hover:text-black transition-all duration-300">Features</a>
        <a href="#pricing" className="px-4 py-2 rounded-xl hover:bg-white/30 hover:backdrop-blur-sm hover:text-black transition-all duration-300">Pricing</a>
      </div>

      <div>
        <button className="px-7 py-2.5 rounded-full text-sm glass-btn-secondary">
          Sign In
        </button>
      </div>
    </nav>
  );
};
