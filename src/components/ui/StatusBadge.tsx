import clsx from 'clsx';
import type { TaskStatus } from '@/hooks/useTasks';

const config: Record<TaskStatus, { label: string; classes: string }> = {
  'todo':        { label: 'To Do',       classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  'in-progress': { label: 'In Progress', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  'done':        { label: 'Done',        classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, classes } = config[status];
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', classes)}>
      {label}
    </span>
  );
}
