import { useState } from 'react';
import type { Task } from '../types';
import './DayTaskList.css';

interface DayTaskListProps {
  date: string;
  tasks: Task[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onEditTask: (id: string, updates: { title?: string; notes?: string | null; forDate?: string | null }) => void;
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
}

function formatDisplayDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DayTaskList({
  date,
  tasks,
  onToggleComplete,
  onEditTask,
  onAddTask,
  onDeleteTask,
}: DayTaskListProps) {
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
        <h2 className="day-task-list-title">{formatDisplayDate(date)}</h2>
        <button type="button" className="day-task-list-add" onClick={onAddTask}>
          Add Task
        </button>
      </div>

      <div className="day-task-list-content">
        {sorted.length === 0 && (
          <p className="day-task-list-empty">No tasks for this day.</p>
        )}

        {sorted.length > 0 && (
          <ul className="day-task-list-items">
            {sorted.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                listDate={date}
                editingId={editingId}
                setEditingId={setEditingId}
                expandedNotes={expandedNotes}
                toggleNotes={toggleNotes}
                onToggleComplete={onToggleComplete}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  listDate: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  expandedNotes: Set<string>;
  toggleNotes: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEditTask: (id: string, updates: { title?: string; notes?: string | null; forDate?: string | null }) => void;
  onDeleteTask: (id: string) => void;
}

function TaskRow({
  task,
  listDate,
  editingId,
  setEditingId,
  expandedNotes,
  toggleNotes,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
}: TaskRowProps) {
  const isEditing = editingId === task.id;
  const hasNotes = task.notes != null && task.notes.trim() !== '';
  const notesExpanded = expandedNotes.has(task.id);

  return (
    <li className={`day-task-item ${task.completed ? 'day-task-item--completed' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => onToggleComplete(task.id, e.target.checked)}
        className="day-task-checkbox"
        aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="day-task-body">
        {isEditing ? (
          <TaskEditForm
            task={task}
            listDate={listDate}
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
            {hasNotes && (
              <div className="day-task-notes">
                <button
                  type="button"
                  className="day-task-notes-toggle"
                  onClick={() => toggleNotes(task.id)}
                >
                  {notesExpanded ? 'Hide notes' : 'Show notes'}
                </button>
                {notesExpanded && <p className="day-task-notes-text">{task.notes}</p>}
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
  );
}

function TaskEditForm({
  task,
  listDate,
  onSave,
  onCancel,
}: {
  task: Task;
  /** The day this list is for (used if the task has no date yet). */
  listDate: string;
  onSave: (updates: {
    title?: string;
    notes?: string | null;
    forDate?: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [outstanding, setOutstanding] = useState(task.forDate == null);
  const [scheduleDate, setScheduleDate] = useState(task.forDate ?? listDate);

  return (
    <form
      className="day-task-edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title,
          notes: notes.trim() || null,
          forDate: outstanding ? null : scheduleDate,
        });
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
      <label className="day-task-edit-checkbox">
        <input
          type="checkbox"
          checked={outstanding}
          onChange={(e) => {
            setOutstanding(e.target.checked);
            if (!e.target.checked && !scheduleDate) {
              setScheduleDate(listDate);
            }
          }}
        />
        Outstanding (no specific day)
      </label>
      {!outstanding && (
        <label className="day-task-edit-date-label">
          Scheduled date
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="day-task-edit-date"
          />
        </label>
      )}
      <p className="day-task-edit-date-hint">
        Change the date to move this task to another day, or mark as outstanding to remove it from
        the calendar.
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
