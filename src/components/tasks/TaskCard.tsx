'use client';
import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Task, TaskStatus } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(task._id, { title, description, status });
      setEditing(false);
    } catch { /* error handled by parent */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    try { await onDelete(task._id); } catch { setDeleting(false); }
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setEditing(false);
  };

  return (
    <div className="card group animate-slide-up transition-shadow hover:shadow-md" style={{ borderColor: 'var(--border)' }}>
      {editing ? (
        <div className="flex flex-col gap-3">
          <input
            className="input-base font-medium"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            maxLength={120}
          />
          <textarea
            className="input-base resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            maxLength={1000}
          />
          <select
            className="input-base"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className="btn-ghost text-xs px-3 py-1.5">
              <X size={14} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !title.trim()} className="btn-primary text-xs px-3 py-1.5">
              <Check size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-snug truncate" style={{ color: 'var(--text)' }}>{task.title}</p>
              {task.description && (
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => setEditing(true)} className="btn-ghost p-1.5 text-xs rounded-md" title="Edit">
                <Pencil size={13} />
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn-ghost p-1.5 text-xs rounded-md hover:text-red-500" title="Delete">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <StatusBadge status={task.status} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
