"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Play, RotateCcw, Copy, Search, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AppDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [answerCountFilter, setAnswerCountFilter] = useState('all');
  
  // Modal states
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState(['']);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // Loading states for actions
  const [isResetting, setIsResetting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [agentId, setAgentId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('x_agent_id');
      if (!id) {
        id = 'yt_agent_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('x_agent_id', id);
      }
      setAgentId(id);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!importText.trim()) {
      setImportPreview([]);
      setImportError('');
      return;
    }

    try {
      let cleaned = importText.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const start = cleaned.indexOf('[');
      const end = cleaned.lastIndexOf(']');
      if (start === -1 || end === -1) {
        throw new Error('Could not find array brackets [ ] in the input');
      }

      const arrayStr = cleaned.slice(start, end + 1);

      let jsonStr = arrayStr
        .replace(/([{,]\s*)(text|question|answers|options)(\s*:)/g, (match, p1, p2, p3) => {
          let key = p2;
          if (key === 'question') key = 'text';
          if (key === 'options') key = 'answers';
          return `${p1}"${key}"${p3}`;
        })
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, p1) => {
          const escaped = p1.replace(/"/g, '\\"').replace(/\\'/g, "'");
          return `"${escaped}"`;
        })
        .replace(/,\s*([\]}])/g, '$1');

      let parsed = null;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (jsonErr) {
        const suspiciousKeywords = ['window', 'document', 'fetch', 'cookie', 'localStorage', 'sessionStorage', 'XMLHttpRequest', 'eval', 'prototype', '__proto__', 'process', 'require', 'import'];
        for (const word of suspiciousKeywords) {
          if (cleaned.includes(word)) {
            throw new Error(`Security restriction: input contains disallowed keyword "${word}"`);
          }
        }

        const evaluator = new Function(`return (${arrayStr})`);
        parsed = evaluator();
      }

      if (!Array.isArray(parsed)) {
        throw new Error('Parsed object is not an array');
      }

      const validated = parsed.map((item, idx) => {
        const text = item.text || item.question;
        const rawAnswers = item.answers || item.options || [];
        if (!text) {
          throw new Error(`Item at index ${idx} is missing "text" or "question" field`);
        }
        if (!Array.isArray(rawAnswers)) {
          throw new Error(`Item at index ${idx} "answers" must be an array`);
        }
        return {
          text,
          answers: rawAnswers.map((a, aidx) => {
            if (typeof a === 'string') return { text: a, sortOrder: aidx };
            return { text: a.text || '', sortOrder: a.sortOrder !== undefined ? a.sortOrder : aidx };
          })
        };
      });

      setImportPreview(validated);
      setImportError('');
    } catch (err) {
      setImportPreview([]);
      setImportError(err.message);
    }
  }, [importText]);

  const handleImport = async () => {
    if (isImporting || importPreview.length === 0) return;
    setIsImporting(true);
    try {
      await api.post(`/questions/app/${id}/bulk`, { questions: importPreview });
      toast.success(`Successfully imported ${importPreview.length} questions`);
      setIsImportModalOpen(false);
      setImportText('');
      setImportPreview([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to import questions');
    } finally {
      setIsImporting(false);
    }
  };

  const fetchData = async () => {
    try {
      const [appRes, qRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get(`/questions/app/${id}`)
      ]);
      setApp(appRes.data.data);
      setQuestions(qRes.data.data);
    } catch (error) {
      toast.error('Failed to load app data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (url, label) => {
    navigator.clipboard.writeText(url);
    toast.success(`${label} copied to clipboard`);
  };

  const resetProgress = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await api.post(`/public/${id}/reset`, {}, { headers: { 'x-agent-id': agentId } });
      toast.success('App progress reset');
    } catch (error) {
      toast.error('Failed to reset progress');
    } finally {
      setIsResetting(false);
    }
  };

  const testApi = async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      const res = await api.get(`/public/${id}/next`, { headers: { 'x-agent-id': agentId } });
      toast.success(`Received: ${res.data.type} - ${res.data.type === 'question' ? res.data.question : res.data.answer}`);
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error(error.response.data?.message || 'Rate limit exceeded');
      } else {
        toast.error('Failed to test API');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const openModal = (q = null) => {
    if (q) {
      setCurrentQuestion(q);
      setQuestionText(q.text);
      setAnswers(q.answers.length > 0 ? q.answers.map(a => a.text) : ['']);
    } else {
      setCurrentQuestion(null);
      setQuestionText('');
      setAnswers(['']);
    }
    setIsQuestionModalOpen(true);
  };

  const saveQuestion = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        text: questionText,
        answers: answers.filter(a => a.trim() !== '').map((a, i) => ({ text: a, sortOrder: i }))
      };

      if (currentQuestion) {
        await api.put(`/questions/${currentQuestion._id}`, payload);
        toast.success('Question updated');
      } else {
        await api.post(`/questions/app/${id}`, payload);
        toast.success('Question added');
      }
      setIsQuestionModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuestion = async (qId) => {
    if (deletingQuestionId) return;
    if (!confirm('Delete this question?')) return;
    setDeletingQuestionId(qId);
    try {
      await api.delete(`/questions/${qId}`);
      toast.success('Question deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete question');
    } finally {
      setDeletingQuestionId(null);
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!app) return <div className="text-red-400">App not found</div>;

  return (
    <div className="space-y-8">
      {/* App Header */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-sm backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{app.name}</h1>
          <p className="text-gray-400 mt-1">{app.description}</p>
          {agentId && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Simulated Agent: <span className="font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">{agentId}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={testApi}
            disabled={isTesting || isResetting}
            className="flex items-center gap-2 rounded-lg bg-emerald-600/20 text-emerald-400 px-4 py-2 text-sm font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <svg className="animate-spin h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <Play size={16} />
            )}
            {isTesting ? 'Testing...' : 'Test Next'}
          </button>
          <button
            onClick={resetProgress}
            disabled={isTesting || isResetting}
            className="flex items-center gap-2 rounded-lg bg-amber-600/20 text-amber-400 px-4 py-2 text-sm font-medium hover:bg-amber-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? (
              <svg className="animate-spin h-4 w-4 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <RotateCcw size={16} />
            )}
            {isResetting ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-indigo-400">Next Question/Answer API</span>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">GET</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-950 px-3 py-2 rounded-lg border border-gray-850 font-mono text-xs text-gray-300 select-all overflow-x-auto whitespace-nowrap scrollbar-none">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/public/${id}/next` : `/api/public/${id}/next`}
            </div>
            <button
              onClick={() => handleCopyLink(typeof window !== 'undefined' ? `${window.location.origin}/api/public/${id}/next` : `/api/public/${id}/next`, 'Next API URL')}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
              title="Copy URL"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-amber-400">Start Over / Reset API</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">POST</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-950 px-3 py-2 rounded-lg border border-gray-850 font-mono text-xs text-gray-300 select-all overflow-x-auto whitespace-nowrap scrollbar-none">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/public/${id}/reset` : `/api/public/${id}/reset`}
            </div>
            <button
              onClick={() => handleCopyLink(typeof window !== 'undefined' ? `${window.location.origin}/api/public/${id}/reset` : `/api/public/${id}/reset`, 'Reset API URL')}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
              title="Copy URL"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Questions & Answers Sequence</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Upload size={16} /> Import
            </button>
            <button onClick={() => openModal()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              <Plus size={16} /> Add Question
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-800 backdrop-blur-sm mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search questions by text or answer..."
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
            <span className="text-xs text-gray-400 font-medium">Answers:</span>
            <select
              value={answerCountFilter}
              onChange={(e) => setAnswerCountFilter(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">All Questions</option>
              <option value="has_answers">Has Answers</option>
              <option value="no_answers">No Answers</option>
            </select>
          </div>
        </div>

        {(() => {
          const filteredQuestions = questions.filter(q => {
            const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.answers.some(a => a.text.toLowerCase().includes(searchQuery.toLowerCase()));
            
            let matchesCount = true;
            if (answerCountFilter === 'has_answers') {
              matchesCount = q.answers && q.answers.length > 0;
            } else if (answerCountFilter === 'no_answers') {
              matchesCount = !q.answers || q.answers.length === 0;
            }
            
            return matchesSearch && matchesCount;
          });

          return (
            <div className="space-y-4">
              {filteredQuestions.length === 0 && (
                <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                  {questions.length === 0 
                    ? "No questions added yet. Start building your sequence!" 
                    : "No questions match your filters."}
                </div>
              )}
              
              {filteredQuestions.map((q, idx) => {
                const originalIndex = questions.findIndex(origQ => origQ._id === q._id);
                return (
                  <div key={q._id} className="rounded-xl border border-gray-800 bg-gray-900/30 p-5 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-indigo-400">
                        <span className="text-gray-500 mr-2">Q{originalIndex + 1}.</span> {q.text}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          disabled={deletingQuestionId !== null}
                          onClick={() => openModal(q)}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 size={16}/>
                        </button>
                        <button
                          disabled={deletingQuestionId !== null}
                          onClick={() => deleteQuestion(q._id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingQuestionId === q._id ? (
                            <svg className="animate-spin h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          ) : (
                            <Trash2 size={16}/>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pl-8 border-l-2 border-gray-800 ml-2">
                      {q.answers.map((a, aidx) => (
                        <div key={a._id || aidx} className="flex items-center text-gray-300">
                          <span className="text-gray-600 text-sm w-6">A{aidx + 1}.</span>
                          <span className="bg-gray-800/50 px-3 py-1.5 rounded text-sm w-full">{a.text}</span>
                        </div>
                      ))}
                      {q.answers.length === 0 && <div className="text-sm text-gray-500">No answers defined.</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">{currentQuestion ? 'Edit Question' : 'Add Question'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Question Text</label>
                <input
                  type="text"
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="What is your question?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Answers (Ordered)</label>
                <div className="space-y-2">
                  {answers.map((ans, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm w-4">{i + 1}.</span>
                      <input
                        type="text"
                        value={ans}
                        onChange={e => {
                          const newAns = [...answers];
                          newAns[i] = e.target.value;
                          setAnswers(newAns);
                        }}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="Answer text..."
                      />
                      <button onClick={() => setAnswers(answers.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setAnswers([...answers, ''])}
                  className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={14} /> Add another answer
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                disabled={isSaving}
                onClick={() => setIsQuestionModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={saveQuestion}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Question'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Import Questions Sequence</h3>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportText('');
                  setImportError('');
                  setImportPreview([]);
                }} 
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Paste a JavaScript array or JSON containing questions and answers. Keys can be <code>text</code> (or <code>question</code>) and <code>answers</code> (or <code>options</code>).
                </p>
                
                {/* Code Sample */}
                <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 relative group">
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        const sampleCode = `const questions = [
  {
    text: "Arc upgrade pehle karni chahiye ya modules?",
    answers: [
      "Mujhe lagta hai Arc pehle important hoti hai",
      "Modules ke bina Arc ka full benefit nahi milta",
      "Early game mein modules better lagte hain honestly",
      "Balanced upgrade karna zyada useful hota hai"
    ]
  }
]`;
                        navigator.clipboard.writeText(sampleCode);
                        toast.success('Sample copied to clipboard');
                      }}
                      className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700 transition-colors"
                    >
                      <Copy size={12} /> Copy Sample
                    </button>
                  </div>
                  <pre className="text-xs text-indigo-300 font-mono overflow-x-auto whitespace-pre">
{`const questions = [
  {
    text: "Arc upgrade pehle karni chahiye ya modules?",
    answers: [
      "Mujhe lagta hai Arc pehle important hoti hai",
      "Modules ke bina Arc ka full benefit nahi milta",
      "Early game mein modules better lagte hain honestly",
      "Balanced upgrade karna zyada useful hota hai"
    ]
  }
]`}
                  </pre>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Paste JavaScript or JSON</label>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  className="w-full h-48 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Paste questions here..."
                />
              </div>

              {/* Status / Preview */}
              {importError && (
                <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-3 text-xs text-red-400 font-sans">
                  <strong>Error parsing input:</strong> {importError}
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Ready to import {importPreview.length} questions:
                  </div>
                  <div className="border border-gray-800 bg-gray-950/50 rounded-lg max-h-40 overflow-y-auto p-3 space-y-2 text-xs">
                    {importPreview.map((q, idx) => (
                      <div key={idx} className="border-b border-gray-900 last:border-0 pb-2 last:pb-0">
                        <div className="font-semibold text-indigo-400">{idx + 1}. {q.text}</div>
                        <div className="pl-4 text-gray-500">
                          Answers: {q.answers.map(a => a.text).join(' | ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                disabled={isImporting}
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportText('');
                  setImportError('');
                  setImportPreview([]);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isImporting || importPreview.length === 0}
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Importing...
                  </>
                ) : (
                  `Import ${importPreview.length} Questions`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
