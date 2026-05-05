// Supabase Edge Function — Admin API proxy
// Requires SUPABASE_SERVICE_ROLE_KEY set in project secrets
// Deploy: supabase functions deploy admin-api

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_EMAIL = 'shivachauhan98171@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create an anon-key client to verify the caller's JWT
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only the admin email can call this function
    if (user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin-level service role client
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ── GET /users ──────────────────────────────────────────────────────────
    if (req.method === 'GET' && action === 'users') {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 100 });
      if (error) throw error;
      return new Response(JSON.stringify({ users: data.users }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── GET /logs ───────────────────────────────────────────────────────────
    if (req.method === 'GET' && action === 'logs') {
      const limit = Number(url.searchParams.get('limit') || 50);
      const { data, error } = await admin
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return new Response(JSON.stringify({ logs: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── POST /flag (toggle feature flag) ────────────────────────────────────
    if (req.method === 'POST' && action === 'flag') {
      const { feature, enabled } = await req.json();
      const { error } = await admin
        .from('feature_flags')
        .upsert({ feature, enabled, updated_at: new Date().toISOString() });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── POST /log (record user activity) ────────────────────────────────────
    if (req.method === 'POST' && action === 'log') {
      const { action: userAction, metadata } = await req.json();
      const { error } = await admin
        .from('activity_logs')
        .insert({
          user_id:    user.id,
          user_email: user.email,
          action:     userAction,
          metadata:   metadata || null,
        });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── GET /stats ───────────────────────────────────────────────────────────
    if (req.method === 'GET' && action === 'stats') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [usersRes, loginsRes, predsRes] = await Promise.all([
        admin.auth.admin.listUsers({ perPage: 1 }),
        admin.from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .eq('action', 'auth:login')
          .gte('created_at', today.toISOString()),
        admin.from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .like('action', 'prediction:%')
          .gte('created_at', today.toISOString()),
      ]);

      return new Response(JSON.stringify({
        totalUsers:       usersRes.data?.total ?? 0,
        loginsToday:      loginsRes.count ?? 0,
        predictionsToday: predsRes.count ?? 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
