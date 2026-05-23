import React from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export const GlobalErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div 
      className="fixed inset-0 z-9999 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-slate-100 font-sans"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-6">
           <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-full" aria-hidden="true">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Error Detected</h2>
           </div>
           
           <p className="text-slate-400 text-sm mb-6 leading-relaxed">
             An unexpected rendering error occurred in the UI layer. The system has safely halted to prevent corruption.
           </p>

           <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 font-mono text-xs text-red-400 overflow-x-auto mb-8 whitespace-pre">
             {errorMessage}
           </div>

           <button 
             onClick={resetErrorBoundary}
             className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 focus:ring-4 focus:ring-cyan-500/20 text-white font-medium rounded-xl transition-all duration-200 outline-none flex items-center justify-center gap-2 group"
             aria-label="Reboot interface and clear error"
           >
             <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
             Reboot Interface
           </button>
        </div>
      </div>
    </div>
  );
};
