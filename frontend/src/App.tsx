import { useState, useCallback } from 'react';
import { Calendar } from './components/Calendar';
import { DayTaskList } from './components/DayTaskList';
import { OutstandingTaskList } from './components/OutstandingTaskList';
import { SettingsDialog } from './components/SettingsDialog';
import { LoginScreen } from './components/LoginScreen';
import { useTasksForDate } from './hooks/useTasksForDate';
import { useOutstandingTasks } from './hooks/useOutstandingTasks';
import { useBackendStatus } from './hooks/useBackendStatus';
import { useAuth } from './auth/AuthContext';
import { toISODate } from './utils/dateUtils';
import * as api from './api/tasksApi';
import './App.css';

function App() {
  const { user, loading: authLoading, logout } = useAuth();

  if (authLoading) {
    return (
      <div className="app">
        <p className="app-loading">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <TaskmasterApp onLogout={logout} />;
}

interface TaskmasterAppProps {
  onLogout: () => void;
}

function TaskmasterApp({ onLogout }: TaskmasterAppProps) {
  const today = toISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeView, setActiveView] = useState<'day' | 'calendar' | 'outstanding'>('day');
  const { tasks, loading, error, refetch: refetchDayTasks } = useTasksForDate(selectedDate);
  const {
    tasks: outstandingTasks,
    loading: outstandingLoading,
    error: outstandingError,
    refetch: refetchOutstanding,
  } = useOutstandingTasks();
  const backendOk = useBackendStatus();

  const refetchAll = useCallback(() => {
    refetchDayTasks();
    refetchOutstanding();
  }, [refetchDayTasks, refetchOutstanding]);

  const [actionError, setActionError] = useState<string | null>(null);

  const handleToggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      setActionError(null);
      try {
        await api.updateTask(id, { completed });
        refetchAll();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Failed to update');
      }
    },
    [refetchAll]
  );

  const handleEditTask = useCallback(
    async (
      id: string,
      updates: { title?: string; notes?: string | null; forDate?: string | null }
    ) => {
      setActionError(null);
      try {
        await api.updateTask(id, updates);
        refetchAll();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Failed to update');
      }
    },
    [refetchAll]
  );

  const handleAddTask = useCallback(() => {
    setAddModalOpen(true);
    setAddModalDate(selectedDate);
    setAddModalOutstanding(false);
    setAddModalAllowOutstandingOption(false);
  }, [selectedDate]);

  const handleDeleteTask = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        await api.deleteTask(id);
        refetchAll();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Failed to delete');
      }
    },
    [refetchAll]
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState(selectedDate);
  const [addModalOutstanding, setAddModalOutstanding] = useState(false);
  /** When false (Day list “Add Task” only), the modal hides Outstanding and always uses the date field. */
  const [addModalAllowOutstandingOption, setAddModalAllowOutstandingOption] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCloseAddModal = useCallback(() => {
    setAddModalOpen(false);
    refetchAll();
  }, [refetchAll]);

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
            className="app-logout"
            onClick={onLogout}
          >
            Sign Out
          </button>
          <button
            type="button"
            className="app-new-task"
            onClick={() => {
              setAddModalDate(selectedDate);
              setAddModalOutstanding(activeView === 'outstanding');
              setAddModalAllowOutstandingOption(true);
              setAddModalOpen(true);
            }}
          >
            New Task
          </button>
        </div>
      </header>

      <main className="app-main app-main--full">
        <section className="app-content">
          {(error || outstandingError || actionError) && (
            <p className="app-error">{error || outstandingError || actionError}</p>
          )}

          {activeView === 'calendar' ? (
            <div className="app-calendar-screen">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setActiveView('day');
                }}
              />
            </div>
          ) : activeView === 'outstanding' ? (
            outstandingLoading ? (
              <p className="app-loading">Loading…</p>
            ) : (
              <OutstandingTaskList
                tasks={outstandingTasks}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onAddTask={() => {
                  setAddModalDate(selectedDate);
                  setAddModalOutstanding(true);
                  setAddModalAllowOutstandingOption(true);
                  setAddModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
              />
            )
          ) : loading ? (
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

      <nav className="app-bottom-nav" aria-label="Primary navigation">
        <button
          type="button"
          className={`app-bottom-nav-item ${activeView === 'day' ? 'is-active' : ''}`}
          onClick={() => setActiveView('day')}
        >
          Day
        </button>
        <button
          type="button"
          className={`app-bottom-nav-item ${activeView === 'calendar' ? 'is-active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          Calendar
        </button>
        <button
          type="button"
          className={`app-bottom-nav-item ${activeView === 'outstanding' ? 'is-active' : ''}`}
          onClick={() => setActiveView('outstanding')}
        >
          Outstanding
        </button>
      </nav>

      {addModalOpen && (
        <NewTaskModal
          defaultDate={addModalDate}
          defaultOutstanding={addModalOutstanding}
          allowOutstandingOption={addModalAllowOutstandingOption}
          onClose={handleCloseAddModal}
          onCreated={handleCloseAddModal}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          onClose={() => setSettingsOpen(false)}
          onSaved={refetchAll}
        />
      )}
    </div>
  );
}

interface NewTaskModalProps {
  defaultDate: string;
  defaultOutstanding: boolean;
  /** When false, hide Outstanding and always schedule using the date field (Day view). */
  allowOutstandingOption: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function NewTaskModal({
  defaultDate,
  defaultOutstanding,
  allowOutstandingOption,
  onClose,
  onCreated,
}: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [outstanding, setOutstanding] = useState(defaultOutstanding);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const forDate =
        allowOutstandingOption && outstanding ? null : date;
      await api.createTask({
        title: title.trim(),
        forDate,
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
          {allowOutstandingOption && (
            <label className="modal-checkbox-row">
              <input
                type="checkbox"
                checked={outstanding}
                onChange={(e) => setOutstanding(e.target.checked)}
              />
              Outstanding (no specific day)
            </label>
          )}
          {(!allowOutstandingOption || !outstanding) && (
            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          )}
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

