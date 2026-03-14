'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  _id: string; title: string; description: string;
  status: TaskStatus; createdAt: string; updatedAt: string;
}

interface Pagination {
  page: number; limit: number; total: number;
  totalPages: number; hasNextPage: boolean; hasPrevPage: boolean;
}

interface TaskFilters {
  page?: number; limit?: number; status?: TaskStatus | 'all'; search?: string;
}

export function useTasks(initialFilters: TaskFilters = {}) {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filters, setFilters]       = useState<TaskFilters>({ page: 1, limit: 10, status: 'all', ...initialFilters });
  const debounceRef                 = useRef<NodeJS.Timeout>();

  const fetchTasks = useCallback(async (f: TaskFilters) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (f.page)   params.set('page',   String(f.page));
      if (f.limit)  params.set('limit',  String(f.limit));
      if (f.status) params.set('status', f.status);
      if (f.search) params.set('search', f.search);

      const data = await apiClient.get<{ tasks: Task[]; pagination: Pagination }>(
        `/api/tasks?${params}`
      );
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchTasks(filters),
      filters.search !== undefined ? 400 : 0
    );
    return () => clearTimeout(debounceRef.current);
  }, [filters, fetchTasks]);

  const updateFilter = useCallback(
    (updates: Partial<TaskFilters>) =>
      setFilters((prev) => ({ ...prev, ...updates, page: updates.page ?? 1 })),
    []
  );

  const createTask = useCallback(async (data: { title: string; description?: string; status?: TaskStatus }) => {
    await apiClient.post('/api/tasks', data);
    await fetchTasks(filters);
  }, [filters, fetchTasks]);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    await apiClient.patch(`/api/tasks/${id}`, data);
    await fetchTasks(filters);
  }, [filters, fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    await apiClient.delete(`/api/tasks/${id}`);
    await fetchTasks(filters);
  }, [filters, fetchTasks]);

  return { tasks, pagination, loading, error, filters, updateFilter, createTask, updateTask, deleteTask, refetch: () => fetchTasks(filters) };
}
