'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';

type Assignment = {
  id: string;
  project_id: string;
  agent: string;
  action_type: string;
  title: string;
  detail: string | null;
  status: string;
  created_at: string;
  project_name: string | null;
  project_deadline: string | null;
};

type Attachment = {
  id: string;
  assignment_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  public_url: string;
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'agent' | 'topic'>('agent');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assignment/${assignmentId}`);
        if (!res.ok) throw new Error('Failed to fetch assignment');
        const data = await res.json();
        setAssignment(data.assignment);
        setAttachments(data.attachments || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [assignmentId]);

  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-zinc-100">
      <Sidebar activeItem={activeItem} viewMode={viewMode} onItemChange={setActiveItem} onViewModeChange={setViewMode} />

      <div className="flex-1 lg:ml-60">
        <header className="sticky top-0 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 z-10 px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/projects/proj-gmba" className="text-zinc-400 hover:text-zinc-100 transition-colors">←</a>
            <div>
              <h2 className="font-mono text-sm text-zinc-300">📝 Assignment Preview</h2>
              <p className="text-zinc-600 text-xs font-mono">Shareable assignment page</p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-500 font-mono text-sm animate-pulse">Loading assignment...</div>
          ) : !assignment ? (
            <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6 text-red-400 font-mono text-sm">Assignment not found</div>
          ) : (
            <>
              <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-zinc-500">{assignment.project_name || 'Assignment'}</p>
                    <h1 className="text-xl font-mono font-bold text-zinc-100 mt-1">{assignment.title}</h1>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full border border-blue-500/30 text-blue-300 bg-blue-500/10">
                    {assignment.status}
                  </span>
                </div>

                {assignment.detail && (
                  <p className="text-sm font-mono text-zinc-300 leading-relaxed">{assignment.detail}</p>
                )}

                <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-500">
                  <span>Agent: {assignment.agent}</span>
                  <span>Type: {assignment.action_type}</span>
                  <span>Created: {new Date(assignment.created_at).toLocaleString()}</span>
                  {assignment.project_deadline && <span>Project deadline: {new Date(assignment.project_deadline).toLocaleDateString()}</span>}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm text-green-400">Attachments</h3>
                  <span className="text-xs font-mono text-zinc-500">{attachments.length} file(s)</span>
                </div>

                {attachments.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-zinc-500 font-mono text-sm">No attachments uploaded yet</div>
                ) : (
                  attachments.map((attachment) => (
                    <div key={attachment.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-mono text-zinc-200">{attachment.filename}</p>
                          <p className="text-xs font-mono text-zinc-500">
                            {attachment.mime_type} • {Math.round(attachment.file_size / 1024)} KB • {new Date(attachment.created_at).toLocaleString()}
                          </p>
                        </div>
                        <a href={attachment.public_url} target="_blank" className="text-xs font-mono text-blue-300 hover:text-blue-200 underline underline-offset-2">Open file</a>
                      </div>

                      {attachment.mime_type === 'video/mp4' ? (
                        <video controls preload="metadata" className="w-full rounded-lg border border-zinc-800 bg-black">
                          <source src={attachment.public_url} type="video/mp4" />
                        </video>
                      ) : (
                        <div className="text-xs font-mono text-zinc-500">Inline preview not available for this file type.</div>
                      )}
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}