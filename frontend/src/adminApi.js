/**
 * adminApi.js
 * Thin wrapper around the Supabase Edge Function.
 * All calls are authenticated with the current user's JWT.
 */
import { supabase } from './supabase';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function callAdmin(method, action, body = null) {
  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  if (!jwt) throw new Error('Not authenticated');

  const res = await fetch(`${FUNCTION_URL}?action=${action}`, {
    method,
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Admin API error');
  }
  return res.json();
}

export const adminApi = {
  getUsers:  ()                        => callAdmin('GET',  'users'),
  getLogs:   (limit = 50)              => callAdmin('GET',  `logs&limit=${limit}`),
  getStats:  ()                        => callAdmin('GET',  'stats'),
  setFlag:   (feature, enabled)        => callAdmin('POST', 'flag',  { feature, enabled }),
  logAction: (action, metadata = null) => callAdmin('POST', 'log',   { action, metadata }),
};
