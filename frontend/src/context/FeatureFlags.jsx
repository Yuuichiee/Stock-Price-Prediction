import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

// Default: everything is ON while flags are loading (prevents flash of missing UI)
const DEFAULTS = {
  markets:     true,
  neural_net:  true,
  terminals:   true,
  predictions: true,
};

const FeatureFlagsContext = createContext(DEFAULTS);

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState(DEFAULTS);

  useEffect(() => {
    // Fetch current flags — gracefully no-ops if table doesn't exist yet
    supabase
      .from('feature_flags')
      .select('feature, enabled')
      .then(({ data, error }) => {
        if (error || !data) return; // table missing → keep defaults (all enabled)
        const map = {};
        data.forEach(row => { map[row.feature] = row.enabled; });
        setFlags(prev => ({ ...prev, ...map }));
      })
      .catch(() => { /* silently keep defaults */ });

    // Real-time subscription — admin toggling a flag updates all live clients instantly
    const channel = supabase
      .channel('feature_flags_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        payload => {
          if (payload.new) {
            setFlags(prev => ({
              ...prev,
              [payload.new.feature]: payload.new.enabled,
            }));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/** Returns true/false for a given feature. Defaults to true if flag not found. */
export function useFeatureFlag(feature) {
  const flags = useContext(FeatureFlagsContext);
  return flags[feature] ?? true;
}

export default FeatureFlagsContext;
