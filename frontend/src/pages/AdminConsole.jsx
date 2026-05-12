import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, ToggleLeft, ToggleRight, BarChart2, RefreshCw, Shield, Clock, Zap, TrendingUp, Terminal, Globe, Cpu } from 'lucide-react';
import { adminApi } from '../adminApi';

const ADMIN_EMAIL = 'shivachauhan98171@gmail.com';

const FEATURES = [
  { key: 'predictions', label: 'Predictions Engine', icon: <Zap className="w-4 h-4" />, color: 'from-yellow-500 to-orange-500' },
  { key: 'markets',     label: 'Markets Page',       icon: <TrendingUp className="w-4 h-4" />, color: 'from-emerald-500 to-teal-500' },
  { key: 'neural_net',  label: 'Neural Net Page',    icon: <Cpu className="w-4 h-4" />, color: 'from-purple-500 to-indigo-500' },
  { key: 'terminals',   label: 'Terminals Page',     icon: <Terminal className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
];

function StatCard({ icon, label, value, color, loading }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-slate-900 border border-white/8 rounded-xl p-5 overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 blur-2xl pointer-events-none`} />
      <div className={`p-2.5 bg-gradient-to-br ${color} w-fit rounded-lg mb-3 text-white shadow-lg`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-white tabular-nums">{value ?? '—'}</p>
      )}
    </Motion.div>
  );
}

function ActionBadge({ action }) {
  if (action?.startsWith('prediction:')) return (
    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Prediction</span>
  );
  if (action?.startsWith('page:')) return (
    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">Page View</span>
  );
  if (action === 'auth:login') return (
    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">Login</span>
  );
  return (
    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-slate-700/50 text-slate-400 border border-slate-700">{action}</span>
  );
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminConsole({ user }) {
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [flags, setFlags] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [togglingFlag, setTogglingFlag] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const logPollRef = useRef(null);



  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoadingUsers(false); }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await adminApi.getLogs(60);
      setLogs(data.logs || []);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoadingLogs(false); }
  }, []);

  const fetchFlags = useCallback(async () => {
    // Read directly from Supabase (public read policy)
    const { supabase } = await import('../supabase');
    const { data } = await supabase.from('feature_flags').select('feature, enabled');
    if (data) {
      const map = {};
      data.forEach(r => { map[r.feature] = r.enabled; });
      setFlags(map);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchLogs();
    fetchFlags();
    // Auto-refresh logs every 8 seconds
    logPollRef.current = setInterval(fetchLogs, 8000);
    return () => clearInterval(logPollRef.current);
  }, [fetchStats, fetchUsers, fetchLogs, fetchFlags]);

  // Guard — redirect non-admins (this is also enforced server-side in the Edge Function)
  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500/40 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">Access Denied</h2>
          <p className="text-slate-600 text-sm mt-2">This area is restricted to administrators.</p>
        </div>
      </div>
    );
  }

  const toggleFlag = async (feature) => {
    const newVal = !flags[feature];
    setTogglingFlag(feature);
    setFlags(prev => ({ ...prev, [feature]: newVal })); // optimistic
    try {
      await adminApi.setFlag(feature, newVal);
    } catch (e) {
      setFlags(prev => ({ ...prev, [feature]: !newVal })); // revert
      console.error(e);
    } finally {
      setTogglingFlag(null);
    }
  };

  const TABS = [
    { id: 'overview',  label: 'Overview',      icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'users',     label: 'Users',          icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'logs',      label: 'Activity Log',   icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'flags',     label: 'Feature Flags',  icon: <ToggleRight className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <Motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl shadow-lg shadow-red-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">
              Admin Console
            </h1>
            <p className="text-slate-500 text-xs font-mono mt-0.5">{ADMIN_EMAIL}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </Motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900/60 border border-white/6 p-1.5 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
              tab === t.id
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <Motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Users className="w-4 h-4" />}     label="Total Users"        value={stats?.totalUsers}       color="from-blue-500 to-indigo-500"  loading={loadingStats} />
              <StatCard icon={<Shield className="w-4 h-4" />}    label="Logins Today"       value={stats?.loginsToday}      color="from-purple-500 to-pink-500"  loading={loadingStats} />
              <StatCard icon={<Zap className="w-4 h-4" />}       label="Predictions Today"  value={stats?.predictionsToday} color="from-emerald-500 to-teal-500" loading={loadingStats} />
              <StatCard icon={<Activity className="w-4 h-4" />}  label="Active Features"    value={Object.values(flags).filter(Boolean).length + '/4'} color="from-orange-500 to-red-500" loading={false} />
            </div>

            {/* Recent log preview */}
            <div className="bg-slate-900 border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-black text-white uppercase tracking-tighter">Recent Activity</h2>
                <button onClick={fetchLogs} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                {logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/2 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[9px] font-black text-white shrink-0">
                      {log.user_email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-slate-300 truncate">{log.user_email}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{log.action}</p>
                    </div>
                    <ActionBadge action={log.action} />
                    <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(log.created_at)}</span>
                  </div>
                ))}
                {!loadingLogs && logs.length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-600 text-xs">No activity yet</div>
                )}
              </div>
            </div>
          </Motion.div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <Motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-slate-900 border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-black text-white uppercase tracking-tighter">
                  All Users <span className="text-slate-500 font-mono ml-2">({users.length})</span>
                </h2>
                <button onClick={fetchUsers} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {loadingUsers ? (
                <div className="p-8 text-center text-slate-500 text-xs">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-widest">
                        <th className="text-left px-5 py-3 font-black">User</th>
                        <th className="text-left px-5 py-3 font-black hidden sm:table-cell">Joined</th>
                        <th className="text-left px-5 py-3 font-black">Last Sign In</th>
                        <th className="text-left px-5 py-3 font-black hidden md:table-cell">Provider</th>
                        <th className="text-left px-5 py-3 font-black hidden md:table-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/4">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                {u.email?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-white">{u.email}</p>
                                <p className="text-slate-600 text-[10px] font-mono">{u.id?.slice(0, 8)}…</p>
                              </div>
                              {u.email === ADMIN_EMAIL && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-red-500/20 text-red-400 border border-red-500/30">Admin</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 hidden sm:table-cell">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-3.5 text-slate-400">{u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : 'Never'}</td>
                          <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell capitalize">{u.app_metadata?.provider || 'email'}</td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            {u.confirmed_at ? (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Verified</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="py-12 text-center text-slate-600 text-xs">No users found</div>
                  )}
                </div>
              )}
            </div>
          </Motion.div>
        )}

        {/* ── ACTIVITY LOG ── */}
        {tab === 'logs' && (
          <Motion.div key="logs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-slate-900 border border-white/8 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tighter">Activity Log</h2>
                  {lastRefresh && <p className="text-[10px] text-slate-600 mt-0.5 font-mono">Auto-refreshes · last: {lastRefresh.toLocaleTimeString()}</p>}
                </div>
                <button onClick={fetchLogs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                  <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
              <div className="divide-y divide-white/4 max-h-[560px] overflow-y-auto">
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <Motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/2 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5">
                        {log.user_email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-300 truncate">{log.user_email}</span>
                          <ActionBadge action={log.action} />
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{log.action}</p>
                        {log.metadata && (
                          <p className="text-[10px] text-slate-700 font-mono mt-0.5 truncate">{JSON.stringify(log.metadata)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeAgo(log.created_at)}
                      </div>
                    </Motion.div>
                  ))}
                </AnimatePresence>
                {!loadingLogs && logs.length === 0 && (
                  <div className="py-12 text-center text-slate-600 text-xs">No activity logged yet</div>
                )}
                {loadingLogs && logs.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-xs">Loading...</div>
                )}
              </div>
            </div>
          </Motion.div>
        )}

        {/* ── FEATURE FLAGS ── */}
        {tab === 'flags' && (
          <Motion.div key="flags" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-4 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex items-start gap-2">
              <Zap className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Toggling a flag takes effect <strong>instantly</strong> for all logged-in users via real-time sync. No page refresh needed.</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map(feat => {
                const isOn = flags[feat.key] ?? true;
                const isToggling = togglingFlag === feat.key;
                return (
                  <Motion.div
                    key={feat.key}
                    whileHover={{ scale: 1.01 }}
                    className={`relative bg-slate-900 border rounded-xl p-5 overflow-hidden cursor-pointer transition-all ${
                      isOn ? 'border-white/8' : 'border-red-500/20 bg-red-500/5'
                    }`}
                    onClick={() => !isToggling && toggleFlag(feat.key)}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feat.color} opacity-${isOn ? '8' : '4'} blur-2xl pointer-events-none transition-opacity`} />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 bg-gradient-to-br ${feat.color} rounded-xl text-white shadow-lg transition-opacity ${isOn ? 'opacity-100' : 'opacity-30'}`}>
                          {feat.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">{feat.label}</h3>
                          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{feat.key}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); !isToggling && toggleFlag(feat.key); }}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 border ${
                          isOn
                            ? 'bg-emerald-500/30 border-emerald-500/50'
                            : 'bg-slate-700/50 border-slate-700'
                        } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                        disabled={isToggling}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                          isOn
                            ? 'left-[calc(100%-1.375rem)] bg-emerald-400 shadow-emerald-400/30'
                            : 'left-0.5 bg-slate-500'
                        }`} />
                      </button>
                    </div>
                    <div className={`mt-3 relative z-10 text-[10px] font-black uppercase tracking-widest ${isOn ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isToggling ? 'Updating…' : isOn ? '● Enabled — visible to all users' : '○ Disabled — hidden from all users'}
                    </div>
                  </Motion.div>
                );
              })}
            </div>
          </Motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
