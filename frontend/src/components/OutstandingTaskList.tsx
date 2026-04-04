import { useState } from 'react';
import type { Task } from '../types';
import './DayTaskList.css';

interface OutstandingTaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onEditTask: (
    id: string,
    updates: { title?: string; notes?: string | null; forDate?: string | null }
  ) => void;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
}

export function OutstandingTaskList({
  tasks,
  onToggleComplete,
  onEditTask,
  onAddTask,
  onDeleteTask,
}: OutstandingTaskListProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...tasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="day-task-list">
      <div className="day-task-list-header">
        <h2 className="day-task-list-title">Outstanding</h2>
        <button type="button" className="day-task-list-add" onClick={onAddTask}>
          Add Task
        </button>
      </div>
      <p className="outstanding-task-list-hint">
        Tasks here are not tied to a calendar day. Schedule one to move it into Day and Calendar
        views.
      </p>

      <div className="day-task-list-content">
        {sorted.length === 0 && (
          <p className="day-task-list-empty">No outstanding tasks.</p>
        )}

        {sorted.length > 0 && (
          <ul className="day-task-list-items">
            {sorted.map((task) => (
              <li
                key={task.id}
                className={`day-task-item ${task.completed ? 'day-task-item--completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => onToggleComplete(task.id, e.target.checked)}
                  className="day-task-checkbox"
                  aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                />
                <div className="day-task-body">
                  {editingId === task.id ? (
                    <OutstandingEditForm
                      task={task}
                      onSave={(updates) => {
                        onEditTask(task.id, updates);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <span
                        className="day-task-title"
                        onClick={() => setEditingId(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingId(task.id)}
                        role="button"
                        tabIndex={0}
                      >
                        {task.title}
                      </span>
                      {task.notes != null && task.notes.trim() !== '' && (
                        <div className="day-task-notes">
                          <button
                            type="button"
                            className="day-task-notes-toggle"
                            onClick={() => toggleNotes(task.id)}
                          >
                            {expandedNotes.has(task.id) ? 'Hide notes' : 'Show notes'}
                          </button>
                          {expandedNotes.has(task.id) && (
                            <p className="day-task-notes-text">{task.notes}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="day-task-delete"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                  title="Delete task"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OutstandingEditForm({
  task,
  onSave,
  onCancel,
}: {
  task: Task;
  onSave: (updates: {
    title?: string;
    notes?: string | null;
    forDate?: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [scheduleFor, setScheduleFor] = useState('');

  return (
    <form
      className="day-task-edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        const payload: {
          title?: string;
          notes?: string | null;
          forDate?: string | null;
        } = {
          title,
          notes: notes.trim() || null,
        };
        if (scheduleFor.trim()) {
          payload.forDate = scheduleFor;
        }
        onSave(payload);
      }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="day-task-edit-title"
        autoFocus
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="day-task-edit-notes"
        placeholder="Notes (optional)"
        rows={2}
      />
      <label className="outstanding-assign-label">
        Schedule for
        <input
          type="date"
          value={scheduleFor}
          onChange={(e) => setScheduleFor(e.target.value)}
          className="outstanding-assign-date"
        />
      </label>
      <p className="outstanding-assign-help">
        Pick a date to move this task off Outstanding and onto that day.
      </p>
      <div className="day-task-edit-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
