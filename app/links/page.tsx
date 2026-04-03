'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type LinkItem = {
  id: string;
  url: string;
  title: string;
  summary?: string;
  topic?: string;
  created_at: string;
};

const TOPICS = ['All', 'OIC', 'ERP', 'Personal', 'General'];

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeTopic, setActiveTopic] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      setLoading(true);
      try {
        const res = await fetch('/api/links');
        if (res.ok) {
          const data = await res.json();
          setLinks(data);
        }
      } catch (err) {
        console.error('Failed to fetch links:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLinks();
  }, []);

  const filtered = activeTopic === 'All'
    ? links
    : links.filter(l => l.topic === activeTopic);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateUrl = (url: string, maxLen = 50) => {
    return url.length > maxLen ? url.slice(0, maxLen) + '...' : url;
  };

  const topicColor = (topic?: string) => {
    switch (topic) {
      case 'OIC': return 'bg-blue-500/20 text-blue-400';
      case 'ERP': return 'bg-purple-500/20 text-purple-400';
      case 'Personal': return 'bg-green-500/20 text-green-400';
      case 'General': return 'bg-zinc-500/20 text-zinc-400';
      default: return 'bg-zinc-700/20 text-zinc-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="text-zinc-500 hover:text-amber-400 transition-colors font-mono text-sm flex items-center gap-1"
          >
            ← Back
          </Link>
          <div>
            <h1 className="font-mono text-amber-400 font-bold text-sm">🔗 LINKS</h1>
            <p className="text-zinc-600 text-xs font-mono">{filtered.length} link(s)</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Topic filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={`px-3 py-1.5 rounded-full font-mono text-xs transition-colors
                ${activeTopic === topic
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-zinc-700/50'
                }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Links grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-zinc-600 font-mono text-sm">No links{activeTopic !== 'All' ? ` in ${activeTopic}` : ''}</p>
              <p className="text-zinc-700 font-mono text-xs mt-1">POST /api/link to add one</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(link => (
              <div
                key={link.id}
                className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 transition-colors flex flex-col gap-3"
              >
                {/* Title */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-amber-400 hover:text-amber-300 font-semibold transition-colors leading-snug"
                >
                  {link.title} ↗
                </a>

                {/* URL */}
                <p className="text-zinc-600 text-xs font-mono break-all">
                  {truncateUrl(link.url)}
                </p>

                {/* Summary */}
                {link.summary && (
                  <p className="text-zinc-400 text-xs leading-relaxed flex-1">
                    {link.summary}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800">
                  {link.topic ? (
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${topicColor(link.topic)}`}>
                      {link.topic}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-zinc-700 text-xs font-mono">{formatDate(link.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
