'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';

type ThreadItem = {
  id: string;
  topic: string;
  topic_tag: string;
  title: string;
  body?: string;
  section: string;
  urgency: string;
  source: string;
  action_required: boolean;
  digest_id?: string;
  created_at: string;
  agent?: string;
  actions: { id: string; description: string; status: string }[];
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

const TOPIC_COLORS: Record<string, string> = {
  OIC:      'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  ERP:      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Personal: 'bg-green-500/20 text-green-300 border border-green-500/30',
  General:  'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
  'Diet & Fitness': 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
};

const AGENTS = ['ARIA', 'GHOST', 'SCHOLAR', 'ICARUS', 'DAEDALUS', 'HEPHAESTUS', 'PROMETHEUS', 'ATLAS'];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) {
    return `Kemarin ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
}

function FeedItem({ item, expanded, onToggle }: { item: ThreadItem; expanded: boolean; onToggle: () => void }) {
  const agent = item.agent || item.source || 'SYSTEM';
  const agentColor = AGENT_COLORS[agent] || AGENT_COLORS['SYSTEM'];
  const topicColor = TOPIC_COLORS[item.topic_tag] || TOPIC_COLORS['General'];

  return (
    <article
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-900 transition-colors cursor-pointer"
      onClick={onToggle}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Agent badge */}
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${agentColor.bg} ${agentColor.text} ${agentColor.border} border flex items-center gap-1.5`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agentColor.hex }} />
          {agent}
        </span>

        {/* Timestamp */}
        <span className="text-zinc-600 text-xs font-mono ml-auto">
          {formatRelativeTime(item.created_at)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-mono text-zinc-100 text-sm font-semibold mb-1 leading-snug">
        {item.title}
      </h3>

      {/* Content preview or full */}
      {item.body && (
        <p className={`font-mono text-zinc-400 text-xs leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {item.body}
        </p>
      )}

      {/* Topic tag */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${topicColor}`}>
          {item.topic_tag || item.topic}
        </span>

        {item.urgency === 'HIGH' && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
            URGENT
          </span>
        )}

        {item.action_required && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            ACTION REQUIRED
          </span>
        )}

        {expanded && (
          <span className="text-zinc-600 text-xs font-mono ml-auto">
            Klik untuk tutup
          </span>
        )}
      </div>

      {/* Pending actions */}
      {item.actions.filter(a => a.status === 'pending').length > 0 && (
        <div className="mt-2 space-y-1">
          {item.actions.filter(a => a.status === 'pending').map(a => (
            <div key={a.id} className="text-xs font-mono text-amber-400/80 border-l-2 border-amber-600/40 pl-2">
              ↳ {a.description}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'agent' | 'topic'>('agent');
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [items, setItems] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/dashboard?flat=true';

      if (viewMode === 'topic' && activeItem) {
        url += `&topic=${encodeURIComponent(activeItem)}`;
      }

      if (viewMode === 'agent' && activeItem && activeItem !== 'All') {
        url += `&agent=${encodeURIComponent(activeItem)}`;
      }

      if (agentFilter !== 'All') {
        url += `&agent=${encodeURIComponent(agentFilter)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, activeItem, agentFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewModeChange = (mode: 'agent' | 'topic') => {
    setViewMode(mode);
    setActiveItem(null);
    setAgentFilter('All');
  };

  const handleItemChange = (item: string) => {
    setActiveItem(item);
    setAgentFilter('All');
  };

  const headerLabel = activeItem
    ? (viewMode === 'agent' ? `Agent: ${activeItem}` : `Topic: ${activeItem}`)
    : 'All Feed';

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      <Sidebar
        activeItem={activeItem}
        viewMode={viewMode}
        onItemChange={handleItemChange}
        onViewModeChange={handleViewModeChange}
      />

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 lg:hidden" />
            <div>
              <h2 className="font-mono text-sm text-zinc-300">
                {headerLabel}
              </h2>
              <p className="text-zinc-600 text-xs font-mono">{items.length} item(s)</p>
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
          </div>

          {/* Agent filter bar */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setAgentFilter('All')}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors ${
                agentFilter === 'All'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              All
            </button>
            {AGENTS.map(agent => {
              const color = AGENT_COLORS[agent];
              return (
                <button
                  key={agent}
                  onClick={() => setAgentFilter(agent)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    agentFilter === agent
                      ? `${color.bg} ${color.text} ${color.border}`
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.hex }} />
                  {agent}
                </button>
              );
            })}
          </div>
        </header>

        {/* Feed */}
        <main className="p-4 md:p-6 max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-zinc-600 font-mono text-sm">No items found</p>
                <p className="text-zinc-700 font-mono text-xs mt-1">POST /api/thread to create one</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <FeedItem
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
