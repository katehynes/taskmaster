import { useState, useCallback } from 'react';
import { Calendar } from './components/Calendar';
import { DayTaskList } from './components/DayTaskList';
import { SettingsDialog } from './components/SettingsDialog';
import { useTasksForDate } from './hooks/useTasksForDate';
import { useBackendStatus } from './hooks/useBackendStatus';
import { toISODate } from './utils/dateUtils';
import * as api from './api/tasksApi';
import './App.css';

function App() {
  const today = toISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const { tasks, loading, error, refetch } = useTasksForDate(selectedDate);
  const backendOk = useBackendStatus();

  const [actionError, setActionError] = useState<string | null>(null);

  const handleToggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      setActionError(null);
      try {
        await api.updateTask(id, { completed });
        refetch();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Failed to update');
      }
    },
    [refetch]
  );

  const handleEditTask = useCallback(
    async (
      id: string,
      updates: { title?: string; notes?: string | null; forDate?: string }
    ) => {
      setActionError(null);
      try {
        await api.updateTask(id, updates);
        refetch();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Failed to update');
      }
    },
    [refetch]
  );

  const handleAddTask = useCallback(() => {
    setAddModalOpen(true);
    setAddModalDate(selectedDate);
  }, [selectedDate]);

  const handleDeleteTask = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        await api.deleteTask(id);
        refetch();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Failed to delete');
      }
    },
    [refetch]
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState(selectedDate);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCloseAddModal = useCallback(() => {
    setAddModalOpen(false);
    refetch();
  }, [refetch]);

  return (
    <div className="app">
      {backendOk === false && (
        <div className="app-backend-warning">
          Backend not responding. Tasks won&apos;t be saved. Start it with{' '}
          <code>cd backend && npm run dev</code>
        </div>
      )}
      <header className="app-header">
        <h1 className="app-title">Taskmaster</h1>
        <div className="app-header-actions">
          <button
            type="button"
            className="app-settings"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
          >
            ⚙
          </button>
          <button
            type="button"
            className="app-new-task"
            onClick={() => {
              setAddModalDate(selectedDate);
              setAddModalOpen(true);
            }}
          >
            New task
          </button>
        </div>
      </header>

      <main className="app-main">
        <aside className="app-calendar">
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </aside>
        <section className="app-day-panel">
          {(error || actionError) && (
            <p className="app-error">{error || actionError}</p>
          )}
          {loading ? (
            <p className="app-loading">Loading…</p>
          ) : (
            <DayTaskList
              date={selectedDate}
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </section>
      </main>

      {addModalOpen && (
        <NewTaskModal
          defaultDate={addModalDate}
          onClose={handleCloseAddModal}
          onCreated={handleCloseAddModal}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          onClose={() => setSettingsOpen(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}

interface NewTaskModalProps {
  defaultDate: string;
  onClose: () => void;
  onCreated: () => void;
}

function NewTaskModal({ defaultDate, onClose, onCreated }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createTask({
        title: title.trim(),
        forDate: date,
        notes: notes.trim() || null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New task</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !title.trim()}>
              {saving ? 'Adding…' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
