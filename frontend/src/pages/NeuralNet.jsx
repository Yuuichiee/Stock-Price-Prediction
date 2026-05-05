import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { Cpu, Network, Database, Code2, Terminal, CheckCircle2 } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

const FAKE_LOGS = [
  "[SYS] Initializing Random Forest regressor...",
  "[SYS] Loading historical dataset: TSLA (10 years)...",
  "[OK] Data loaded. Shape: (2518, 12).",
  "[SYS] Extracting features: SMA_20, RSI_14, MACD...",
  "[OK] Feature engineering complete.",
  "[SYS] Building ensemble trees (n_estimators=100)...",
  "[NET] Tree 1/100 active.",
  "[NET] Tree 25/100 active.",
  "[NET] Tree 50/100 active.",
  "[NET] Tree 100/100 active.",
  "[OK] Ensemble complete. Mean Absolute Error: 1.2%.",
  "[SYS] Connecting to live data stream...",
  "[OK] Connection stable. Ready for prediction."
];

const NodeGraph = () => (
  <div className="relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center pointer-events-none">
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      <Motion.path
        d="M 50 15 L 25 45 L 50 85 L 75 45 Z"
        fill="none"
        stroke="rgba(16, 185, 129, 0.2)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <Motion.path
        d="M 25 45 L 75 45"
        fill="none"
        stroke="rgba(16, 185, 129, 0.2)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
      />
      <Motion.path
        d="M 50 15 L 50 85"
        fill="none"
        stroke="rgba(16, 185, 129, 0.2)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1 }}
      />
      {[
        { x: 50, y: 15 },
        { x: 25, y: 45 },
        { x: 75, y: 45 },
        { x: 50, y: 85 },
        { x: 50, y: 45 }
      ].map((node, i) => (
        <Motion.circle
          key={i}
          cx={node.x}
          cy={node.y}
          r="2.5"
          fill="#34d399"
          className="filter drop-shadow-[0_0_8px_rgba(52,211,153,1)]"
          animate={{ r: [2.5, 4, 2.5], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5 + Math.random(), repeat: Infinity }}
        />
      ))}
    </svg>
    <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[80px]" />
  </div>
);

export default function NeuralNet() {
  const [logs, setLogs] = useState([]);
  const [isMobile] = useState(() => window.innerWidth < 768);
  const logContainerRef = useRef(null);

  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let bootIndex = 0;
    let liveInterval;

    const bootInterval = setInterval(() => {
      if (bootIndex < FAKE_LOGS.length) {
        setLogs(prev => [...prev, FAKE_LOGS[bootIndex]]);
        bootIndex++;
      } else {
        clearInterval(bootInterval);
        setIsBooting(false);
        
        // Start "live polling" mode
        liveInterval = setInterval(() => {
           const ping = Math.floor(Math.random() * 50) + 12;
           const assets = ['TSLA', 'AAPL', 'NVDA', 'BTC-USD', 'NIFTY 50'];
           const randomAsset = assets[Math.floor(Math.random() * assets.length)];
           const memory = (Math.random() * 2 + 6).toFixed(2);
           
           const newLog = Math.random() > 0.5 
             ? `[NET] Polling stream... Latency ${ping}ms.`
             : `[SYS] Validating ${randomAsset} trajectory. Mem usage: ${memory}GB.`;
             
           // Keep max 30 logs to prevent infinite memory leak
           setLogs(prev => [...prev.slice(-30), newLog]); 
        }, 2500);
      }
    }, 800);

    return () => {
      clearInterval(bootInterval);
      if (liveInterval) clearInterval(liveInterval);
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <Network className="w-3.5 h-3.5" /> Neural Engine Active
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 uppercase tracking-tighter">
          Model Telemetry
        </h1>
      </Motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Brain & Stats */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Tilt tiltEnable={!isMobile} tiltMaxAngleX={2} tiltMaxAngleY={2} scale={1.01} className="w-full">
            <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
              <div className="w-full md:w-1/2">
                <NodeGraph />
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6 relative z-10">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Random Forest</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Ensemble Model Status</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl">
                    <Database className="w-5 h-5 text-blue-400 mb-2" />
                    <div className="text-lg font-black text-white">2.4M</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest">Rows Digested</div>
                  </div>
                  <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl">
                    <Cpu className="w-5 h-5 text-emerald-400 mb-2" />
                    <div className="text-lg font-black text-white">100</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest">Active Trees</div>
                  </div>
                  <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl col-span-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">1.21%</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Mean Absolute Error</div>
                    </div>
                    {isBooting ? (
                      <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tilt>
        </div>

        {/* Right Col: Logs */}
        <div className="lg:col-span-5 flex flex-col h-[400px] md:h-[500px]">
          <div className="bg-slate-950 border border-white/10 rounded-2xl flex flex-col shadow-2xl h-full overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-slate-900/50 shrink-0">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server Console</span>
            </div>
            <div ref={logContainerRef} className="p-4 overflow-y-auto flex-1 font-mono text-xs sm:text-sm text-emerald-400/80 leading-relaxed space-y-2">
              {logs.map((log, index) => (
                <Motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="text-slate-500 mr-2">{new Date().toISOString().split('T')[1].slice(0,-1)}</span>
                  {log}
                </Motion.div>
              ))}
              <Motion.div 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-4 bg-emerald-400 inline-block align-middle ml-1"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
