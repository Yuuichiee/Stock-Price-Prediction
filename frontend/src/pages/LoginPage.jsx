import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Cpu } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

function LiveBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
       {/* Animated RGB Conic Gradient Core */}
       <Motion.div 
         className="absolute top-1/2 left-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] -mt-[300px] -ml-[300px] sm:-mt-[450px] sm:-ml-[450px] opacity-40 blur-[100px] rounded-full"
         style={{ background: 'conic-gradient(from 0deg, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #10b981, #06b6d4)' }}
         animate={{ rotate: 360 }}
         transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
       />
       
       {/* Floating Data Nodes */}
       {Array.from({ length: 20 }).map((_, i) => (
         <Motion.div
           key={i}
           className="absolute border border-white/5 bg-white/5 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)]"
           style={{
             width: Math.random() * 80 + 20,
             height: Math.random() * 80 + 20,
             top: `${Math.random() * 100}%`,
             left: `${Math.random() * 100}%`,
             borderRadius: Math.random() > 0.5 ? '50%' : '16px'
           }}
           animate={{
             y: [0, Math.random() * 150 - 75, 0],
             x: [0, Math.random() * 150 - 75, 0],
             rotateX: [0, 180, 360],
             rotateY: [0, 180, 360],
             scale: [1, 1.5, 1],
           }}
           transition={{
             duration: Math.random() * 15 + 15,
             repeat: Infinity,
             ease: 'easeInOut'
           }}
         />
       ))}
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile] = useState(() => window.innerWidth < 768);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setSuccess('Neural link created! Check your email to confirm the sequence.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  const unfoldTransition = {
    hidden: { opacity: 0, rotateX: 80, scale: 0.8, y: 100 },
    visible: { 
      opacity: 1, 
      rotateX: 0, 
      scale: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 80, damping: 20, delay: 0.2 } 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-white font-sans px-4 py-6 sm:py-8" style={{ perspective: '1200px' }}>
      <LiveBackground />

      <Motion.div
        initial="hidden"
        animate="visible"
        variants={unfoldTransition}
        className="relative w-full max-w-md z-10"
      >
        <Tilt tiltEnable={!isMobile} glareEnable={!isMobile} tiltMaxAngleX={8} tiltMaxAngleY={8} transitionSpeed={1000} scale={1.02} glareMaxOpacity={0.15} glarePosition="all" className="rounded-2xl">
          <div className="relative bg-slate-900/60 backdrop-blur-2xl border-t border-l border-white/20 border-b border-r border-black/40 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
            {/* Top scanning laser effect */}
            <Motion.div 
              className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              animate={{ opacity: [0, 1, 0], x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="p-6 sm:p-8">
              {/* Header Logo */}
              <div className="flex items-center justify-center flex-col gap-4 mb-8">
                <Motion.div 
                  className="relative p-4 bg-slate-950/80 border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                  whileHover={{ scale: 1.05, rotateZ: 5 }}
                >
                  <Cpu className="w-8 h-8 text-cyan-400" />
                </Motion.div>
                <span className="text-2xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  PREDICTIFI<span className="text-cyan-400">.AI</span>
                </span>
              </div>

              {/* Title & Copy */}
              <AnimatePresence mode="wait">
                <Motion.div
                  key={mode}
                  initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, filter: 'blur(10px)', y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-[0.2em]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Network Status: Online
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tighter mb-2 text-white">
                    {mode === 'login' ? 'Authentication Required' : 'Initialize New Link'}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm px-4 leading-relaxed">
                    {mode === 'login'
                      ? 'Establish a secure connection to the live predictive engine.'
                      : 'Register your signature to access the neural network.'}
                  </p>
                </Motion.div>
              </AnimatePresence>

              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <Motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="mb-6 flex items-start gap-3 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm font-medium"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </Motion.div>
                )}
                {success && (
                  <Motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="mb-6 flex items-start gap-3 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs sm:text-sm font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{success}</span>
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {mode === 'signup' && (
                    <Motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1.5 ml-1">Operator Alias</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required={mode === 'signup'}
                          placeholder="John Doe"
                          className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                        />
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1.5 ml-1">Secure Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="operator@domain.com"
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1.5 ml-1">Decryption Key (Password)</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Min. 6 characters"
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-white/20 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      {mode === 'login' ? 'Authenticate & Connect' : 'Register Signature'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Motion.button>
              </form>

              {/* Toggle Mode */}
              <div className="mt-8 text-center flex flex-col items-center justify-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-slate-500">
                  {mode === 'login' ? "Require authorization?" : 'Already authorized?'}
                </span>
                <button
                  onClick={toggleMode}
                  className="text-cyan-400 text-xs font-black uppercase tracking-[0.15em] hover:text-cyan-300 hover:scale-105 transition-all"
                >
                  {mode === 'login' ? 'Request Neural Link' : 'Proceed to Login'}
                </button>
              </div>

            </div>
          </div>
        </Tilt>
      </Motion.div>
    </div>
  );
}
