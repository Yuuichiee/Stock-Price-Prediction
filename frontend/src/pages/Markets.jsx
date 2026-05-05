import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Globe, TrendingUp, BarChart2, Activity } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

// Detect once — avoids per-component useState overhead
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

const MarketCard = ({ title, value, change, isPositive }) => {
  return (
    <Tilt tiltEnable={!IS_MOBILE} tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} className="w-full h-full">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden h-[160px] sm:h-[180px]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="relative z-10">
          <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
          <div className={`text-xs sm:text-sm font-bold mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{change}
          </div>
        </div>
      </div>
    </Tilt>
  );
};


export default function Markets() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <Globe className="w-3.5 h-3.5" /> Macro Overview
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-tighter">
          Global Markets
        </h1>
      </Motion.div>

      <Motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <MarketCard title="S&P 500" value="5,204.34" change="45.12 (0.87%)" isPositive={true} />
        <MarketCard title="NASDAQ" value="16,401.88" change="120.45 (0.74%)" isPositive={true} />
        <MarketCard title="NIFTY 50" value="22,514.65" change="-105.20 (-0.46%)" isPositive={false} />
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <h2 className="text-sm sm:text-lg font-black text-slate-400 uppercase tracking-widest mb-8 sm:mb-12">Global AI Sentiment</h2>
          
          {/* Custom SVG Gauge */}
          <div className="relative w-48 h-24 sm:w-80 sm:h-40 mx-auto">
            <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gaugeGradient)" strokeWidth="8" strokeLinecap="round" />
              <defs>
                <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Hardware Accelerated HTML Needle */}
            <Motion.div 
              className="absolute bottom-0 left-1/2 w-1 sm:w-1.5 h-[80%] bg-white rounded-full origin-bottom transform-gpu will-change-transform shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              initial={{ x: "-50%", rotate: -90 }}
              animate={{ x: "-50%", rotate: 50 }}
              transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.8 }}
            >
              {/* Pointy Tip */}
              <div className="absolute top-0 left-1/2 w-0 h-0 border-l-[2px] border-r-[2px] sm:border-l-[3px] sm:border-r-[3px] border-b-[8px] sm:border-b-[12px] border-transparent border-b-white -translate-x-1/2 -translate-y-full" />
            </Motion.div>
            
            {/* Center Anchor Dot */}
            <div className="absolute bottom-[-4px] sm:bottom-[-6px] left-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-slate-900 border-2 sm:border-[3px] border-white rounded-full -translate-x-1/2" />
          </div>
          
          <Motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-8 text-2xl sm:text-4xl font-black text-emerald-400 uppercase tracking-tighter"
          >
            Strong Bullish
          </Motion.div>
          <Motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.5 }}
            className="text-slate-500 text-xs sm:text-sm mt-3 max-w-md mx-auto leading-relaxed"
          >
            Neural network aggregations across 500+ global assets indicate strong upward momentum for the next 72 hours.
          </Motion.p>
        </div>
      </Motion.div>
    </div>
  );
}
