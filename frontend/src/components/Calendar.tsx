import { useState } from 'react';
import {
  addMonths,
  getCalendarDays,
  formatMonthYear,
  toISODate,
  isSameDay,
} from '../utils/dateUtils';
import './Calendar.css';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const today = toISODate(new Date());
  const days = getCalendarDays(viewMonth);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar-title">{formatMonthYear(viewMonth)}</span>
        <button
          type="button"
          className="calendar-nav"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar-weekday">
            {d}
          </span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((date, i) => {
          if (date === null) {
            return <div key={`empty-${i}`} className="calendar-cell calendar-cell--empty" />;
          }
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button
              key={date}
              type="button"
              className={`calendar-cell calendar-cell--day ${isToday ? 'calendar-cell--today' : ''} ${isSelected ? 'calendar-cell--selected' : ''}`}
              onClick={() => onSelectDate(date)}
            >
              {new Date(date + 'T12:00:00').getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
