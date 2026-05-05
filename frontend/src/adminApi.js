/**
 * adminApi.js
 * No Edge Function needed! 
 * Uses direct Supabase RPC and RLS policies for a zero-config setup.
 */
import { supabase } from './supabase';

export const adminApi = {

  /** All user profiles — uses a secure Postgres function (RPC) */
  async getUsers() {
    const { data, error } = await supabase.rpc('get_all_users');
    if (error) throw error;
    return { users: data || [] };
  },

  /** Activity log — admin RLS allows SELECT */
  async getLogs(limit = 60) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { logs: data || [] };
  },

  /** KPI stats */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [usersRes, loginsRes, predsRes] = await Promise.all([
      supabase.rpc('get_user_count'),
      supabase.from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'auth:login')
        .gte('created_at', todayStr),
      supabase.from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .like('action', 'prediction:%')
        .gte('created_at', todayStr),
    ]);

    return {
      totalUsers:       usersRes.data   || 0,
      loginsToday:      loginsRes.count || 0,
      predictionsToday: predsRes.count  || 0,
    };
  },

  /** Toggle a feature flag — admin RLS update policy allows this */
  async setFlag(feature, enabled) {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('feature', feature);
    if (error) throw error;
    return { ok: true };
  },

  /** Insert activity log row — any authenticated user can insert their own */
  async logAction(action, metadata = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('activity_logs').insert({
      user_id:    user.id,
      user_email: user.email,
      action,
      metadata:   metadata || null,
    });
  },
};
