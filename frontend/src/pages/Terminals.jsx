import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Terminal, Activity, Zap } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

export default function Terminals() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10 flex flex-col items-center justify-center min-h-[70vh]">
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-3xl"
      >
        <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={800} className="w-full">
          <div className="relative bg-slate-900/70 backdrop-blur-2xl border border-white/8 p-10 rounded-2xl shadow-2xl overflow-hidden text-center flex flex-col items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-8 relative z-10 shadow-lg">
              <Terminal className="w-12 h-12 text-blue-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-tighter mb-4 relative z-10">
              Terminal Access
            </h1>
            
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed mb-8 relative z-10 font-mono">
              Raw data streams and CLI access are currently being initialized. Please stand by for secure uplink to the central trading cluster.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-black uppercase tracking-[0.2em] relative z-10">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Initializing Uplink...
            </div>
          </div>
        </Tilt>
      </Motion.div>
    </div>
  );
}
