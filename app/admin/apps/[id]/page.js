"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { Play, RotateCcw, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAppDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [questionSearch, setQuestionSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/admin/apps/${id}`);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load app data');
    } finally {
      setLoading(false);
    }
  };

  const resetProgress = async () => {
    try {
      await api.post(`/public/${id}/reset`);
      toast.success('App progress reset');
      fetchData();
    } catch (error) {
      toast.error('Failed to reset progress');
    }
  };

  const testApi = async () => {
    try {
      const res = await api.get(`/public/${id}/next`);
      toast.success(`Received: ${res.data.type}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to test API');
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!data) return <div className="text-red-400">App not found</div>;

  const { app, questions, progress, logs, stats } = data;

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Inspector: {app.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Owner:</span> <span className="text-gray-300">{app.ownerId?.email}</span></div>
          <div><span className="text-gray-500">API Calls:</span> <span className="text-gray-300">{progress?.totalApiCalls || 0}</span></div>
          <div><span className="text-gray-500">Questions:</span> <span className="text-gray-300">{stats.totalQuestions}</span></div>
          <div><span className="text-gray-500">Answers:</span> <span className="text-gray-300">{stats.totalAnswers}</span></div>
        </div>
      </div>

      {/* API Testing */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">API Progress State</h2>
          <div className="flex gap-3">
            <button onClick={testApi} className="flex items-center gap-2 rounded-lg bg-emerald-600/20 text-emerald-400 px-4 py-2 text-sm font-medium hover:bg-emerald-600/30 transition-colors">
              <Play size={16} /> Trigger Next API
            </button>
            <button onClick={resetProgress} className="flex items-center gap-2 rounded-lg bg-amber-600/20 text-amber-400 px-4 py-2 text-sm font-medium hover:bg-amber-600/30 transition-colors">
              <RotateCcw size={16} /> Reset State
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm bg-gray-950 p-4 rounded-lg border border-gray-800 font-mono text-gray-300">
          <div>Question Index: {progress?.currentQuestionIndex || 0}</div>
          <div>Answer Index: {progress?.currentAnswerIndex || 0}</div>
          <div>Mode: {progress?.currentMode || 'question'}</div>
        </div>
      </div>

      {/* Structure */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-white">Questions Structure</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search questions or answers..."
              className="w-full pl-9 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
            />
            {questionSearch && (
              <button
                onClick={() => setQuestionSearch('')}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {(() => {
          const filteredQuestions = questions.filter(q => 
            q.text.toLowerCase().includes(questionSearch.toLowerCase()) ||
            q.answers.some(a => a.text.toLowerCase().includes(questionSearch.toLowerCase()))
          );

          return (
            <div className="space-y-4">
              {filteredQuestions.length === 0 && (
                <div className="text-gray-500 text-sm py-4 text-center">
                  {questions.length === 0 ? 'No questions structure defined.' : 'No questions match your search.'}
                </div>
              )}
              {filteredQuestions.map((q, idx) => {
                const originalIndex = questions.findIndex(origQ => origQ._id === q._id);
                return (
                  <div key={q._id} className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <div className="font-semibold text-indigo-400 mb-2">Q{originalIndex + 1}: {q.text}</div>
                    <div className="pl-6 space-y-1">
                      {q.answers.map((a, aidx) => (
                        <div key={a._id} className="text-gray-400 text-sm">
                          A{aidx + 1}: {a.text}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Activity Logs */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-white">Activity Logs</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs by action..."
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
        </div>

        {(() => {
          const filteredLogs = logs.filter(log => 
            log.action.toLowerCase().includes(logSearch.toLowerCase())
          );

          return (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredLogs.length === 0 && (
                <div className="text-gray-500 text-sm py-4 text-center">
                  {logs.length === 0 ? 'No activity recorded.' : 'No logs match your search.'}
                </div>
              )}
              {filteredLogs.map(log => (
                <div key={log._id} className="flex justify-between text-sm py-2 border-b border-gray-800/50 last:border-0">
                  <span className="text-gray-300">{log.action}</span>
                  <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
