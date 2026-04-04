'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Action = {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
};

const AGENTS = [
  'ARIA', 'GHOST', 'SCHOLAR', 'ICARUS', 'DAEDALUS',
  'HEPHAESTUS', 'PROMETHEUS', 'ATLAS'
];

const TOPICS = ['OIC', 'ERP', 'Personal', 'General', 'Diet & Fitness'];

type SidebarProps = {
  activeItem: string | null;
  viewMode: 'agent' | 'topic';
  onItemChange: (item: string) => void;
  onViewModeChange: (mode: 'agent' | 'topic') => void;
};

export default function Sidebar({ activeItem, viewMode, onItemChange, onViewModeChange }: SidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/actions/pending');
        if (res.ok) {
          const data: Action[] = await res.json();
          setPendingCount(data.filter((a) => a.status === 'pending').length);
        }
      } catch {
        // silently fail
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const isActionsActive = pathname === '/actions';
  const isProjectsActive = pathname === '/projects';
  const isArchiveActive = pathname === '/archive';
  const isLinksActive = pathname === '/links';

  const items = viewMode === 'agent' ? AGENTS : TOPICS;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-40 lg:hidden text-zinc-400 hover:text-zinc-100 p-1"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-zinc-950 border-r border-zinc-800 z-30 flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-5 border-b border-zinc-800">
          <h1 className="text-amber-400 font-mono text-lg font-bold tracking-tight">⚡ HERMES</h1>
          <p className="text-zinc-500 text-xs mt-1 font-mono">Intelligence Dashboard</p>
        </div>

        {/* View mode toggle */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => onViewModeChange('agent')}
              className={`flex-1 text-xs font-mono py-1.5 rounded-md transition-colors ${
                viewMode === 'agent'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Agent View
            </button>
            <button
              onClick={() => onViewModeChange('topic')}
              className={`flex-1 text-xs font-mono py-1.5 rounded-md transition-colors ${
                viewMode === 'topic'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Topic View
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* All Feed option */}
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-colors block ${
              pathname === '/' && !activeItem
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            {viewMode === 'agent' ? '📋 All Feed' : '📋 All Topics'}
          </Link>

          {/* Items list */}
          {items.map(item => (
            <button
              key={item}
              onClick={() => { onItemChange(item); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-colors ${
                activeItem === item
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              {viewMode === 'agent' && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: getAgentColor(item) }}
                />
              )}
              {item}
            </button>
          ))}

          <div className="pt-2 border-t border-zinc-800 mt-4 space-y-1">
            <Link
              href="/actions"
              onClick={() => setSidebarOpen(false)}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
                isActionsActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <span>⚡ Actions</span>
              {pendingCount > 0 && (
                <span className="ml-auto bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCount}
                </span>
              )}
            </Link>

            <Link
              href="/projects"
              onClick={() => setSidebarOpen(false)}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
                isProjectsActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              📁 Projects
            </Link>

            <Link
              href="/archive"
              onClick={() => setSidebarOpen(false)}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
                isArchiveActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              🗄️ Archive
            </Link>

            <Link
              href="/links"
              onClick={() => setSidebarOpen(false)}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-colors flex items-center gap-2 ${
                isLinksActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              🔗 Links
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <p className="text-zinc-600 text-xs font-mono">v2.0.0</p>
        </div>
      </aside>
    </>
  );
}

function getAgentColor(agent: string): string {
  const colors: Record<string, string> = {
    ARIA: '#8B5CF6',
    GHOST: '#10B981',
    SCHOLAR: '#3B82F6',
    ICARUS: '#F59E0B',
    DAEDALUS: '#06B6D4',
    HEPHAESTUS: '#EF4444',
    PROMETHEUS: '#F97316',
    ATLAS: '#84CC16',
    SYSTEM: '#6B7280',
  };
  return colors[agent] || colors.SYSTEM;
}
