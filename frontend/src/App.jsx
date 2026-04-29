import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Terminals from './pages/Terminals';
import NeuralNet from './pages/NeuralNet';
import Markets from './pages/Markets';
import { motion as Motion, AnimatePresence } from 'framer-motion';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #020817, #050c1f)' }}>
      <Motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 rounded-full border-2 border-t-blue-500 border-slate-700"
      />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((err) => {
        console.error("Supabase auth error:", err);
        setSession(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return <LoadingScreen />;

  return (
    <Router>
      <AnimatePresence mode="wait">
        {session ? (
          <Routes key="authenticated">
            <Route element={<Layout user={session.user} />}>
              <Route path="/" element={
                <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Dashboard user={session.user} />
                </Motion.div>
              } />
              <Route path="/terminals" element={<Terminals />} />
              <Route path="/neural-net" element={<NeuralNet />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        ) : (
          <Routes key="unauthenticated">
            <Route path="*" element={
              <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoginPage />
              </Motion.div>
            } />
          </Routes>
        )}
      </AnimatePresence>
    </Router>
  );
}
