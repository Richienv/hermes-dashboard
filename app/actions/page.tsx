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
  agent?: string;
  urgency?: string;
};

type ModalState = {
  open: boolean;
  actionId: string;
  decision: 'APPROVED' | 'REJECTED';
  actionDescription: string;
} | null;

const TOPICS = ['OIC', 'ERP', 'Personal', 'General', 'Diet & Fitness'];

const TOPIC_COLORS: Record<string, string> = {
  OIC: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  ERP: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Personal: 'bg-green-500/20 text-green-300 border border-green-500/30',
  General: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
  'Diet & Fitness': 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
};

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  ARIA:     { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', hex: '#8B5CF6' },
  GHOST:    { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', hex: '#10B981' },
  SCHOLAR:  { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', hex: '#3B82F6' },
  ICARUS:   { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', hex: '#F59E0B' },
  DAEDALUS: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30', hex: '#06B6D4' },
  HEPHAESTUS: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', hex: '#EF4444' },
  PROMETHEUS: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', hex: '#F97316' },
  ATLAS:    { bg: 'bg-lime-500/20', text: 'text-lime-300', border: 'border-lime-500/30', hex: '#84CC16' },
  SYSTEM:   { bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/30', hex: '#6B7280' },
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const PRIORITY_STYLES: Record<string, { label: string; className: string }> = {
  URGENT: { label: 'URGENT', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  HIGH: { label: 'HIGH', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  NORMAL: { label: 'NORMAL', className: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30' },
  LOW: { label: 'LOW', className: 'bg-zinc-700/20 text-zinc-500 border border-zinc-700/30' },
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
  const [topicFilter, setTopicFilter] = useState('All');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [modal, setModal] = useState<ModalState>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'agent' | 'topic'>('agent');
  const [activeItem, setActiveItem] = useState<string | null>(null);

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
    const interval = setInterval(fetchActions, 60000); // Auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetchActions]);

  const handleConfirm = async () => {
    if (!modal) return;
    if (modal.decision === 'REJECTED' && !reason.trim()) {
      alert('Reason is required for rejection.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/action/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hermes-Key': process.env.NEXT_PUBLIC_HERMES_API_KEY || '',
        },
        body: JSON.stringify({
          actionId: modal.actionId,
          decision: modal.decision,
          reason: reason.trim() || undefined,
        }),
      });
      if (res.ok) {
        setActionStates(prev => ({
          ...prev,
          [modal.actionId]: modal.decision === 'APPROVED' ? 'approved' : 'rejected',
        }));
        setModal(null);
        setReason('');
        setTimeout(fetchActions, 1000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = (action: PendingAction): 'pending' | 'approved' | 'rejected' => {
    return actionStates[action.id] ?? action.status;
  };

  const filteredActions = topicFilter === 'All'
    ? actions
    : actions.filter(a => a.thread_topic === topicFilter);

  const pendingCount = actions.filter(a => getStatus(a) === 'pending').length;

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      <Sidebar
        activeItem={activeItem}
        viewMode={viewMode}
        onItemChange={setActiveItem}
        onViewModeChange={setViewMode}
      />

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3">
          <div className="flex items-center gap-3">
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
          </div>

          {/* Topic filter pills */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <button
              onClick={() => setTopicFilter('All')}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                topicFilter === 'All'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              All
            </button>
            {TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => setTopicFilter(topic)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                  topicFilter === topic
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 max-w-4xl mx-auto">
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
              {topicFilter !== 'All' && (
                <p className="text-zinc-700 font-mono text-xs">in {topicFilter}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActions.map(action => {
                const currentStatus = getStatus(action);
                const topicColor = TOPIC_COLORS[action.thread_topic] ?? TOPIC_COLORS['General'];
                const agent = action.agent || 'SYSTEM';
                const agentColor = AGENT_COLORS[agent] || AGENT_COLORS['SYSTEM'];
                const priority = action.urgency || 'NORMAL';
                const priorityStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES['NORMAL'];

                return (
                  <div
                    key={action.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-start gap-3 flex-wrap md:flex-nowrap"
                  >
                    {/* Status badge */}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 self-start mt-0.5 ${STATUS_STYLES[currentStatus]}`}>
                      {currentStatus.toUpperCase()}
                    </span>

                    {/* Priority indicator */}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 self-start mt-0.5 ${priorityStyle.className}`}>
                      {priorityStyle.label}
                    </span>

                    {/* Agent badge */}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 self-start mt-0.5 ${agentColor.bg} ${agentColor.text} ${agentColor.border} border flex items-center gap-1.5`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agentColor.hex }} />
                      {agent}
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
                          onClick={() => setModal({
                            open: true,
                            actionId: action.id,
                            decision: 'APPROVED',
                            actionDescription: action.description,
                          })}
                          className="text-xs font-mono px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => setModal({
                            open: true,
                            actionId: action.id,
                            decision: 'REJECTED',
                            actionDescription: action.description,
                          })}
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

      {/* Reason modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className={`px-5 py-4 border-b border-zinc-800 rounded-t-xl ${
              modal.decision === 'APPROVED' ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <h3 className={`font-mono font-bold text-sm ${
                modal.decision === 'APPROVED' ? 'text-green-400' : 'text-red-400'
              }`}>
                {modal.decision === 'APPROVED' ? '✅ APPROVE' : '❌ REJECT'}
              </h3>
              <p className="font-mono text-zinc-300 text-xs mt-1 line-clamp-2">
                {modal.actionDescription}
              </p>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <label className="block">
                <span className="font-mono text-zinc-400 text-xs">
                  {modal.decision === 'APPROVED'
                    ? 'Guidance for Hermes (optional):'
                    : 'Reason for rejection (required):'}
                </span>
                <textarea
                  autoFocus
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={
                    modal.decision === 'APPROVED'
                      ? 'e.g. "Proceed but use TypeScript strict mode, skip Prisma seed"'
                      : 'e.g. "Not the right time, revisit next sprint"'
                  }
                  className="mt-1.5 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  rows={3}
                />
              </label>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-3 justify-end">
              <button
                onClick={() => { setModal(null); setReason(''); }}
                disabled={submitting}
                className="font-mono text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`font-mono text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  modal.decision === 'APPROVED'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                }`}
              >
                {submitting ? 'Sending...' : modal.decision === 'APPROVED' ? 'Confirm Approve →' : 'Confirm Reject →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
