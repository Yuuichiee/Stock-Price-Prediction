import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { Terminal as TerminalIcon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import Tilt from 'react-parallax-tilt';

// Detect once at module level — avoids re-renders from resize
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

const generateData = (startPrice, volatility) => {
  let current = startPrice;
  return Array.from({ length: 40 }, () => {
    current = current + (Math.random() - 0.5) * volatility;
    return { value: current };
  });
};

// Memoized so only this card re-renders when its own data changes
const MiniTerminal = React.memo(({ title, symbol, startPrice, color, volatility }) => {
  // Combined state to cut re-renders in half per tick
  const [state, setState] = useState(() => ({
    data: generateData(startPrice, volatility),
    currentPrice: startPrice,
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const lastVal = prev.data[prev.data.length - 1].value;
        const newVal = lastVal + (Math.random() - 0.5) * volatility;
        return {
          data: [...prev.data.slice(1), { value: newVal }],
          currentPrice: newVal,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [volatility]);

  const { data, currentPrice } = state;
  const isUp = data[data.length - 1].value >= data[data.length - 2].value;

  return (
    <div className="w-full h-full transform-gpu transition-transform hover:scale-[1.01] duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 h-64 sm:h-72 flex flex-col shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden relative group">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500`} style={{ backgroundColor: color }} />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{symbol}</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-[0.2em]">{title}</p>
          </div>
          <div className="text-right">
            <div className={`text-xl sm:text-2xl font-black ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`text-[10px] sm:text-xs font-bold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {isUp ? '+' : ''}{(currentPrice - startPrice).toFixed(2)} ({( ((currentPrice - startPrice) / startPrice) * 100 ).toFixed(2)}%)
            </div>
          </div>
        </div>
        
        <div className="flex-1 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 mt-2 relative z-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill={`url(#gradient-${symbol})`} 
                isAnimationActive={false} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});


export default function Terminals() {
  // Defer Recharts mount until after first paint.
  // Recharts ResponsiveContainer uses ResizeObserver — 4 of them firing
  // simultaneously on mount is the main cause of the nav freeze.
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const TERMINALS = [
    { title: 'Apple Inc.',   symbol: 'AAPL',    startPrice: 175.50,   color: '#3b82f6', volatility: 1.2   },
    { title: 'Tesla, Inc.',  symbol: 'TSLA',    startPrice: 198.20,   color: '#10b981', volatility: 2.5   },
    { title: 'NVIDIA Corp.', symbol: 'NVDA',    startPrice: 850.10,   color: '#8b5cf6', volatility: 5.0   },
    { title: 'Bitcoin',      symbol: 'BTC-USD', startPrice: 64500.00, color: '#f59e0b', volatility: 150.0 },
  ];

  const container = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 sm:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <TerminalIcon className="w-3.5 h-3.5" /> Live Data Streams
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-tighter">
          Global Terminal Grid
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-xl">
          High-frequency simulated tick data for multi-asset monitoring.
        </p>
      </Motion.div>

      <Motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      >
        {TERMINALS.map((t) => (
          <Motion.div key={t.symbol} variants={item}>
            {chartsReady
              ? <MiniTerminal {...t} />
              : (
                /* Skeleton shown on first render — no Recharts, no ResizeObserver */
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 h-64 sm:h-72 flex flex-col shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xl font-black text-white">{t.symbol}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">{t.title}</div>
                    </div>
                    <div className="w-24 h-7 bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-800/40 animate-pulse" />
                </div>
              )
            }
          </Motion.div>
        ))}
      </Motion.div>
    </div>
  );
}
