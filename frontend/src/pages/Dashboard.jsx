import React, { useState, useEffect, useRef } from 'react';
import { fetchStocks, predictStock } from '../api';
import StockChart from '../components/StockChart';
import { TrendingUp, Activity, BarChart2, Clock, CheckCircle2, Cpu, Zap, Layers, Globe, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { supabase } from '../supabase';

// --- Interactive Galaxy Starfield — particles flow with mouse movement ---
function StarField() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999, vx: 0, vy: 0 });

  // Track mouse velocity without causing any React re-renders
  useEffect(() => {
    let prevX = -9999, prevY = -9999;
    const onMove = (e) => {
      mouseRef.current = {
        x: e.clientX, y: e.clientY,
        vx: e.clientX - prevX, vy: e.clientY - prevY,
      };
      prevX = e.clientX; prevY = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 160 particles with position, velocity, size, base opacity
    const N = 160;
    const P = Array.from({ length: N }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r:  Math.random() * 1.3 + 0.2,
      op: Math.random() * 0.5 + 0.25,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const { x: mx, y: my, vx: mvx, vy: mvy } = mouseRef.current;

      // Semi-transparent fill = trail / motion blur effect (galaxy look)
      ctx.fillStyle = 'rgba(2, 8, 23, 0.18)';
      ctx.fillRect(0, 0, W, H);

      P.forEach(p => {
        const dx   = mx - p.x;
        const dy   = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Within 180px: flow in direction of mouse + subtle repulsion from exact center
        if (dist < 180) {
          const strength = (180 - dist) / 180;
          p.vx += (mvx * 0.025 - dx * 0.0006) * strength;
          p.vy += (mvy * 0.025 - dy * 0.0006) * strength;
        }

        // Soft damping + tiny random drift
        p.vx = p.vx * 0.96 + (Math.random() - 0.5) * 0.008;
        p.vy = p.vy * 0.96 + (Math.random() - 0.5) * 0.008;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;

        // Slow opacity flicker
        p.op += (Math.random() - 0.5) * 0.012;
        p.op  = Math.max(0.1, Math.min(0.85, p.op));

        // Near-mouse glow: radius grows, color shifts to electric blue-white
        const near   = Math.max(0, 1 - dist / 140);
        const radius = p.r + near * 2.2;

        // Gradient from slate-grey → icy blue as it approaches cursor
        const r = Math.round(148 + near * 107);
        const g = Math.round(163 + near * 92);
        const b = Math.round(184 + near * 71);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.op + near * 0.4})`;
        ctx.fill();
      });

      // Subtle nebula glow ring around cursor
      if (mx > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 120);
        grad.addColorStop(0,   'rgba(99,102,241,0.07)');
        grad.addColorStop(0.5, 'rgba(59,130,246,0.04)');
        grad.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #020817 0%, #050c1f 50%, #030a18 100%)' }}
    />
  );
}


// Floating orb decoration
function FloatingOrb({ className, style }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// --- Live Ticker ---
function LiveTicker() {
  const COPIES = 4;
  const baseData = [
    { sym: 'S&P 500',   base: 5023.14  },
    { sym: 'NASDAQ',    base: 15990.11 },
    { sym: 'DOW JONES', base: 38671.69 },
    { sym: 'VIX',       base: 13.41    },
    { sym: 'BITCOIN',   base: 51432.00 },
    { sym: 'GOLD',      base: 2024.10  },
  ];

  const valRefs    = useRef([]);
  const changeRefs = useRef([]);

  useEffect(() => {
    const current = baseData.map(d => d.base);
    const targets  = baseData.map(d => d.base);

    // Shift targets every 2.5s
    const targetInterval = setInterval(() => {
      baseData.forEach((d, i) => {
        const delta = d.base * (Math.random() * 0.006 - 0.003);
        targets[i] = +(targets[i] + delta).toFixed(2);
      });
    }, 2500);

    // Throttle ticker to ~20fps — smooth enough for numbers, frees CPU for scroll animations
    let raf;
    let lastTick = 0;
    const TICK_INTERVAL = 1000 / 20;

    const tick = (timestamp) => {
      if (timestamp - lastTick >= TICK_INTERVAL) {
        lastTick = timestamp;
        baseData.forEach((d, i) => {
          // Lerp adjusted for ~20fps
          current[i] += (targets[i] - current[i]) * 0.18;

          const formatted = current[i].toLocaleString('en-US', {
            minimumFractionDigits: 2, maximumFractionDigits: 2,
          });
          const changePct = ((current[i] - d.base) / d.base) * 100;
          const changeStr = (changePct >= 0 ? '+' : '') + changePct.toFixed(2) + '%';
          const cls = changePct >= 0
            ? 'text-emerald-400 tabular-nums'
            : 'text-red-400 tabular-nums';

          for (let copy = 0; copy < COPIES; copy++) {
            const idx = copy * baseData.length + i;
            if (valRefs.current[idx])    valRefs.current[idx].textContent = formatted;
            if (changeRefs.current[idx]) {
              changeRefs.current[idx].textContent = changeStr;
              changeRefs.current[idx].className   = cls;
            }
          }
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf); clearInterval(targetInterval); };
  }, []);

  return (
    <div className="bg-[#03050a]/90 border-b border-white/5 py-1.5 z-50 relative overflow-hidden flex items-center">
      <div className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-white/10 hidden sm:flex items-center gap-2 shrink-0">
        <Activity className="w-3 h-3 text-blue-500 animate-pulse" /> LIVE
      </div>
      <div className="overflow-hidden flex-1 relative">
        <div className="animate-marquee flex gap-12 whitespace-nowrap">
          {[...Array(COPIES)].map((_, ai) =>
            baseData.map((d, i) => {
              const refIdx = ai * baseData.length + i;
              return (
                <span key={`${ai}-${i}`} className="inline-flex items-center gap-3 text-xs font-mono font-bold">
                  <span className="text-slate-400">{d.sym}</span>
                  <span
                    className="text-white tabular-nums"
                    ref={el => { valRefs.current[refIdx] = el; }}
                  >
                    {d.base.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className="text-emerald-400 tabular-nums"
                    ref={el => { changeRefs.current[refIdx] = el; }}
                  >
                    +0.00%
                  </span>
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


// --- Typing indicator ---
function NetworkIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1"></rect>
      <rect x="2" y="16" width="6" height="6" rx="1"></rect>
      <rect x="9" y="2" width="6" height="6" rx="1"></rect>
      <path d="M5 16v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"></path>
      <path d="M12 8v3"></path>
    </svg>
  );
}

function Dashboard({ user }) {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('1d');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const spotlightRef = useRef(null);

  useEffect(() => {
    fetchStocks()
      .then(data => {
        setStocks(data);
        if (data.length > 0) setSelectedStock(data[0].symbol);
      })
      .catch(() => setError('Failed to connect to backend. Is the server running?'));

    // Direct DOM update — zero React re-renders on mouse move
    const handle = (e) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background =
          `radial-gradient(500px circle at ${e.clientX}px ${e.clientY}px, rgba(59,130,246,0.08), transparent 50%)`;
      }
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await predictStock(selectedStock, timeHorizon);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };
  const pop = {
    hidden: { opacity: 0, scale: 0.85, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 22 } },
  };
  const slideIn = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 380, damping: 24 } },
  };

  return (
    <div className="min-h-screen text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">

      {/* Background */}
      <StarField />

      {/* Floating orbs */}
      <FloatingOrb className="w-[500px] h-[500px] bg-blue-700/20" style={{ top: '-10%', left: '-10%' }} />
      <FloatingOrb className="w-[400px] h-[400px] bg-indigo-600/15" style={{ top: '30%', right: '-8%' }} />
      <FloatingOrb className="w-[300px] h-[300px] bg-emerald-600/10" style={{ bottom: '10%', left: '20%' }} />

      {/* Mouse spotlight — updated via ref, no React re-renders */}
      <div
        ref={spotlightRef}
        className="pointer-events-none fixed inset-0 z-0"
      />

      <LiveTicker />

      {/* Navbar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
        className="sticky top-0 z-40 bg-[#050c1f]/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-md opacity-30 group-hover:opacity-70 transition-opacity rounded-xl" />
              <div className="relative p-2 bg-slate-800/80 border border-slate-700/60 rounded-xl">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tighter text-white">
              PREDICTIFI<span className="text-blue-500">.AI</span>
            </span>
          </motion.div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.18em]">
            {['Terminals', 'Neural Net', 'Markets'].map((item) => (
              <motion.a
                key={item}
                href="#"
                className="hover:text-white transition-colors"
                whileHover={{ y: -1 }}
              >
                {item}
              </motion.a>
            ))}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs text-slate-300 font-mono max-w-[120px] truncate">{user?.email}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-bold tracking-wider transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </motion.button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Live Neural Prediction Engine
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 leading-[0.95] mb-6">
            The Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Market Intelligence
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed mb-10">
            Harness Random Forest AI and real-time financial data to generate precision price trajectories.
          </p>
        </motion.div>
      </section>

      {/* Error banner */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-8 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg flex items-center gap-3 text-red-400"
            >
              <Activity className="w-5 h-5 shrink-0 animate-pulse" />
              <p className="font-bold text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-6 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={container}
          className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start"
        >
          {/* Left column: Controls + Result */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Command Deck Card */}
            <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} perspective={1200} transitionSpeed={800} scale={1.01} glareEnable glareMaxOpacity={0.08} glarePosition="all" className="rounded-2xl">
              <motion.div
                variants={slideIn}
                className="relative bg-slate-900/70 backdrop-blur-2xl border border-white/8 p-7 rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Card glow */}
                <div className="absolute top-0 right-0 w-52 h-52 bg-blue-600/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Command Deck</h2>
                    <div className="h-0.5 w-10 bg-gradient-to-r from-blue-500 to-emerald-500 mt-2 rounded-full" />
                  </div>
                  <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                    <Cpu className="w-5 h-5 text-slate-300" />
                  </div>
                </div>

                <form onSubmit={handlePredict} className="space-y-6 relative z-10">
                  {/* Instrument select */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.18em]">Target Instrument</label>
                    <select
                      value={selectedStock}
                      onChange={e => setSelectedStock(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/50 text-white text-sm font-bold rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 p-3.5 transition-all appearance-none outline-none cursor-pointer"
                    >
                      {stocks.map(s => (
                        <option key={s.symbol} value={s.symbol} className="bg-slate-900">
                          {s.name} ({s.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time horizon */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.18em]">Temporal Horizon</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-1.5 rounded-xl border border-slate-700/30">
                      {['1d', '3d', '1w'].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setTimeHorizon(h)}
                          className={`relative py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${timeHorizon === h ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {timeHorizon === h && (
                            <motion.span layoutId="horizon-tab" className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg -z-10" />
                          )}
                          <span className="relative z-10">{h === '1d' ? 'T+1' : h === '3d' ? 'T+3' : 'T+7'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading || stocks.length === 0}
                    className="w-full relative overflow-hidden py-4 text-sm font-black uppercase tracking-[0.18em] text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] border border-white/15 group"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {loading ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="relative z-10">
                        <Layers className="w-5 h-5" />
                      </motion.span>
                    ) : (
                      <span className="relative z-10 flex items-center gap-2">
                        Initiate Sequence <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </span>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </Tilt>

            {/* Result telemetry card */}
            <AnimatePresence>
              {result && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                >
                  <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} className="rounded-2xl">
                    <div className="relative bg-slate-900/70 backdrop-blur-2xl border-2 border-emerald-500/25 p-7 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.12)] overflow-hidden">
                      <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/20 blur-3xl pointer-events-none" />
                      <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Telemetry Acquired
                      </h3>
                      <div className="space-y-4 relative z-10">
                        <div className="flex flex-col gap-0.5 pb-4 border-b border-white/5">
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">Validated Asset</span>
                          <span className="font-black text-white text-lg">{result.symbol}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 pb-4 border-b border-white/5">
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">Confidence (R²)</span>
                          <span className="font-black text-emerald-400 text-2xl">{result.accuracy}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 pt-1">
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">Projected Target</span>
                          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-4xl tracking-tighter">
                            ${result.predictions[result.predictions.length - 1].Predicted_Close.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Tilt>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column: Chart area */}
          <motion.div variants={pop} className="xl:col-span-8">
            <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/8 p-6 sm:p-8 rounded-2xl shadow-2xl min-h-[560px] flex flex-col overflow-hidden ring-1 ring-white/5">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-700/8 rounded-full blur-3xl pointer-events-none" />

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-20 h-20 rounded-full border-2 border-t-blue-500 border-slate-700 mb-6"
                  />
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Aggregating</h3>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Querying neural datasets...</p>
                </div>
              ) : result ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col h-full"
                >
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-5 gap-4">
                    <div>
                      <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-1">
                        {result.symbol} <span className="text-slate-600 font-medium text-2xl">INDEX</span>
                      </h2>
                      <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        T+{timeHorizon === '1d' ? '24 Hours' : timeHorizon === '3d' ? '72 Hours' : '168 Hours'} Trajectory
                      </p>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Sync
                    </div>
                  </div>
                  <div className="flex-1 min-h-[380px]">
                    <StockChart historical={result.historical} predictions={result.predictions} />
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="mb-6"
                  >
                    <BarChart2 className="w-16 h-16 opacity-20" />
                  </motion.div>
                  <h3 className="text-3xl font-black text-slate-500 uppercase tracking-tighter mb-3">Awaiting Signal</h3>
                  <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
                    Select an instrument and initiate a prediction sequence to begin.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Feature highlight section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0 } },
          }}
          className="mt-32 mb-20"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
            }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] mb-6">
              System Overview
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 uppercase tracking-tighter">
              The Engine.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Cpu />, title: 'Forest AI', desc: 'Non-linear ensemble mapping powered by 100-tree Random Forest regression for robust price forecasting.', color: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/20' },
              { icon: <Activity />, title: 'Live Algos', desc: 'Real-time extraction of SMA, RSI, and MACD crossover signals sourced from Yahoo Finance data.', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
              { icon: <TrendingUp />, title: 'Trajectory', desc: 'Multi-day interpolated price projections with T+1, T+3, and T+7 forecast horizons.', color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-500/20' },
            ].map((f, i) => (
              <Tilt key={i} tiltMaxAngleX={12} tiltMaxAngleY={12} scale={1.03} transitionSpeed={400} perspective={800} className="h-full">
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
                  }}
                  className="relative bg-slate-900/70 backdrop-blur-xl border border-white/6 p-8 rounded-2xl h-full hover:border-white/15 transition-all shadow-xl group overflow-hidden cursor-default"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className={`p-3.5 bg-gradient-to-br ${f.color} w-fit rounded-2xl mb-6 shadow-lg ${f.shadow} text-white group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-3">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              </Tilt>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-slate-600 text-xs font-mono tracking-widest">
          PREDICTIFI.AI © 2025 — NEURAL LATTICE v2.0 — ALL HORIZONS CLEARED
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
