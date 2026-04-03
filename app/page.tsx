'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Action = {
  id: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at?: string;
  update_id?: string;
};

type Update = {
  id: string;
  content: string;
  source_link?: string;
  created_at: string;
  actions: Action[];
};

type Thread = {
  id: string;
  topic: string;
  title: string;
  created_at: string;
  updates: Update[];
};

const TOPICS = ['OIC', 'ERP', 'Personal', 'General'];

export default function Dashboard() {
  const [activeTopic, setActiveTopic] = useState('OIC');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?topic=${activeTopic}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTopic]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (actionId: string, status: 'approved' | 'rejected') => {
    // Optimistic update
    setActionStates(prev => ({ ...prev, [actionId]: status }));

    try {
      const res = await fetch(`/api/action/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Hermes-Key': process.env.NEXT_PUBLIC_HERMES_API_KEY || '',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        // Revert on failure
        setActionStates(prev => ({ ...prev, [actionId]: 'pending' }));
        alert('Failed to update action');
      } else {
        // Refresh after a moment
        setTimeout(fetchData, 1000);
      }
    } catch {
      setActionStates(prev => ({ ...prev, [actionId]: 'pending' }));
    }
  };

  const getActionStatus = (action: Action): 'pending' | 'approved' | 'rejected' => {
    return actionStates[action.id] ?? action.status;
  };

  const statusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    if (status === 'pending') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    if (status === 'approved') return 'bg-green-500/20 text-green-400 border border-green-500/30';
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-zinc-950 border-r border-zinc-800 z-30 flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-amber-400 font-mono text-lg font-bold tracking-tight">⚡ HERMES</h1>
          <p className="text-zinc-500 text-xs mt-1 font-mono">Intelligence Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => { setActiveTopic(topic); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-colors
                ${activeTopic === topic
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
            >
              {topic}
            </button>
          ))}

          <div className="pt-2 border-t border-zinc-800 mt-4">
            <Link
              href="/links"
              className="w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors flex items-center gap-2 block"
              onClick={() => setSidebarOpen(false)}
            >
              🔗 Links
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <p className="text-zinc-600 text-xs font-mono">v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-400 hover:text-zinc-100 p-1"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h2 className="font-mono text-sm text-zinc-300">
              Topic: <span className="text-amber-400">{activeTopic}</span>
            </h2>
            <p className="text-zinc-600 text-xs font-mono">{threads.length} thread(s)</p>
          </div>
          <button
            onClick={fetchData}
            className="ml-auto text-zinc-500 hover:text-amber-400 transition-colors p-1"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading...</div>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-zinc-600 font-mono text-sm">No threads in {activeTopic}</p>
                <p className="text-zinc-700 font-mono text-xs mt-1">POST /api/thread to create one</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {threads.map(thread => (
                <div key={thread.id} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  {/* Thread header */}
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-mono text-zinc-100 font-semibold">{thread.title}</h3>
                      <p className="text-zinc-600 text-xs font-mono mt-0.5">{formatDate(thread.created_at)}</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                      {thread.updates.length} update(s)
                    </span>
                  </div>

                  {/* Updates */}
                  <div className="divide-y divide-zinc-800/50">
                    {thread.updates.length === 0 ? (
                      <div className="px-4 py-4 text-zinc-600 font-mono text-xs">No updates yet</div>
                    ) : (
                      thread.updates.map(update => (
                        <div key={update.id} className="px-4 py-4">
                          {/* Update meta */}
                          <p className="text-zinc-600 text-xs font-mono mb-2">{formatDate(update.created_at)}</p>

                          {/* Update content */}
                          <p className="font-mono text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                            {update.content}
                          </p>

                          {/* Source link */}
                          {update.source_link && (
                            <a
                              href={update.source_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 text-amber-400 text-xs font-mono hover:text-amber-300 underline underline-offset-2 transition-colors"
                            >
                              ↗ {update.source_link}
                            </a>
                          )}

                          {/* Actions */}
                          {update.actions && update.actions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {update.actions.map(action => {
                                const currentStatus = getActionStatus(action);
                                return (
                                  <div key={action.id} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                                    <div className="flex items-start gap-2 flex-wrap">
                                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${statusBadge(currentStatus)}`}>
                                        {currentStatus}
                                      </span>
                                      <p className="font-mono text-xs text-zinc-300 flex-1">{action.description}</p>
                                    </div>
                                    {currentStatus === 'pending' && (
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => handleAction(action.id, 'approved')}
                                          className="text-xs font-mono px-3 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                                        >
                                          ✅ Approve
                                        </button>
                                        <button
                                          onClick={() => handleAction(action.id, 'rejected')}
                                          className="text-xs font-mono px-3 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                        >
                                          ❌ Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
