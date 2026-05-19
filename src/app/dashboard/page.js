"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalApps: 0, totalApiCalls: 0, activeSequences: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchStats();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.email?.split('@')[0]}</h1>
        <Link
          href="/dashboard/apps/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Create New App
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-400">Total Apps</h3>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? '...' : stats.totalApps}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-400">API Calls (All Time)</h3>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? '...' : stats.totalApiCalls}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
          <h3 className="text-sm font-medium text-gray-400">Active Sequences</h3>
          <p className="mt-2 text-3xl font-bold text-white">{loading ? '...' : stats.activeSequences}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-medium text-white mb-4">Quick Start Guide</h2>
        <div className="space-y-4 text-gray-300">
          <p>1. <strong>Create an App</strong> to get a unique API Key.</p>
          <p>2. <strong>Add Questions</strong> and Answers to your app.</p>
          <p>3. <strong>Call your API</strong> endpoint to get sequences sequentially.</p>
        </div>
      </div>
    </div>
  );
}
