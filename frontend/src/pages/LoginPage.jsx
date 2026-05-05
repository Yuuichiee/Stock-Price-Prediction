import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Cpu } from 'lucide-react';
import Tilt from 'react-parallax-tilt';

function PuzzleBackground() {
  return (
    <div className="fixed inset-0 w-full min-h-[100dvh] overflow-hidden pointer-events-none -z-10 bg-[#020617]">
       {Array.from({ length: 30 }).map((_, i) => (
         <Motion.div
           key={i}
           className="absolute text-cyan-500/10 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
           style={{
             width: Math.random() * 60 + 30,
             height: Math.random() * 60 + 30,
             top: `${Math.random() * 100}%`,
             left: `${Math.random() * 100}%`,
           }}
           animate={{
             y: [0, Math.random() * 300 - 150, 0],
             x: [0, Math.random() * 300 - 150, 0],
             rotateZ: [0, 180, 360],
             rotateX: [0, 360],
             rotateY: [0, 360],
           }}
           transition={{
             duration: Math.random() * 30 + 20,
             repeat: Infinity,
             ease: 'linear'
           }}
         >
           <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              <path d="M25,25 h15 a10,10 0 0,1 20,0 h15 v15 a10,10 0 0,0 0,20 v15 h-15 a10,10 0 0,1 -20,0 h-15 v-15 a10,10 0 0,0 0,-20 z" />
           </svg>
         </Motion.div>
       ))}
    </div>
  );
}

function PuzzleEntrance() {
  // 5x6 grid of digital blocks flying in to form the card
  return (
    <Motion.div 
      className="absolute inset-0 z-50 grid grid-cols-5 grid-rows-6 gap-0.5 p-1 bg-transparent rounded-2xl overflow-hidden pointer-events-none"
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <Motion.div
           key={i}
           className="bg-slate-800 border border-cyan-500/30 rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.5)]"
           initial={{ 
             opacity: 0, 
             x: (Math.random() - 0.5) * 1500, 
             y: (Math.random() - 0.5) * 1500, 
             rotateZ: (Math.random() - 0.5) * 360,
             rotateX: (Math.random() - 0.5) * 360,
             scale: 0.1
           }}
           animate={{ opacity: 1, x: 0, y: 0, rotateZ: 0, rotateX: 0, scale: 1 }}
           transition={{ 
             type: "spring", 
             damping: 12, 
             stiffness: 80, 
             delay: Math.random() * 1.5 // Random stagger up to 1.5s
           }}
        />
      ))}
    </Motion.div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile] = useState(() => window.innerWidth < 768);
  
  const [isAssembled, setIsAssembled] = useState(false);

  useEffect(() => {
    // Wait 2.8 seconds for the puzzle pieces to fly in and assemble before revealing card
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

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

  // Form elements fly in after the puzzle is assembled
  const formVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center relative overflow-hidden text-white font-sans px-4 py-6 sm:py-8" style={{ perspective: '1200px' }}>
      <PuzzleBackground />

      <div className="relative w-full max-w-md z-10">
        <Tilt tiltEnable={!isMobile} glareEnable={!isMobile} tiltMaxAngleX={8} tiltMaxAngleY={8} transitionSpeed={1000} scale={1.02} glareMaxOpacity={0.15} glarePosition="all" className="rounded-2xl relative">
          
          <AnimatePresence>
            {!isAssembled && <PuzzleEntrance key="puzzle-entrance" />}
          </AnimatePresence>

          <Motion.div 
            className="relative bg-slate-900/60 backdrop-blur-2xl border-t border-l border-white/20 border-b border-r border-black/40 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden min-h-[500px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: isAssembled ? 1 : 0 }}
            transition={{ duration: 1 }}
          >
            {/* Top scanning laser effect */}
            <Motion.div 
              className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              animate={{ opacity: [0, 1, 0], x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {isAssembled && (
              <Motion.div variants={formVariants} initial="hidden" animate="visible" className="p-6 sm:p-8">
                {/* Header Logo */}
                <Motion.div variants={itemVariants} className="flex items-center justify-center flex-col gap-4 mb-8">
                  <Motion.div 
                    className="relative p-4 bg-slate-950/80 border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                    whileHover={{ scale: 1.05, rotateZ: 5 }}
                  >
                    <Cpu className="w-8 h-8 text-cyan-400" />
                  </Motion.div>
                  <span className="text-2xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                    PREDICTIFI<span className="text-cyan-400">.AI</span>
                  </span>
                </Motion.div>

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

                  <Motion.div variants={itemVariants}>
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
                  </Motion.div>

                  <Motion.div variants={itemVariants}>
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
                  </Motion.div>

                  <Motion.button
                    variants={itemVariants}
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
                <Motion.div variants={itemVariants} className="mt-8 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-[11px] uppercase tracking-widest text-slate-500">
                    {mode === 'login' ? "Require authorization?" : 'Already authorized?'}
                  </span>
                  <button
                    onClick={toggleMode}
                    className="text-cyan-400 text-xs font-black uppercase tracking-[0.15em] hover:text-cyan-300 hover:scale-105 transition-all"
                  >
                    {mode === 'login' ? 'Request Neural Link' : 'Proceed to Login'}
                  </button>
                </Motion.div>

              </Motion.div>
            )}
          </Motion.div>
        </Tilt>
      </div>
    </div>
  );
}
