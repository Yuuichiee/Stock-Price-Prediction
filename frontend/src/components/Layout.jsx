import React, { useEffect, useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Activity, LogOut, Menu, X } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

// Detect mobile once at module level (no re-renders)
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

function StarField() {
  const canvasRef = useRef(null);
  // On mobile we skip mouse interaction entirely
  const mouseRef = useRef({ x: -9999, y: -9999, vx: 0, vy: 0 });

  useEffect(() => {
    if (IS_MOBILE) return; // no mousemove on touch devices
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

    // Throttle to 30fps on mobile — halves canvas JS work, gives React room to breathe
    const TARGET_FPS    = IS_MOBILE ? 30 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    let lastFrame = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Fewer particles on mobile
    const N = IS_MOBILE ? 35 : 90;
    const P = Array.from({ length: N }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r:  Math.random() * 1.3 + 0.2,
      op: Math.random() * 0.5 + 0.25,
    }));

    const draw = (timestamp) => {
      // Skip frame if we haven't hit our target interval
      if (timestamp - lastFrame < FRAME_INTERVAL) {
        animId = requestAnimationFrame(draw);
        return;
      }
      lastFrame = timestamp;

      const W = canvas.width, H = canvas.height;
      const { x: mx, y: my, vx: mvx, vy: mvy } = mouseRef.current;

      ctx.fillStyle = 'rgba(2, 8, 23, 0.18)';
      ctx.fillRect(0, 0, W, H);

      for (let idx = 0; idx < N; idx++) {
        const p = P[idx];
        const dx   = mx - p.x;
        const dy   = my - p.y;
        let near = 0;
        if (!IS_MOBILE && mx > 0) {
          const distSq = dx * dx + dy * dy;
          if (distSq < 180 * 180) {
            const dist = Math.sqrt(distSq) || 1;
            const strength = (180 - dist) / 180;
            p.vx += (mvx * 0.025 - dx * 0.0006) * strength;
            p.vy += (mvy * 0.025 - dy * 0.0006) * strength;
            near = Math.max(0, 1 - dist / 140);
          }
        }

        p.vx = p.vx * 0.96 + (Math.random() - 0.5) * 0.008;
        p.vy = p.vy * 0.96 + (Math.random() - 0.5) * 0.008;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;

        p.op += (Math.random() - 0.5) * 0.012;
        p.op  = Math.max(0.1, Math.min(0.85, p.op));

        const radius = p.r + near * 2.2;
        const r = Math.round(148 + near * 107);
        const g = Math.round(163 + near * 92);
        const b = Math.round(184 + near * 71);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.op + near * 0.4})`;
        ctx.fill();
      }

      if (!IS_MOBILE && mx > 0) {
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
      style={{
        background: 'linear-gradient(135deg, #020817 0%, #050c1f 50%, #030a18 100%)',
        willChange: 'transform',
      }}
    />
  );
}

// Pure CSS animation — zero JS overhead vs Framer Motion loop
export function FloatingOrb({ className, style }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none animate-orb ${className}`}
      style={style}
    />
  );
}

const TICKER_COPIES = 4;
const TICKER_DATA = [
  { sym: 'S&P 500',   base: 5023.14  },
  { sym: 'NASDAQ',    base: 15990.11 },
  { sym: 'DOW JONES', base: 38671.69 },
  { sym: 'VIX',       base: 13.41    },
  { sym: 'BITCOIN',   base: 51432.00 },
  { sym: 'GOLD',      base: 2024.10  },
];

