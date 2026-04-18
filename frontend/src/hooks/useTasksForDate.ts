import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import * as api from '../api/tasksApi';
import { useAuth } from '../auth/AuthContext';

export function useTasksForDate(date: string) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await api.getTasksByRange({ forDate: date });
      setTasks(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [date, token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tasks, loading, error, refetch };
}
