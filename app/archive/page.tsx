'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

type DigestSummary = {
  id: string;
  digest_id: string;
  bullet_count: number;
  parsed_at: string;
  source: string;
};

type Bullet = {
  id: string;
  topic: string;
  title: string;
  body: string;
  section: string;
  urgency: string;
  source: string;
  created_at: string;
};

type DigestDetail = DigestSummary & {
  raw_text: string;
  bullets: Bullet[];
};

const SECTION_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  AKSI_HARI_INI: { label: 'AKSI HARI INI', color: 'text-red-400', emoji: '🔴' },
  MINGGU_INI:    { label: 'MINGGU INI',    color: 'text-yellow-400', emoji: '🟡' },
  DICATAT:       { label: 'DICATAT',       color: 'text-green-400', emoji: '🟢' },
  TEMUAN:        { label: 'TEMUAN',        color: 'text-blue-400', emoji: '🔍' },
  JADWAL:        { label: 'JADWAL',        color: 'text-purple-400', emoji: '📅' },
};

const SECTION_ORDER = ['AKSI_HARI_INI', 'MINGGU_INI', 'DICATAT', 'TEMUAN', 'JADWAL'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function topicColor(topic: string) {
  const map: Record<string, string> = {
    OIC:      'bg-blue-500/15 text-blue-300 border-blue-500/30',
    ERP:      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Personal: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    General:  'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  };
  return map[topic] ?? map['General'];
}

export default function ArchivePage() {
  const [digests, setDigests] = useState<DigestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, DigestDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/digest')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDigests(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleExpand(digestId: string) {
    if (expanded === digestId) {
      setExpanded(null);
      return;
    }
    setExpanded(digestId);
    if (details[digestId]) return;
    setDetailLoading(digestId);
    try {
      const res = await fetch(`/api/digest/${digestId}`);
      const data: DigestDetail = await res.json();
      setDetails(prev => ({ ...prev, [digestId]: data }));
    } catch {
      // silently fail
    }
    setDetailLoading(null);
  }

  function groupBulletsBySection(bullets: Bullet[]) {
    const grouped: Record<string, Bullet[]> = {};
    for (const b of bullets) {
      if (!b || !b.section) continue;
      if (!grouped[b.section]) grouped[b.section] = [];
      grouped[b.section].push(b);
    }
    return grouped;
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100 font-mono overflow-hidden">
      <Sidebar activeTopic={null} />

      <main className="flex-1 lg:ml-60 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-amber-400 tracking-tight">📁 Archive</h1>
            <p className="text-zinc-500 text-sm mt-1">Past Intelligence Digests</p>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-zinc-500 text-sm animate-pulse">Loading digests...</div>
          ) : digests.length === 0 ? (
            <div className="text-zinc-600 text-sm border border-zinc-800 rounded-lg p-6 text-center">
              No digests yet — run Intelligence Digest to populate
            </div>
          ) : (
            <div className="space-y-2">
              {digests.map(d => (
                <div key={d.digest_id} className="border border-zinc-800 rounded-lg overflow-hidden">
                  {/* Collapsed card */}
                  <button
                    onClick={() => toggleExpand(d.digest_id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors"
                  >
                    <span className="text-amber-400">📁</span>
                    <span className="text-zinc-100 flex-1 font-mono text-sm font-semibold">{d.digest_id}</span>
                    <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-full border border-zinc-700">
                      {d.bullet_count} bullets
                    </span>
                    <span className="text-zinc-500 text-xs">{formatDate(d.parsed_at)}</span>
                    <span className={`text-zinc-400 text-xs transition-transform ${expanded === d.digest_id ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {/* Expanded detail */}
                  {expanded === d.digest_id && (
                    <div className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-4">
                      {detailLoading === d.digest_id ? (
                        <div className="text-zinc-500 text-xs animate-pulse">Loading bullets...</div>
                      ) : details[d.digest_id] ? (
                        (() => {
                          const det = details[d.digest_id];
                          const validBullets = (det.bullets ?? []).filter(b => b && b.title);
                          const grouped = groupBulletsBySection(validBullets);
                          const hasBullets = Object.keys(grouped).length > 0;
                          return hasBullets ? (
                            <div className="space-y-4">
                              {SECTION_ORDER.filter(s => grouped[s]).map(sectionKey => {
                                const cfg = SECTION_CONFIG[sectionKey] ?? { label: sectionKey, color: 'text-zinc-400', emoji: '•' };
                                return (
                                  <div key={sectionKey}>
                                    <div className={`text-xs font-bold mb-2 ${cfg.color}`}>
                                      {cfg.emoji} {cfg.label}
                                    </div>
                                    <div className="space-y-1.5">
                                      {grouped[sectionKey].map(b => (
                                        <div key={b.id} className="flex items-start gap-2 text-xs">
                                          <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-bold ${topicColor(b.topic)}`}>
                                            {b.topic}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-zinc-200">{b.title}</span>
                                            {b.body && (
                                              <span className="text-zinc-500 ml-1">
                                                — {b.body.slice(0, 80)}{b.body.length > 80 ? '…' : ''}
                                              </span>
                                            )}
                                          </div>
                                          {b.source && b.source !== 'SYSTEM' && (
                                            <span className="shrink-0 text-zinc-600 text-[10px] border border-zinc-700 px-1 rounded">
                                              {b.source}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-zinc-600 text-xs">No bullet data linked to this digest.</div>
                          );
                        })()
                      ) : (
                        <div className="text-zinc-600 text-xs">Failed to load detail.</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