// Animated anime-style AI logo — glowing core, orbiting nodes, rotating rings
function PredictifiLogo() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: '-4px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
        animation: 'logo-glow 2.5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <svg viewBox="0 0 32 32" width="32" height="32" style={{ position: 'relative', zIndex: 1 }}>
        {/* Outer dashed ring — rotates CW */}
        <circle cx="16" cy="16" r="14.5" fill="none"
          stroke="rgba(99,102,241,0.6)" strokeWidth="0.8" strokeDasharray="2.5 2"
          style={{ animation: 'logo-rotate 10s linear infinite', transformOrigin: '16px 16px' }} />
        {/* Static middle ring */}
        <circle cx="16" cy="16" r="10.5" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="0.6" />
        {/* Hexagon — counter-rotates */}
        <polygon points="16,5 23.5,9.5 23.5,18.5 16,23 8.5,18.5 8.5,9.5"
          fill="rgba(59,130,246,0.07)" stroke="rgba(96,165,250,0.65)" strokeWidth="0.9"
          style={{ animation: 'logo-rotate-r 18s linear infinite', transformOrigin: '16px 16px' }} />
        {/* Crosshair lines */}
        <line x1="16" y1="6" x2="16" y2="12" stroke="rgba(147,197,253,0.5)" strokeWidth="0.7" />
        <line x1="16" y1="20" x2="16" y2="26" stroke="rgba(147,197,253,0.5)" strokeWidth="0.7" />
        <line x1="6" y1="16" x2="12" y2="16" stroke="rgba(147,197,253,0.5)" strokeWidth="0.7" />
        <line x1="20" y1="16" x2="26" y2="16" stroke="rgba(147,197,253,0.5)" strokeWidth="0.7" />
        {/* Orbiting node 1 — blue, fast */}
        <circle cx="16" cy="3.5" r="1.6" fill="#60a5fa"
          style={{ animation: 'logo-rotate 4s linear infinite', transformOrigin: '16px 16px',
            filter: 'drop-shadow(0 0 3px #60a5fa)' }} />
        {/* Orbiting node 2 — teal, slow reverse */}
        <circle cx="28" cy="22" r="1.2" fill="#34d399"
          style={{ animation: 'logo-rotate-r 7s linear infinite', transformOrigin: '16px 16px',
            filter: 'drop-shadow(0 0 2px #34d399)' }} />
        {/* Orbiting node 3 — indigo */}
        <circle cx="4" cy="22" r="1.1" fill="#818cf8"
          style={{ animation: 'logo-rotate 5.5s linear infinite', transformOrigin: '16px 16px' }} />
        {/* Glowing core */}
        <circle cx="16" cy="16" r="4" fill="url(#predCore)"
          style={{ animation: 'logo-core-pulse 2s ease-in-out infinite',
            transformBox: 'fill-box', transformOrigin: 'center' }} />
        {/* Center dot */}
        <circle cx="16" cy="16" r="1.4" fill="white" opacity="0.95" />
        <defs>
          <radialGradient id="predCore" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="55%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}


const NAV_ITEMS = [
  { name: 'Terminals', path: '/terminals',  prefetch: () => import('../pages/Terminals')  },
  { name: 'Neural Net', path: '/neural-net', prefetch: () => import('../pages/NeuralNet')  },
  { name: 'Markets',   path: '/markets',    prefetch: () => import('../pages/Markets')    },
];

