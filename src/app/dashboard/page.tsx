'use client';
import { useState } from 'react';
import { Plus, Search, SlidersHorizontal, RefreshCw, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { Navbar } from '@/components/layout/Navbar';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
] as const;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { tasks, pagination, loading, error, filters, updateFilter, createTask, updateTask, deleteTask } = useTasks();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Navbar userName={user?.name} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {user ? `Hey, ${user.name.split(' ')[0]} 👋` : 'My Tasks'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {pagination ? `${pagination.total} task${pagination.total !== 1 ? 's' : ''} total` : 'Loading…'}
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} />
            New Task
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="search"
              className="input-base pl-9"
              placeholder="Search tasks…"
              value={filters.search ?? ''}
              onChange={(e) => updateFilter({ search: e.target.value || undefined })}
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => updateFilter({ status: tab.key as any })}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                style={{
                  background: filters.status === tab.key ? 'var(--surface)' : 'transparent',
                  color: filters.status === tab.key ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: filters.status === tab.key ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-28 animate-pulse" style={{ background: 'var(--surface-2)' }} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={() => updateFilter({})} className="btn-ghost text-sm gap-2">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <ClipboardList size={36} style={{ color: 'var(--border)' }} />
            <p className="font-medium text-sm">No tasks found</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {filters.search || filters.status !== 'all' ? 'Try adjusting your filters' : 'Create your first task to get started'}
            </p>
            {(!filters.search && filters.status === 'all') && (
              <button onClick={() => setShowModal(true)} className="btn-primary text-sm mt-1">
                <Plus size={15} /> Create Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => updateFilter({ page: filters.page! - 1 })}
              className="btn-ghost text-sm disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => updateFilter({ page: filters.page! + 1 })}
              className="btn-ghost text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <CreateTaskModal onClose={() => setShowModal(false)} onCreate={createTask} />
      )}
    </>
  );
}
