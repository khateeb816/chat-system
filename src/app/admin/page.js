"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Eye, Trash2, Shield, Activity, ListFilter, Users, RefreshCw, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Overview Tab Filters
  const [overviewSearch, setOverviewSearch] = useState('');

  // Agent Tab Filters
  const [agentSearch, setAgentSearch] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState('all');

  // API logs Tab Filters
  const [logSearch, setLogSearch] = useState('');
  const [logRequestTypeFilter, setLogRequestTypeFilter] = useState('all');
  const [logReturnedTypeFilter, setLogReturnedTypeFilter] = useState('all');

  // Sessions Tab Filters
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionModeFilter, setSessionModeFilter] = useState('all');

  useEffect(() => {
    fetchTabContent();
    // Reset filters on tab change
    setOverviewSearch('');
    setAgentSearch('');
    setAgentStatusFilter('all');
    setLogSearch('');
    setLogRequestTypeFilter('all');
    setLogReturnedTypeFilter('all');
    setSessionSearch('');
    setSessionModeFilter('all');
  }, [activeTab]);

  const fetchTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [userRes, appRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/apps')
        ]);
        setUsers(userRes.data.data || []);
        setApps(appRes.data.data || []);
      } else if (activeTab === 'agents') {
        const res = await api.get('/admin/agents');
        setAgents(res.data.data || []);
      } else if (activeTab === 'logs') {
        const res = await api.get('/admin/logs');
        setLogs(res.data.data || []);
      } else if (activeTab === 'sessions') {
        const res = await api.get('/admin/sessions');
        setSessions(res.data.data || []);
      }
    } catch (error) {
      toast.error(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
    }
  };

  const deleteApp = async (id) => {
    if (deletingId) return;
    if (!confirm('Are you sure you want to delete this app globally?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/apps/${id}`);
      setApps(apps.filter(app => app._id !== id));
      toast.success('App deleted successfully');
    } catch (error) {
      toast.error('Failed to delete app');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleString();
  };

  // Helper to check if agent is online (last active < 5 minutes)
  const isAgentOnline = (agent) => {
    if (!agent.lastSeenAt) return false;
    const lastActive = new Date(agent.lastSeenAt).getTime();
    return (Date.now() - lastActive) < 300000; // 5 minutes
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-indigo-400" size={28} /> Admin Dashboard
        </h1>
        <button
          onClick={fetchTabContent}
          className="flex items-center gap-2 text-sm bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-850 gap-6">
        {[
          { id: 'overview', label: 'Apps Overview', icon: Users },
          { id: 'agents', label: 'Agent Monitoring', icon: Activity },
          { id: 'logs', label: 'API Request Logs', icon: ListFilter },
          { id: 'sessions', label: 'Live App Sessions', icon: RefreshCw }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
                activeTab === tab.id 
                  ? 'text-indigo-400 border-indigo-500 font-semibold' 
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (() => {
            const filteredApps = apps.filter(app => {
              const query = overviewSearch.toLowerCase();
              return app.name.toLowerCase().includes(query) || 
                (app.ownerId?.email && app.ownerId.email.toLowerCase().includes(query));
            });

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
                    <p className="mt-2 text-3xl font-bold text-white">{users.length}</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-400">Total Apps</h3>
                    <p className="mt-2 text-3xl font-bold text-white">{apps.length}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-white">All Apps</h2>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search apps by name or owner..."
                        className="w-full pl-9 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                        value={overviewSearch}
                        onChange={(e) => setOverviewSearch(e.target.value)}
                      />
                      {overviewSearch && (
                        <button
                          onClick={() => setOverviewSearch('')}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-gray-800/40 text-gray-400 border-b border-gray-850">
                        <tr>
                          <th className="px-6 py-4 font-medium">App Name</th>
                          <th className="px-6 py-4 font-medium">Owner</th>
                          <th className="px-6 py-4 font-medium">Created</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {filteredApps.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                              {apps.length === 0 ? 'No applications created.' : 'No applications match your search.'}
                            </td>
                          </tr>
                        ) : (
                          filteredApps.map(app => (
                            <tr key={app._id} className="hover:bg-gray-800/10 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">{app.name}</td>
                              <td className="px-6 py-4 text-gray-400">{app.ownerId?.email || 'Unknown'}</td>
                              <td className="px-6 py-4 text-gray-400">{formatDate(app.createdAt)}</td>
                              <td className="px-6 py-4 flex gap-3">
                                <Link
                                  href={`/admin/apps/${app._id}`}
                                  className={`text-indigo-400 hover:text-indigo-300 p-1 rounded hover:bg-gray-800/30 transition-colors ${deletingId ? 'pointer-events-none opacity-50' : ''}`}
                                >
                                  <Eye size={18} />
                                </Link>
                                <button
                                  disabled={deletingId !== null}
                                  onClick={() => deleteApp(app._id)}
                                  className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/20 transition-colors disabled:opacity-50"
                                >
                                  {deletingId === app._id ? (
                                    <div className="animate-spin h-4.5 w-4.5 border-2 border-red-500 border-t-transparent rounded-full" />
                                  ) : (
                                    <Trash2 size={18} />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}

          {/* AGENTS TAB */}
          {activeTab === 'agents' && (() => {
            const filteredAgents = agents.filter(agent => {
              const query = agentSearch.toLowerCase();
              const matchesSearch = agent.agentId.toLowerCase().includes(query) ||
                (agent.metadata?.browser && agent.metadata.browser.toLowerCase().includes(query)) ||
                (agent.metadata?.userAgent && agent.metadata.userAgent.toLowerCase().includes(query)) ||
                (agent.metadata?.ip && agent.metadata.ip.toLowerCase().includes(query));
                
              const online = isAgentOnline(agent);
              let matchesStatus = true;
              if (agentStatusFilter === 'online') {
                matchesStatus = online;
              } else if (agentStatusFilter === 'offline') {
                matchesStatus = !online;
              }
              
              return matchesSearch && matchesStatus;
            });

            return (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white">Active Agents</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search agents by ID, browser, IP..."
                        className="w-full pl-9 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                      />
                      {agentSearch && (
                        <button
                          onClick={() => setAgentSearch('')}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 font-medium">Status:</span>
                      <select
                        value={agentStatusFilter}
                        onChange={(e) => setAgentStatusFilter(e.target.value)}
                        className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="all">All Agents</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-800/40 text-gray-400 border-b border-gray-850">
                      <tr>
                        <th className="px-6 py-4 font-medium">Agent ID</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Total Requests</th>
                        <th className="px-6 py-4 font-medium">Browser / Platform</th>
                        <th className="px-6 py-4 font-medium">IP Address</th>
                        <th className="px-6 py-4 font-medium">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {filteredAgents.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            {agents.length === 0 ? 'No client agents registered yet.' : 'No agents match your filters.'}
                          </td>
                        </tr>
                      ) : (
                        filteredAgents.map(agent => {
                          const online = isAgentOnline(agent);
                          return (
                            <tr key={agent._id} className="hover:bg-gray-800/10 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-indigo-300 font-semibold">{agent.agentId}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  online 
                                    ? 'bg-green-950/50 text-green-400 border border-green-500/20' 
                                    : 'bg-gray-900 text-gray-500 border border-gray-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
                                  {online ? 'Online' : 'Offline'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-white">{agent.totalRequests || 0}</td>
                              <td className="px-6 py-4 text-gray-400 text-xs truncate max-w-[200px]" title={agent.metadata?.userAgent}>
                                <span className="font-semibold text-gray-300">{agent.metadata?.browser || 'Browser'}</span> - {agent.metadata?.userAgent || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-gray-400">{agent.metadata?.ip || '127.0.0.1'}</td>
                              <td className="px-6 py-4 text-xs text-gray-400">{formatDate(agent.lastSeenAt)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* REQUEST LOGS TAB */}
          {activeTab === 'logs' && (() => {
            const filteredLogs = logs.filter(log => {
              const query = logSearch.toLowerCase();
              const matchesSearch = (log.appName && log.appName.toLowerCase().includes(query)) ||
                (log.agentId && log.agentId.toLowerCase().includes(query)) ||
                (log.ip && log.ip.toLowerCase().includes(query)) ||
                (log.returnedQuestionIndex !== undefined && `q: ${log.returnedQuestionIndex}`.includes(query)) ||
                (log.returnedAnswerIndex !== undefined && `a: ${log.returnedAnswerIndex}`.includes(query));
                
              const matchesRequestType = logRequestTypeFilter === 'all' || log.requestType === logRequestTypeFilter;
              const matchesReturnedType = logReturnedTypeFilter === 'all' || log.returnedType === logReturnedTypeFilter;
              
              return matchesSearch && matchesRequestType && matchesReturnedType;
            });

            return (
              <div className="space-y-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white">Public API Log Stream</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search logs by app, agent, IP, index..."
                        className="w-full pl-9 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                      />
                      {logSearch && (
                        <button
                          onClick={() => setLogSearch('')}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">Req Type:</span>
                        <select
                          value={logRequestTypeFilter}
                          onChange={(e) => setLogRequestTypeFilter(e.target.value)}
                          className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                        >
                          <option value="all">All Request Types</option>
                          <option value="next">next</option>
                          <option value="reset">reset</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">Ret Type:</span>
                        <select
                          value={logReturnedTypeFilter}
                          onChange={(e) => setLogReturnedTypeFilter(e.target.value)}
                          className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                        >
                          <option value="all">All Returned Types</option>
                          <option value="question">Question</option>
                          <option value="answer">Answer</option>
                          <option value="reset">Reset</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-800/40 text-gray-400 border-b border-gray-850">
                      <tr>
                        <th className="px-6 py-4 font-medium">Timestamp</th>
                        <th className="px-6 py-4 font-medium">App Name</th>
                        <th className="px-6 py-4 font-medium">Agent ID</th>
                        <th className="px-6 py-4 font-medium">Request</th>
                        <th className="px-6 py-4 font-medium">Returned Type</th>
                        <th className="px-6 py-4 font-medium">Index Metadata</th>
                        <th className="px-6 py-4 font-medium">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            {logs.length === 0 ? 'No public API traffic logged yet.' : 'No logs match your filters.'}
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map(log => (
                          <tr key={log._id} className="hover:bg-gray-800/10 transition-colors">
                            <td className="px-6 py-4 text-xs text-gray-400 font-mono">{formatDate(log.timestamp)}</td>
                            <td className="px-6 py-4 font-medium text-gray-200">{log.appName}</td>
                            <td className="px-6 py-4 font-mono text-xs text-indigo-300">{log.agentId}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase font-mono ${
                                log.requestType === 'reset' 
                                  ? 'bg-amber-900/30 text-amber-400 border border-amber-500/10' 
                                  : 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/10'
                              }`}>
                                {log.requestType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <span className={`font-semibold capitalize ${
                                log.returnedType === 'question' 
                                  ? 'text-cyan-400' 
                                  : log.returnedType === 'answer' 
                                    ? 'text-emerald-400' 
                                    : 'text-amber-400'
                              }`}>
                                {log.returnedType}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">
                              {log.returnedType === 'reset' ? '-' : `Q: ${log.returnedQuestionIndex ?? 0} | A: ${log.returnedAnswerIndex !== null ? log.returnedAnswerIndex : '-'}`}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">{log.ip}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (() => {
            const filteredSessions = sessions.filter(sess => {
              const query = sessionSearch.toLowerCase();
              const matchesSearch = (sess.appName && sess.appName.toLowerCase().includes(query)) ||
                (sess.ownerEmail && sess.ownerEmail.toLowerCase().includes(query)) ||
                (sess.currentServingAgentId && sess.currentServingAgentId.toLowerCase().includes(query));
                
              const matchesMode = sessionModeFilter === 'all' || sess.currentMode === sessionModeFilter;
              
              return matchesSearch && matchesMode;
            });

            return (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white">Live Session States</h2>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search sessions by app, owner, agent..."
                        className="w-full pl-9 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                        value={sessionSearch}
                        onChange={(e) => setSessionSearch(e.target.value)}
                      />
                      {sessionSearch && (
                        <button
                          onClick={() => setSessionSearch('')}
                          className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 font-medium">Mode:</span>
                      <select
                        value={sessionModeFilter}
                        onChange={(e) => setSessionModeFilter(e.target.value)}
                        className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="all">All Modes</option>
                        <option value="question">Question</option>
                        <option value="answer">Answer</option>
                        <option value="reset">Reset</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-800/40 text-gray-400 border-b border-gray-850">
                      <tr>
                        <th className="px-6 py-4 font-medium">App Name</th>
                        <th className="px-6 py-4 font-medium">Owner</th>
                        <th className="px-6 py-4 font-medium">Current Mode</th>
                        <th className="px-6 py-4 font-medium">Q. Index</th>
                        <th className="px-6 py-4 font-medium">A. Index</th>
                        <th className="px-6 py-4 font-medium">Current Serving Agent</th>
                        <th className="px-6 py-4 font-medium">Last Session Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {filteredSessions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            {sessions.length === 0 ? 'No active progress tracking sessions.' : 'No sessions match your filters.'}
                          </td>
                        </tr>
                      ) : (
                        filteredSessions.map(sess => (
                          <tr key={sess._id} className="hover:bg-gray-800/10 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{sess.appName}</td>
                            <td className="px-6 py-4 text-xs text-gray-400">{sess.ownerEmail}</td>
                            <td className="px-6 py-4">
                              <span className="capitalize font-semibold text-indigo-400">{sess.currentMode || 'question'}</span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-center text-white">{sess.currentQuestionIndex ?? 0}</td>
                            <td className="px-6 py-4 font-semibold text-center text-white">{sess.currentAnswerIndex ?? 0}</td>
                            <td className="px-6 py-4 font-mono text-xs text-indigo-300 font-semibold">{sess.currentServingAgentId || 'None'}</td>
                            <td className="px-6 py-4 text-xs text-gray-400">{formatDate(sess.lastServedAt || sess.lastAccessedAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
