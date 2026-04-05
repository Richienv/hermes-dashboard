'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

type Project = {
  id: string;
  name: string;
  status: string;
  completion: number;
  assigned_agents: string;
  next_action: string | null;
  end_goal: string | null;
  success_criteria: string | null;
  deadline: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  'IN PROGRESS': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'BLOCKED': 'bg-red-500/20 text-red-400 border-red-500/30',
  'DONE': 'bg-green-500/20 text-green-400 border-green-500/30',
};

const AGENT_COLORS: Record<string, string> = {
  ARIA: '#8B5CF6',
  GHOST: '#10B981',
  SCHOLAR: '#3B82F6',
  ICARUS: '#F59E0B',
  DAEDALUS: '#06B6D4',
  HEPHAESTUS: '#EF4444',
  PROMETHEUS: '#F97316',
  ATLAS: '#84CC16',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'agent' | 'topic'>('agent');
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const filteredProjects = filter === 'All'
    ? projects
    : projects.filter(p => p.status === filter);

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
                📁 <span className="text-amber-400">Projects</span>
              </h2>
              <p className="text-zinc-600 text-xs font-mono">{projects.length} project(s)</p>
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 mt-3">
            {['All', 'IN PROGRESS', 'BLOCKED', 'DONE'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === f
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-zinc-600 font-mono text-sm animate-pulse">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-zinc-600 font-mono text-sm">No projects yet</p>
              <p className="text-zinc-700 font-mono text-xs">Projects will appear here when created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map(project => {
                const agents = project.assigned_agents ? project.assigned_agents.split(',') : [];
                return (
                  <a
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-mono text-zinc-100 font-semibold text-base">{project.name}</h3>
                        <p className="text-zinc-500 text-xs font-mono mt-0.5">ID: {project.id}</p>
                      </div>
                      <span className={`text-xs font-mono px-3 py-1 rounded-full border ${STATUS_STYLES[project.status] || 'bg-zinc-700/20 text-zinc-400 border-zinc-600/30'}`}>
                        {project.status}
                      </span>
                    </div>

                    {/* End goal preview */}
                    {project.end_goal && (
                      <div className="mb-4">
                        <span className="text-xs font-mono text-zinc-500 block mb-1">End Goal</span>
                        <p className="text-sm font-mono text-zinc-400 line-clamp-2">{project.end_goal}</p>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-zinc-500">Progress</span>
                        <span className="text-xs font-mono text-zinc-400">{project.completion}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.status === 'DONE' ? 'bg-green-500' :
                            project.status === 'BLOCKED' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${project.completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned agents */}
                    <div className="mb-4">
                      <span className="text-xs font-mono text-zinc-500 block mb-2">Assigned Agents</span>
                      <div className="flex flex-wrap gap-2">
                        {agents.map((agent: string) => (
                          <span
                            key={agent}
                            className="text-xs font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 flex items-center gap-1.5"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: AGENT_COLORS[agent.trim()] || '#6B7280' }}
                            />
                            {agent.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Next action */}
                    {project.next_action && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <span className="text-xs font-mono text-amber-400 block mb-1">Next Action</span>
                        <p className="text-sm font-mono text-zinc-200">{project.next_action}</p>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
