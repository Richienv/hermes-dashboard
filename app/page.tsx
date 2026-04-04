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
  actions: { id: string; description: string; status: string }[];
};

type SectionGroup = {
  section: string;
  label: string;
  items: ThreadItem[];
};

const TOPIC_COLORS: Record<string, string> = {
  OIC:      'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  ERP:      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Personal: 'bg-green-500/20 text-green-300 border border-green-500/30',
  General:  'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
};

const SOURCE_COLORS: Record<string, string> = {
  ARIA:     'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  ICARUS:   'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  DAEDALUS: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  GHOST:    'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
  SCHOLAR:  'bg-green-500/20 text-green-300 border border-green-500/30',
  SYSTEM:   'bg-zinc-600/20 text-zinc-400 border border-zinc-600/30',
};

const SECTION_HEADER_COLORS: Record<string, string> = {
  PRIORITAS:     'text-red-400 border-b border-red-900/40',
  AKSI_HARI_INI: 'text-red-400 border-b border-red-900/40',
  MINGGU_INI:    'text-amber-400 border-b border-amber-900/40',
  DICATAT:       'text-green-400 border-b border-green-900/40',
  TEMUAN:        'text-sky-400 border-b border-sky-900/40',
  JADWAL:        'text-zinc-400 border-b border-zinc-700',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ItemCard({ item }: { item: ThreadItem }) {
  const sourceColor = SOURCE_COLORS[item.source] ?? SOURCE_COLORS['SYSTEM'];
  const topicColor  = TOPIC_COLORS[item.topic_tag] ?? TOPIC_COLORS['General'];

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 px-4 py-3">
      <div className="flex items-start gap-2 mb-1">
        {/* Source badge */}
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded shrink-0 ${sourceColor}`}>
          {item.source}
        </span>

        {/* Title */}
        <span className="font-mono text-zinc-100 text-sm font-medium flex-1 leading-snug">
          {item.title}
        </span>

        {/* Action required dot */}
        {item.action_required && (
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" title="Action required" />
        )}
      </div>

      {/* Body */}
      {item.body && (
        <p className="font-mono text-zinc-400 text-xs mt-1 leading-relaxed pl-0">
          {item.body}
        </p>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${topicColor}`}>
          {item.topic_tag || item.topic}
        </span>
        <span className="text-zinc-600 text-xs font-mono ml-auto">
          {formatDate(item.created_at)}
        </span>
      </div>

      {/* Pending actions */}
      {item.actions.filter(a => a.status === 'pending').map(a => (
        <div key={a.id} className="mt-2 text-xs font-mono text-amber-400/80 border-l-2 border-amber-600/40 pl-2">
          ↳ {a.description}
        </div>
      ))}
    </div>
  );
}

function SectionBlock({ group }: { group: SectionGroup }) {
  const headerColor = SECTION_HEADER_COLORS[group.section] ?? 'text-zinc-400 border-b border-zinc-700';

  return (
    <div className="mb-6">
      <h2 className={`font-mono text-xs font-semibold uppercase tracking-widest pb-1.5 mb-3 ${headerColor}`}>
        {group.label} <span className="text-zinc-600 normal-case tracking-normal font-normal">({group.items.length})</span>
      </h2>
      <div className="space-y-2">
        {group.items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTopic, setActiveTopic]   = useState('OIC');
  const [sections, setSections]         = useState<SectionGroup[]>([]);
  const [loading, setLoading]           = useState(true);

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?topic=${activeTopic}`);
      if (res.ok) {
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
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

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      <Sidebar activeTopic={activeTopic} onTopicChange={(topic) => { setActiveTopic(topic); }} />

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3 flex items-center gap-3">
          <div className="w-7 lg:hidden" />
          <div>
            <h2 className="font-mono text-sm text-zinc-300">
              Topic: <span className="text-amber-400">{activeTopic}</span>
            </h2>
            <p className="text-zinc-600 text-xs font-mono">{totalItems} item(s) · {sections.length} section(s)</p>
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
        <main className="p-4 md:p-6 max-w-3xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading...</div>
            </div>
          ) : sections.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-zinc-600 font-mono text-sm">No items in {activeTopic}</p>
                <p className="text-zinc-700 font-mono text-xs mt-1">POST /api/thread to create one</p>
              </div>
            </div>
          ) : (
            <div>
              {sections.map(group => (
                <SectionBlock key={group.section} group={group} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
