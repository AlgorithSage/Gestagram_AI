import React from 'react';
import { motion } from 'framer-motion';
import { Hand, Gauge, BrainCircuit, Activity } from 'lucide-react';

export const MaterialBentoGrid: React.FC = () => {
  return (
    <section className="relative z-10 w-full px-8 md:px-20 py-32 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center md:text-left"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Where Exceptional Tracking<br/>Meets Great Intelligence.
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl text-lg">
            Discover a sophisticated architecture built for zero-latency gesture recognition, 
            backed by an advanced semantic model engine mapping fluid motions to structured logic.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 p-8 rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
              <Hand className="w-48 h-48 text-cyan-500 transform rotate-12" />
            </div>
            <div className="relative z-10">
               <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30">
                 <Gauge className="w-7 h-7 text-cyan-400" />
               </div>
               <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">60fps Hybrid Tracking</h3>
               <p className="text-slate-400 leading-relaxed max-w-md text-lg">
                 Utilize our highly-optimized bindings bypassing standard DOM rendering 
                 to provide pixel-perfect real-time gesture feedback natively.
               </p>
            </div>
          </motion.div>

          {/* Card 2: Small */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-8 rounded-3xl bg-linear-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 shadow-xl"
          >
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
               <BrainCircuit className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Semantic Engine</h3>
            <p className="text-slate-400 leading-relaxed pb-4">
              Gestures aren’t just lines. They are parsed directly into abstract syntax, converting 
              kinematics into production-grade logic.
            </p>
          </motion.div>

           {/* Card 3: Small */}
           <motion.div 
            whileHover={{ y: -5 }}
            className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl"
          >
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
               <Activity className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Live Collaboration</h3>
            <p className="text-slate-400 leading-relaxed">
              Work securely with multiple coworkers in real-time, backed by our resilient 
              state machine synchronization protocols.
            </p>
          </motion.div>

           {/* Card 4: Wide */}
           <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Enterprise Grade Security</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                Input sanitization via DOMPurify natively integrated. No XSS. No IDOR. 
                Everything is securely handled at the boundary layer before ever hitting the semantic parser.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
