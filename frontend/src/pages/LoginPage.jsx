import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { Globe, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Zap, TrendingUp, Github } from 'lucide-react';

const seededRandom = (seed) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

const LOGIN_STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  size: seededRandom(i + 1) * 2 + 0.5,
  top: seededRandom(i + 101) * 100,
  left: seededRandom(i + 201) * 100,
  opacity: seededRandom(i + 301) * 0.6 + 0.1,
  duration: seededRandom(i + 401) * 4 + 3,
  delay: seededRandom(i + 501) * 4,
}));

function StarField() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: 'linear-gradient(135deg, #020817 0%, #050c1f 50%, #030a18 100%)' }}>
      {LOGIN_STARS.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}%`,
            left: `${star.left}%`,
            opacity: star.opacity,
            animation: `pulse ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
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
        setSuccess('Account created! Check your email to confirm, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state change in App.jsx will navigate automatically
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: window.location.origin // Redirects back to the app after Google/GitHub login
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || `Failed to login with ${provider}`);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden text-white font-sans px-4 py-6 sm:py-8" style={{ perspective: '1000px' }}>
      <StarField />

      {/* Floating 3D Trading Icon */}
      <Motion.div
        className="absolute text-blue-500/10 pointer-events-none"
        animate={{
          y: [0, -50, 0],
          rotateY: [0, 360],
          rotateX: [0, 45, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '15%', right: '10%' }}
      >
        <TrendingUp className="w-48 h-48 sm:w-64 sm:h-64" />
      </Motion.div>

      {/* Glow blobs */}
      <Motion.div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-blue-700/20 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '-10%', left: '-10%' }}
      />
      <Motion.div
        className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ bottom: '-5%', right: '-5%' }}
      />

      <Motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/8 rounded-xl sm:rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

          <div className="p-4 sm:p-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-40 rounded-xl" />
                <div className="relative p-2 bg-slate-800 border border-slate-700/60 rounded-xl">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tighter whitespace-nowrap">
                PREDICTIFI<span className="text-blue-500">.AI</span>
              </span>
            </div>

            {/* Title */}
            <AnimatePresence mode="wait">
              <Motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                transition={{ duration: 0.25 }}
                className="mb-6 sm:mb-7"
              >
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter mb-1">
                  {mode === 'login' ? 'Login Required' : 'Signup to proceed further'}
                </h1>
                <p className="text-slate-400 text-sm">
                  {mode === 'login'
                    ? 'Sign in to access your prediction terminal'
                    : 'Join the neural prediction network'}
                </p>
              </Motion.div>
            </AnimatePresence>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <Motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </Motion.div>
              )}
              {success && (
                <Motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm"
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
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required={mode === 'signup'}
                        placeholder="John Doe"
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-10 pr-12 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-[0.12em] sm:tracking-[0.18em] rounded-lg transition-all shadow-md sm:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] border border-white/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Motion.button>
            </form>

            {/* OAuth Dividers & Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {/* Google SVG Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Motion.button>

              <Motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 border border-white/10"
              >
                <Github className="w-4 h-4" />
                GitHub
              </Motion.button>
            </div>

            {/* Toggle */}
            <div className="mt-6 sm:mt-8 text-center text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-1">
              <span>{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}</span>
              <button
                onClick={toggleMode}
                className="text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            {/* Badge */}
            <div className="mt-5 sm:mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-500 uppercase tracking-widest text-center">
              <Zap className="w-3 h-3 text-slate-600" />
              Secured by Supabase Auth
            </div>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}