function LiveTicker() {

  const valRefs    = useRef([]);
  const changeRefs = useRef([]);

  useEffect(() => {
    const current = TICKER_DATA.map(d => d.base);
    const targets  = TICKER_DATA.map(d => d.base);

    const targetInterval = setInterval(() => {
      TICKER_DATA.forEach((d, i) => {
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
        TICKER_DATA.forEach((d, i) => {
          current[i] += (targets[i] - current[i]) * 0.18;

          const formatted = current[i].toLocaleString('en-US', {
            minimumFractionDigits: 2, maximumFractionDigits: 2,
          });
          const changePct = ((current[i] - d.base) / d.base) * 100;
          const changeStr = (changePct >= 0 ? '+' : '') + changePct.toFixed(2) + '%';
          const cls = changePct >= 0
            ? 'text-emerald-400 tabular-nums'
            : 'text-red-400 tabular-nums';

          for (let copy = 0; copy < TICKER_COPIES; copy++) {
            const idx = copy * TICKER_DATA.length + i;
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
          {[...Array(TICKER_COPIES)].map((_, ai) =>
            TICKER_DATA.map((d, i) => {
              const refIdx = ai * TICKER_DATA.length + i;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (IS_MOBILE) return; // no spotlight on touch devices
    let rafPending = false;
    const handle = (e) => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        if (spotlightRef.current) {
          spotlightRef.current.style.background =
            `radial-gradient(500px circle at ${e.clientX}px ${e.clientY}px, rgba(59,130,246,0.08), transparent 50%)`;
        }
        rafPending = false;
      });
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <div className="min-h-screen text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden relative flex flex-col">
      <StarField />

      {/* FloatingOrbs hidden on mobile — large blur-3xl GPU layers cause paint spikes during navigation */}
      {!IS_MOBILE && <FloatingOrb className="w-[500px] h-[500px] bg-blue-700/20" style={{ top: '-10%', left: '-10%' }} />}
      {!IS_MOBILE && <FloatingOrb className="w-[400px] h-[400px] bg-indigo-600/15" style={{ top: '30%', right: '-8%' }} />}
      {!IS_MOBILE && <FloatingOrb className="w-[300px] h-[300px] bg-emerald-600/10" style={{ bottom: '10%', left: '20%' }} />}

      <div ref={spotlightRef} className="pointer-events-none fixed inset-0 z-0" />

      <LiveTicker />

      <Motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
        className="sticky top-0 z-40 bg-[#050c1f]/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-30 group-hover:opacity-70 transition-opacity rounded-xl" />
                <div className="relative p-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg">
                  <PredictifiLogo />
                </div>
              </div>
              <span className="text-base sm:text-xl font-black tracking-tighter text-white whitespace-nowrap">
                PREDICTIFI<span className="text-blue-500">.AI</span>
              </span>
            </Motion.div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.18em]">
            {NAV_ITEMS.map((item) => (
              <Link key={item.name} to={item.path} onMouseEnter={item.prefetch}>
                <Motion.span
                  className="hover:text-white transition-colors cursor-pointer"
                  whileHover={{ y: -1 }}
                >
                  {item.name}
                </Motion.span>
              </Link>
            ))}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs text-slate-300 font-mono max-w-[120px] truncate">{user?.email}</span>
              </div>
              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-bold tracking-wider transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </Motion.button>
            </div>
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(open => !open)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900/70 text-slate-200"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <Motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="md:hidden border-t border-white/5 bg-[#050c1f]"
            >
              <div className="px-4 py-4 space-y-2.5 relative z-50">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onTouchStart={item.prefetch}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg border border-white/8 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-slate-900/70 px-4 py-3">
                  <span className="min-w-0 truncate text-xs font-mono text-slate-300">{user?.email}</span>
                  <button
                    type="button"
                    onClick={() => supabase.auth.signOut()}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.header>

      {/* Backdrop rendered OUTSIDE the header to avoid stacking context conflicts.
          backdrop-blur intentionally removed — it was blurring the open menu itself. */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <Motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-30 bg-black/60 pointer-events-auto"
            style={{ top: '0' }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Signal Wipe ───────────────────────────────────────────────────────
           Two gradient bars sweep left→right on sub-route navigation.
           Each has a glowing leading edge — like a holographic scanner cut.
           Dashboard (/) is always untouched. */}
      {location.pathname !== '/' && [
        {
          bg: 'linear-gradient(160deg, #4f46e5 0%, #7c3aed 100%)',
          shadow: '6px 0 32px rgba(124,58,237,0.9), 12px 0 60px rgba(99,102,241,0.5)',
          delay: 0,
          z: 62,
        },
        {
          bg: 'linear-gradient(160deg, #1d4ed8 0%, #0ea5e9 100%)',
          shadow: '6px 0 24px rgba(14,165,233,0.8), 12px 0 48px rgba(59,130,246,0.4)',
          delay: 0.07,
          z: 61,
        },
      ].map(({ bg, shadow, delay, z }, i) => (
        <Motion.div
          key={`wipe-${i}-${location.pathname}`}
          initial={{ x: '-100%' }}
          animate={{ x: [null, '0%', '102%'] }}
          transition={{ duration: 0.44, delay, times: [0, 0.38, 1], ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0,
            background: bg,
            boxShadow: shadow,
            zIndex: z,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Page content — fades in at 300ms (as wipe bars are sweeping off-screen right) */}
      <AnimatePresence mode="sync" initial={false}>
        <Motion.div
          key={location.pathname}
          initial={location.pathname !== '/' ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={location.pathname !== '/'
            ? { duration: 0.2, delay: 0.3, ease: 'easeOut' }
            : { duration: 0 }
          }
          className="flex-1 relative z-10 w-full max-w-7xl mx-auto"
        >
          <Outlet />
        </Motion.div>
      </AnimatePresence>


      <footer className="border-t border-white/5 mt-8 py-8 relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-slate-500 text-[10px] sm:text-xs font-mono tracking-[0.1em] sm:tracking-widest flex flex-col sm:block gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <span>PREDICTIFI.AI © 2025 — </span>
          <span className="text-slate-600">NEURAL LATTICE v2.0 — ALL HORIZONS CLEARED</span>
        </div>
      </footer>
    </div>
  );
}
