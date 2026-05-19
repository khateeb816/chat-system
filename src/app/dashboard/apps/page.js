"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, Settings2, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AppsList() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await api.get('/apps');
      setApps(res.data.data);
    } catch (error) {
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const deleteApp = async (id) => {
    if (deletingId) return;
    if (!confirm('Are you sure you want to delete this app and all its questions?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/apps/${id}`);
      setApps(apps.filter(app => app._id !== id));
      toast.success('App deleted successfully');
    } catch (error) {
      toast.error('Failed to delete app');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter logic
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Apps</h1>
        <Link
          href="/dashboard/apps/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          New App
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search apps by name or description..."
            className="w-full pl-9 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            {apps.length === 0 ? 'No apps found. Create one to get started.' : 'No apps match your filters.'}
          </div>
        )}
        {filteredApps.map(app => (
          <div key={app._id} className="flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm hover:border-gray-700 transition-colors">
            <div>
              <h3 className="text-lg font-bold text-white">{app.name}</h3>
              <p className="mt-2 text-sm text-gray-400 line-clamp-2">{app.description || 'No description provided.'}</p>
              <div className="mt-4 text-xs font-mono bg-gray-950 p-2 rounded border border-gray-800 text-gray-300 break-all">
                Key: {app.apiKey}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
              <span className={`text-xs px-2 py-1 rounded-full ${app.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {app.status}
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/apps/${app._id}`}
                  className={`p-2 text-gray-400 hover:text-white transition-colors ${deletingId ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <Settings2 size={18} />
                </Link>
                <button
                  disabled={deletingId !== null}
                  onClick={() => deleteApp(app._id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === app._id ? (
                    <svg className="animate-spin h-[18px] w-[18px] text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
