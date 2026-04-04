'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';

type Update = {
  id: string;
  content: string;
  source_link?: string;
  created_at: string;
};

type Thread = {
  id: string;
  topic: string;
  title: string;
  created_at: string;
  updates: Update[];
};

const TOPIC_COLORS: Record<string, string> = {
  OIC: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  ERP: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Personal: 'bg-green-500/20 text-green-300 border border-green-500/30',
  General: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
};

function parseContentLines(content: string): Array<{ type: string; text: string }> {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('🔴')) return { type: 'red', text: trimmed.slice(2).trim() };
    if (trimmed.startsWith('🟡')) return { type: 'amber', text: trimmed.slice(2).trim() };
    if (trimmed.startsWith('🟢')) return { type: 'green', text: trimmed.slice(2).trim() };
    if (trimmed.startsWith('🔍')) return { type: 'blue', text: trimmed.slice(2).trim() };
    if (trimmed.startsWith('📅')) return { type: 'zinc-date', text: trimmed.slice(2).trim() };
    return { type: 'bullet', text: trimmed };
  });
}

function hasEmojiMarkers(content: string): boolean {
  return /🔴|🟡|🟢|🔍|📅/.test(content);
}

function ContentLine({ type, text, topic }: { type: string; text: string; topic: string }) {
  if (type === 'red') {
    return (
      <div className="flex items-center gap-2 py-1.5 border-l-2 border-red-500 pl-3">
        <span className="font-mono text-sm font-semibold text-red-400">{text}</span>
      </div>
    );
  }
  if (type === 'amber') {
    return (
      <div className="flex items-center gap-2 py-1.5 border-l-2 border-amber-500 pl-3">
        <span className="font-mono text-sm font-semibold text-amber-400">{text}</span>
      </div>
    );
  }
  if (type === 'green') {
    return (
      <div className="flex items-center gap-2 py-1.5 border-l-2 border-green-500 pl-3">
        <span className="font-mono text-sm font-semibold text-green-400">{text}</span>
      </div>
    );
  }
  if (type === 'blue') {
    return (
      <div className="flex items-center gap-2 py-1.5 border-l-2 border-sky-500 pl-3">
        <span className="font-mono text-sm font-semibold text-sky-400">{text}</span>
      </div>
    );
  }
  if (type === 'zinc-date') {
    return (
      <div className="flex items-center gap-2 py-1.5 border-l-2 border-zinc-600 pl-3">
        <span className="font-mono text-sm text-zinc-400">{text}</span>
      </div>
    );
  }
  // bullet
  return (
    <div className="flex items-start gap-2 py-1 px-1">
      <span className="text-zinc-600 mt-1 shrink-0">•</span>
      <span className="font-mono text-sm text-zinc-300 flex-1">{text}</span>
      <span className={`text-xs font-mono px-1.5 py-0.5 rounded shrink-0 self-start mt-0.5 ${TOPIC_COLORS[topic] ?? TOPIC_COLORS['General']}`}>
        {topic}
      </span>
    </div>
  );
}

function UpdateContent({ update, topic }: { update: Update; topic: string }) {
  const content = update.content;
  const structured = hasEmojiMarkers(content);

  return (
    <div className="px-4 py-4">
      <p className="text-zinc-600 text-xs font-mono mb-3">{formatDate(update.created_at)}</p>

      {structured ? (
        <div className="space-y-0.5">
          {parseContentLines(content).map((line, i) => (
            <ContentLine key={i} type={line.type} text={line.text} topic={topic} />
          ))}
        </div>
      ) : (
        <p className="font-mono text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      )}

      {update.source_link && (
        <a
          href={update.source_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-amber-400 text-xs font-mono hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          ↗ {update.source_link}
        </a>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ThreadCard({ thread }: { thread: Thread }) {
  const [expanded, setExpanded] = useState(false);
  const topicColor = TOPIC_COLORS[thread.topic] ?? TOPIC_COLORS['General'];
  const latestUpdate = thread.updates[0];

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      {/* Collapsible header */}
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/40 transition-colors group"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {/* Topic pill */}
        <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ${topicColor}`}>
          {thread.topic}
        </span>

        {/* Title */}
        <h3 className="font-mono text-zinc-100 font-semibold text-sm flex-1 text-left">
          {thread.title}
        </h3>

        {/* Update count */}
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
          {thread.updates.length}
        </span>

        {/* Timestamp */}
        {latestUpdate && (
          <span className="text-xs font-mono text-zinc-600 shrink-0 hidden sm:block">
            {formatDate(latestUpdate.created_at)}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
          {thread.updates.length === 0 ? (
            <div className="px-4 py-4 text-zinc-600 font-mono text-xs">No updates yet</div>
          ) : (
            thread.updates.map(update => (
              <UpdateContent key={update.id} update={update} topic={thread.topic} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [activeTopic, setActiveTopic] = useState('OIC');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      <Sidebar activeTopic={activeTopic} onTopicChange={(topic) => { setActiveTopic(topic); }} />

      {/* Main content */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3 flex items-center gap-3">
          {/* spacer for mobile hamburger */}
          <div className="w-7 lg:hidden" />
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
            <div className="space-y-3">
              {threads.map(thread => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
