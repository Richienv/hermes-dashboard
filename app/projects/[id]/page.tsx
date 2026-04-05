'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';

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

type Action = {
  id: string;
  project_id: string;
  agent: string;
  action_type: string;
  title: string;
  detail: string | null;
  status: string;
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

const ACTION_TYPE_COLORS: Record<string, string> = {
  RESEARCH: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  BUILD: 'bg-green-500/20 text-green-400 border-green-500/30',
  DECISION: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BLOCKER: 'bg-red-500/20 text-red-400 border-red-500/30',
  MILESTONE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const STATUS_DOT: Record<string, string> = {
  DONE: 'bg-green-500',
  'IN PROGRESS': 'bg-yellow-500',
  FAILED: 'bg-red-500',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'agent' | 'topic'>('agent');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/project/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProject(data.project);
      setActions(data.actions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const agents = project?.assigned_agents ? project.assigned_agents.split(',') : [];

  // Blockers: FAILED actions or BLOCKER type that are IN PROGRESS
  const blockers = actions.filter(
    a => a.status === 'FAILED' || (a.action_type === 'BLOCKER' && a.status === 'IN PROGRESS')
  );

  // Active actions: IN PROGRESS
  const inProgressActions = actions.filter(a => a.status === 'IN PROGRESS');

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
        <Sidebar activeItem={activeItem} viewMode={viewMode} onItemChange={setActiveItem} onViewModeChange={setViewMode} />
        <div className="flex-1 lg:ml-60 flex items-center justify-center">
          <p className="text-zinc-500 font-mono text-sm animate-pulse">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
        <Sidebar activeItem={activeItem} viewMode={viewMode} onItemChange={setActiveItem} onViewModeChange={setViewMode} />
        <div className="flex-1 lg:ml-60 flex items-center justify-center">
          <p className="text-red-400 font-mono text-sm">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      <Sidebar activeItem={activeItem} viewMode={viewMode} onItemChange={setActiveItem} onViewModeChange={setViewMode} />

      <div className="flex-1 lg:ml-60">
        {/* Header bar */}
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/projects" className="text-zinc-400 hover:text-zinc-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h2 className="font-mono text-sm text-zinc-300">
                📁 <span className="text-amber-400">{project.name}</span>
              </h2>
              <p className="text-zinc-600 text-xs font-mono">Project Detail</p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          {/* SECTION 1: PROJECT HEADER */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-mono text-zinc-100 font-bold text-xl">{project.name}</h1>
              <span className={`text-xs font-mono px-3 py-1 rounded-full border ${STATUS_STYLES[project.status] || 'bg-zinc-700/20 text-zinc-400 border-zinc-600/30'}`}>
                {project.status}
              </span>
            </div>

            {project.end_goal && (
              <div className="mb-4">
                <span className="text-xs font-mono text-zinc-500 block mb-1">End Goal</span>
                <p className="text-sm font-mono text-zinc-300 leading-relaxed">{project.end_goal}</p>
              </div>
            )}

            {project.success_criteria && (
              <div className="mb-4">
                <span className="text-xs font-mono text-zinc-500 block mb-1">Success Criteria</span>
                <p className="text-sm font-mono text-zinc-300">{project.success_criteria}</p>
              </div>
            )}

            {project.deadline && (
              <div className="mb-4">
                <span className="text-xs font-mono text-zinc-500 block mb-1">Deadline</span>
                <p className="text-sm font-mono text-zinc-300">
                  {new Date(project.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
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
            <div>
              <span className="text-xs font-mono text-zinc-500 block mb-2">Assigned Agents</span>
              <div className="flex flex-wrap gap-2">
                {agents.map(agent => (
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
          </div>

          {/* SECTION 3: ACTIVE BLOCKERS */}
          {blockers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-mono text-sm text-red-400 flex items-center gap-2">
                <span>⚠️</span> Needs Attention
              </h3>
              {blockers.map(action => (
                <div key={action.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: AGENT_COLORS[action.agent] || '#6B7280' }}
                    />
                    <span className="text-xs font-mono text-zinc-400">{action.agent}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${ACTION_TYPE_COLORS[action.action_type] || 'bg-zinc-700/20 text-zinc-400 border-zinc-600/30'}`}>
                      {action.action_type}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[action.status] || 'bg-zinc-500'}`} />
                    <span className="text-xs font-mono text-zinc-500">{action.status}</span>
                  </div>
                  <p className="text-sm font-mono text-zinc-200">{action.title}</p>
                  {action.detail && <p className="text-xs font-mono text-zinc-400 mt-1">{action.detail}</p>}
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4: NEXT ACTIONS */}
          {(project.next_action || inProgressActions.length > 0) && (
            <div className="space-y-3">
              <h3 className="font-mono text-sm text-amber-400 flex items-center gap-2">
                <span>→</span> Next Actions
              </h3>
              {project.next_action && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <span className="text-xs font-mono text-amber-400 block mb-1">Queued</span>
                  <p className="text-sm font-mono text-zinc-200">{project.next_action}</p>
                </div>
              )}
              {inProgressActions.map(action => (
                <div key={action.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: AGENT_COLORS[action.agent] || '#6B7280' }}
                    />
                    <span className="text-xs font-mono text-zinc-400">{action.agent}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${ACTION_TYPE_COLORS[action.action_type] || 'bg-zinc-700/20 text-zinc-400 border-zinc-600/30'}`}>
                      {action.action_type}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-xs font-mono text-yellow-400">IN PROGRESS</span>
                  </div>
                  <p className="text-sm font-mono text-zinc-200">{action.title}</p>
                  {action.detail && <p className="text-xs font-mono text-zinc-400 mt-1">{action.detail}</p>}
                </div>
              ))}
            </div>
          )}

          {/* SECTION 2: TIMELINE */}
          <div className="space-y-3">
            <h3 className="font-mono text-sm text-zinc-400">Timeline</h3>
            {actions.length === 0 ? (
              <p className="text-zinc-600 font-mono text-xs">No actions recorded yet</p>
            ) : (
              <div className="space-y-3">
                {actions.map(action => (
                  <div key={action.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: AGENT_COLORS[action.agent] || '#6B7280' }}
                      />
                      <span className="text-xs font-mono text-zinc-400">{action.agent}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${ACTION_TYPE_COLORS[action.action_type] || 'bg-zinc-700/20 text-zinc-400 border-zinc-600/30'}`}>
                        {action.action_type}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[action.status] || 'bg-zinc-500'}`} />
                      <span className="text-xs font-mono text-zinc-500">{action.status}</span>
                      <span className="text-xs font-mono text-zinc-600 ml-auto">
                        {new Date(action.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-zinc-200">{action.title}</p>
                    {action.detail && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {expandedAction === action.id ? '▾ Hide detail' : '▸ Show detail'}
                        </button>
                        {expandedAction === action.id && (
                          <p className="text-xs font-mono text-zinc-400 mt-1 leading-relaxed">{action.detail}</p>
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
    </div>
  );
}
