'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';

type PendingAction = {
  id: string;
  thread_id: string;
  update_id?: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at?: string;
  thread_title: string;
  thread_topic: string;
};

const TOPIC_FILTERS = ['All', 'OIC', 'ERP', 'Personal', 'General'];

const TOPIC_COLORS: Record<string, string> = {
  OIC: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  ERP: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Personal: 'bg-green-500/20 text-green-300 border border-green-500/30',
  General: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ActionsPage() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [actionStates, setActionStates] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch('/api/actions/pending');
      if (res.ok) {
        const data: PendingAction[] = await res.json();
        setActions(data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch actions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
    const interval = setInterval(fetchActions, 30000);
    return () => clearInterval(interval);
  }, [fetchActions]);

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
        setActionStates(prev => ({ ...prev, [actionId]: 'pending' }));
        alert('Failed to update action');
      } else {
        setTimeout(fetchActions, 1000);
      }
    } catch {
      setActionStates(prev => ({ ...prev, [actionId]: 'pending' }));
    }
  };

  const getStatus = (action: PendingAction): 'pending' | 'approved' | 'rejected' => {
    return actionStates[action.id] ?? action.status;
  };

  const filteredActions = activeFilter === 'All'
    ? actions
    : actions.filter(a => a.thread_topic === activeFilter);

  const pendingCount = actions.filter(a => getStatus(a) === 'pending').length;

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      <Sidebar activeTopic={null} />

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3 flex items-center gap-3">
          <div className="w-7 lg:hidden" />
          <div>
            <h2 className="font-mono text-sm text-zinc-300">
              ⚡ <span className="text-amber-400">Actions</span>
            </h2>
            <p className="text-zinc-600 text-xs font-mono">
              {pendingCount} pending · refreshed {formatDate(lastRefresh.toISOString())}
            </p>
          </div>
          <button
            onClick={fetchActions}
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
          {/* Topic filter pills */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            {TOPIC_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors
                  ${activeFilter === f
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading...</div>
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg className="w-10 h-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-zinc-600 font-mono text-sm">No pending actions</p>
              {activeFilter !== 'All' && (
                <p className="text-zinc-700 font-mono text-xs">in {activeFilter}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActions.map(action => {
                const currentStatus = getStatus(action);
                const topicColor = TOPIC_COLORS[action.thread_topic] ?? TOPIC_COLORS['General'];
                return (
                  <div
                    key={action.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-start gap-3 flex-wrap md:flex-nowrap"
                  >
                    {/* Status badge */}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 self-start mt-0.5 ${STATUS_STYLES[currentStatus]}`}>
                      {currentStatus.toUpperCase()}
                    </span>

                    {/* Topic pill */}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 self-start mt-0.5 ${topicColor}`}>
                      {action.thread_topic}
                    </span>

                    {/* Description + thread title */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-zinc-200">{action.description}</p>
                      <p className="font-mono text-xs text-zinc-600 mt-0.5 truncate">{action.thread_title}</p>
                      <p className="font-mono text-xs text-zinc-700 mt-0.5">{formatDate(action.created_at)}</p>
                    </div>

                    {/* Action buttons — only if pending */}
                    {currentStatus === 'pending' && (
                      <div className="flex gap-2 shrink-0 self-center mt-1 md:mt-0">
                        <button
                          onClick={() => handleAction(action.id, 'approved')}
                          className="text-xs font-mono px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleAction(action.id, 'rejected')}
                          className="text-xs font-mono px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
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
        </main>
      </div>
    </div>
  );
}
