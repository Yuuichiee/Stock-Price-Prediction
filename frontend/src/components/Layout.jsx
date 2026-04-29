import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { supabase } from '../supabase';

function StarField() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999, vx: 0, vy: 0 });

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

      ctx.fillStyle = 'rgba(2, 8, 23, 0.18)';
      ctx.fillRect(0, 0, W, H);

      P.forEach(p => {
        const dx   = mx - p.x;
        const dy   = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < 180) {
          const strength = (180 - dist) / 180;
          p.vx += (mvx * 0.025 - dx * 0.0006) * strength;
          p.vy += (mvy * 0.025 - dy * 0.0006) * strength;
        }

        p.vx = p.vx * 0.96 + (Math.random() - 0.5) * 0.008;
        p.vy = p.vy * 0.96 + (Math.random() - 0.5) * 0.008;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;

        p.op += (Math.random() - 0.5) * 0.012;
        p.op  = Math.max(0.1, Math.min(0.85, p.op));

        const near   = Math.max(0, 1 - dist / 140);
        const radius = p.r + near * 2.2;

        const r = Math.round(148 + near * 107);
        const g = Math.round(163 + near * 92);
        const b = Math.round(184 + near * 71);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.op + near * 0.4})`;
        ctx.fill();
      });

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

export function FloatingOrb({ className, style }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

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

    const targetInterval = setInterval(() => {
      baseData.forEach((d, i) => {
        const delta = d.base * (Math.random() * 0.006 - 0.003);
        targets[i] = +(targets[i] + delta).toFixed(2);
      });
    }, 2500);

    let raf;
    let lastTick = 0;
    const TICK_INTERVAL = 1000 / 20;

    const tick = (timestamp) => {
      if (timestamp - lastTick >= TICK_INTERVAL) {
        lastTick = timestamp;
        baseData.forEach((d, i) => {
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

export default function Layout({ user }) {
  const spotlightRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background =
          `radial-gradient(500px circle at ${e.clientX}px ${e.clientY}px, rgba(59,130,246,0.08), transparent 50%)`;
      }
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <div className="min-h-screen text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden relative flex flex-col">
      <StarField />

      <FloatingOrb className="w-[500px] h-[500px] bg-blue-700/20" style={{ top: '-10%', left: '-10%' }} />
      <FloatingOrb className="w-[400px] h-[400px] bg-indigo-600/15" style={{ top: '30%', right: '-8%' }} />
      <FloatingOrb className="w-[300px] h-[300px] bg-emerald-600/10" style={{ bottom: '10%', left: '20%' }} />

      <div ref={spotlightRef} className="pointer-events-none fixed inset-0 z-0" />

      <LiveTicker />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
        className="sticky top-0 z-40 bg-[#050c1f]/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/">
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
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.18em]">
            {[
              { name: 'Terminals', path: '/terminals' },
              { name: 'Neural Net', path: '/neural-net' },
              { name: 'Markets', path: '/markets' },
            ].map((item) => (
              <Link key={item.name} to={item.path}>
                <motion.span
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ y: -1 }}
                >
                  {item.name}
                </motion.span>
              </Link>
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

      <div className="flex-1 relative z-10 w-full max-w-7xl mx-auto">
         <Outlet />
      </div>

      <footer className="border-t border-white/5 mt-8 py-8 relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-slate-600 text-xs font-mono tracking-widest">
          PREDICTIFI.AI © 2025 — NEURAL LATTICE v2.0 — ALL HORIZONS CLEARED
        </div>
      </footer>
    </div>
  );
}
