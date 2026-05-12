import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import Layout from './components/Layout';
import { FeatureFlagsProvider } from './context/FeatureFlags';

const ADMIN_EMAIL = 'shivachauhan98171@gmail.com';

// Lazy-load every page — each becomes its own JS chunk.
// React only parses + executes a page's code when you FIRST navigate to it.
// This eliminates the "mounting everything at once" freeze on nav tap.
const LoginPage  = lazy(() => import('./pages/LoginPage'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Terminals  = lazy(() => import('./pages/Terminals'));
const NeuralNet  = lazy(() => import('./pages/NeuralNet'));
const Markets       = lazy(() => import('./pages/Markets'));
const AdminConsole  = lazy(() => import('./pages/AdminConsole'));

// Minimal fallback shown while a lazy page chunk loads (first visit only)
function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="flex items-end gap-1.5" style={{ height: '36px' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="w-1.5 rounded-full bg-blue-500/60"
            style={{ height:'100%', transformOrigin:'bottom',
              animation:`eq-bar 1.1s ease-in-out ${(i*0.11).toFixed(2)}s infinite` }} />
        ))}
      </div>
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

  // Auto-logout after 5 minutes of inactivity
  useEffect(() => {
    if (!session) return;

    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Initialize activity time in localStorage
    localStorage.setItem('lastActivityTime', Date.now().toString());

    let lastStorageUpdate = 0;
    const updateActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to at most once per second
      // to prevent performance lag on continuous events like mousemove/scroll
      if (now - lastStorageUpdate > 1000) {
        localStorage.setItem('lastActivityTime', now.toString());
        lastStorageUpdate = now;
      }
    };

    // Listen for user interactions
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check periodically if inactivity limit has been reached
    const checkInactivityInterval = setInterval(async () => {
      const lastActivityTime = parseInt(localStorage.getItem('lastActivityTime') || Date.now().toString(), 10);
      if (Date.now() - lastActivityTime >= INACTIVITY_LIMIT) {
        console.log("User inactive for 5 minutes. Logging out automatically.");
        localStorage.removeItem('lastActivityTime'); // Cleanup
        await supabase.auth.signOut();
      }
    }, 10000); // check every 10 seconds

    return () => {
      clearInterval(checkInactivityInterval);
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [session]);

  if (session === undefined) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #020817, #050c1f)' }}>
      <div className="flex items-end gap-1.5" style={{ height: '36px' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="w-1.5 rounded-full bg-blue-500/60"
            style={{ height:'100%', transformOrigin:'bottom',
              animation:`eq-bar 1.1s ease-in-out ${(i*0.11).toFixed(2)}s infinite` }} />
        ))}
      </div>
    </div>
  );

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <FeatureFlagsProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          {session ? (
            <Routes>
              <Route element={<Layout user={session.user} isAdmin={isAdmin} />}>
                <Route path="/"            element={<Dashboard user={session.user} />} />
                <Route path="/terminals"   element={<Terminals />} />
                <Route path="/neural-net" element={<NeuralNet />} />
                <Route path="/markets"     element={<Markets />} />
                <Route path="/admin"       element={isAdmin ? <AdminConsole user={session.user} /> : <Navigate to="/" replace />} />
                <Route path="*"            element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          ) : (
            <Routes>
              <Route path="*" element={<LoginPage />} />
            </Routes>
          )}
        </Suspense>
      </Router>
    </FeatureFlagsProvider>
  );
}
