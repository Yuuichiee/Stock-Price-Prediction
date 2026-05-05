import React, { useState, useEffect, useRef } from 'react';
import { fetchStocks, predictStock } from '../api';
import StockChart from '../components/StockChart';
import { TrendingUp, Activity, BarChart2, Clock, CheckCircle2, Cpu, Zap, Layers } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import confetti from 'canvas-confetti';

// Layout components moved to Layout.jsx

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

function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('1d');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
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

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('mousemove', handle);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (result && !loading) {
      const finalPred = result.predictions?.at(-1);
      const lastHist = result.historical?.at(-1)?.Close;
      if (finalPred && lastHist) {
        if (finalPred.Predicted_Close >= lastHist) {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#34d399', '#10b981', '#059669', '#ffffff']
          });
        }
      }
    }
  }, [result, loading]);

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

  const finalPrediction = result?.predictions?.at(-1);
  const lastHistorical = result?.historical?.at(-1)?.Close;
  const isGoodPrediction = finalPrediction && lastHistorical && (finalPrediction.Predicted_Close >= lastHistorical);
  const currencySymbol = result?.symbol?.endsWith('.NS') ? '₹' : '$';

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
    <div className="w-full flex-1">

      {/* Hero */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-4 text-center relative z-10">
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="inline-flex max-w-full items-center gap-2 px-3 sm:px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] sm:tracking-[0.3em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Live Neural Prediction Engine
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 leading-[1.1] sm:leading-[0.95] mb-6 break-words">
            The Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Market Intelligence
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-8 sm:mb-10">
            Harness Random Forest AI and real-time financial data to generate precision price trajectories.
          </p>
        </Motion.div>
      </section>

      {/* Error banner */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatePresence>
          {error && (
            <Motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-8 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg flex items-center gap-3 text-red-400"
            >
              <Activity className="w-5 h-5 shrink-0 animate-pulse" />
              <p className="font-bold text-sm">{error}</p>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 relative z-10">
        <Motion.div
          initial="hidden"
          animate="visible"
          variants={container}
          className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start"
        >
          {/* Left column: Controls + Result */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Command Deck Card */}
            <Tilt tiltEnable={!isMobile} glareEnable={!isMobile} tiltMaxAngleX={5} tiltMaxAngleY={5} perspective={1200} transitionSpeed={800} scale={1.01} glareMaxOpacity={0.08} glarePosition="all" className="rounded-xl sm:rounded-2xl">
              <Motion.div
                variants={slideIn}
                className="relative bg-slate-900/70 backdrop-blur-2xl border border-white/8 p-5 sm:p-7 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Card glow */}
                <div className="absolute top-0 right-0 w-52 h-52 bg-blue-600/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter">Command Deck</h2>
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
                      disabled={stocks.length === 0}
                      className="w-full bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/50 text-white text-sm font-bold rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 p-3.5 transition-all appearance-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                      {stocks.length === 0 ? (
                        <option value="">Waking up AI Backend... (Takes ~30s)</option>
                      ) : (
                        stocks.map(s => (
                          <option key={s.symbol} value={s.symbol} className="bg-slate-900">
                            {s.name} ({s.symbol})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Time horizon */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.18em]">Temporal Horizon</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/30">
                      {['1d', '3d', '1w'].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setTimeHorizon(h)}
                          className={`relative py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-md transition-all ${timeHorizon === h ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {timeHorizon === h && (
                            <Motion.span layoutId="horizon-tab" className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md -z-10" />
                          )}
                          <span className="relative z-10">{h === '1d' ? 'T+1' : h === '3d' ? 'T+3' : 'T+7'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <Motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading || stocks.length === 0}
                    className="w-full relative overflow-hidden py-4 text-xs sm:text-sm font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] border border-white/15 group"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {loading ? (
                      <Motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="relative z-10">
                        <Layers className="w-5 h-5" />
                      </Motion.span>
                    ) : (
                      <span className="relative z-10 flex items-center gap-2">
                        Initiate Sequence <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </span>
                    )}
                  </Motion.button>
                </form>
              </Motion.div>
            </Tilt>

            {/* Result telemetry card */}
            <AnimatePresence>
              {result && !loading && (
                <Motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                >
                  <Tilt tiltEnable={!isMobile} tiltMaxAngleX={4} tiltMaxAngleY={4} scale={1.01} className="rounded-2xl">
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
                          <span className={`font-black text-transparent bg-clip-text text-4xl tracking-tighter ${isGoodPrediction ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-red-400 to-orange-400'}`}>
                            {finalPrediction ? `${currencySymbol}${Number(finalPrediction.Predicted_Close).toFixed(2)}` : 'N/A'}
                          </span>
                        </div>
                        {finalPrediction && lastHistorical && (
                          <div className={`mt-4 p-4 rounded-xl border ${isGoodPrediction ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${isGoodPrediction ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isGoodPrediction ? '🚀 Good Time to Invest' : '⚠️ High Risk Expected'}
                            </h4>
                            <p className="text-xs text-slate-400 mb-3">
                              {isGoodPrediction ? 'Model projects an upward trajectory.' : 'Model projects a downward trajectory.'}
                            </p>
                            <a 
                              href={`https://finance.yahoo.com/quote/${result.symbol}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-block px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg transition-all ${isGoodPrediction ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}
                            >
                              View & Invest
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </Tilt>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column: Chart area */}
          <Motion.div variants={pop} className="xl:col-span-8 flex flex-col">
            <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/8 p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-2xl min-h-[380px] sm:min-h-[560px] flex flex-col overflow-hidden ring-1 ring-white/5 flex-1">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-700/8 rounded-full blur-3xl pointer-events-none" />

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-20 h-20 rounded-full border-2 border-t-blue-500 border-slate-700 mb-6"
                  />
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mb-2">Aggregating</h3>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Querying neural datasets...</p>
                </div>
              ) : result ? (
                <Motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    x: (!isGoodPrediction && finalPrediction) ? [-8, 8, -8, 8, 0] : 0
                  }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col h-full"
                >
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-5 gap-4">
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-1">
                        {result.symbol} <span className="text-slate-600 font-medium text-xl sm:text-2xl">INDEX</span>
                      </h2>
                      <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        T+{timeHorizon === '1d' ? '24 Hours' : timeHorizon === '3d' ? '72 Hours' : '168 Hours'} Trajectory
                      </p>
                    </div>
                    <div className="px-3 sm:px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Sync
                    </div>
                  </div>
                  <div className="flex-1 min-h-[320px] sm:min-h-[380px]">
                    <StockChart historical={result.historical} predictions={result.predictions} symbol={result.symbol} />
                  </div>
                </Motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center">
                  <Motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="mb-6"
                  >
                    <BarChart2 className="w-16 h-16 opacity-20" />
                  </Motion.div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-500 uppercase tracking-tighter mb-3">Awaiting Signal</h3>
                  <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
                    Select an instrument and initiate a prediction sequence to begin.
                  </p>
                </div>
              )}
            </div>
          </Motion.div>
        </Motion.div>

        {/* Feature highlight section */}
        <Motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0 } },
          }}
          className="mt-20 sm:mt-32 mb-16 sm:mb-20"
        >
          <Motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
            }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] mb-6">
              System Overview
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 uppercase tracking-tighter">
              The Engine.
            </h2>
          </Motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Cpu />, title: 'Forest AI', desc: 'Non-linear ensemble mapping powered by 100-tree Random Forest regression for robust price forecasting.', color: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/20' },
              { icon: <Activity />, title: 'Live Algos', desc: 'Real-time extraction of SMA, RSI, and MACD crossover signals sourced from Yahoo Finance data.', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
              { icon: <TrendingUp />, title: 'Trajectory', desc: 'Multi-day interpolated price projections with T+1, T+3, and T+7 forecast horizons.', color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-500/20' },
            ].map((f, i) => (
              <Tilt key={i} tiltEnable={!isMobile} tiltMaxAngleX={12} tiltMaxAngleY={12} scale={1.03} transitionSpeed={400} perspective={800} className="h-full">
                <Motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
                  }}
                  className="relative bg-slate-900/70 backdrop-blur-xl border border-white/6 p-6 sm:p-8 rounded-2xl h-full hover:border-white/15 transition-all shadow-lg sm:shadow-xl group overflow-hidden cursor-default"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className={`p-3.5 bg-gradient-to-br ${f.color} w-fit rounded-2xl mb-6 shadow-md sm:shadow-lg ${f.shadow} text-white group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-3">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </Motion.div>
              </Tilt>
            ))}
          </div>
        </Motion.div>
      </main>

    </div>
  );
}

export default Dashboard;
