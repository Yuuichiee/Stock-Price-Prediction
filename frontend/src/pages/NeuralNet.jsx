import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Network, Database } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

export default function NeuralNet() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-3xl"
      >
        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={800} className="w-full">
          <div className="relative bg-slate-900/70 backdrop-blur-2xl border border-emerald-500/20 p-10 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.1)] overflow-hidden text-center flex flex-col items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-8 relative z-10 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Cpu className="w-12 h-12 text-emerald-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-tighter mb-4 relative z-10">
              Neural Lattices
            </h1>
            
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed mb-8 relative z-10 font-mono">
              The core ML engine is currently training on localized data sets. Direct visualization of node weights and decision trees will be available shortly.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] relative z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Model Training Active
            </div>
          </div>
        </Tilt>
      </motion.div>
    </div>
  );
}
