import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, BarChart2, Globe } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

export default function Markets() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-3xl"
      >
        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={800} className="w-full">
          <div className="relative bg-slate-900/70 backdrop-blur-2xl border border-indigo-500/20 p-10 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.1)] overflow-hidden text-center flex flex-col items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl mb-8 relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <BarChart2 className="w-12 h-12 text-indigo-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-tighter mb-4 relative z-10">
              Global Markets
            </h1>
            
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed mb-8 relative z-10 font-mono">
              Macro-economic indicators and cross-exchange analytics are syncing. Waiting for complete data population from external APIs.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] relative z-10">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Syncing Exchanges...
            </div>
          </div>
        </Tilt>
      </motion.div>
    </div>
  );
}
