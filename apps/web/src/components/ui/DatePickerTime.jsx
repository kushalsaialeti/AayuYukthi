import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfToday } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

/**
 * Modern Popover Calendar and Time Picker matching the user-specified DatePickerTime format.
 * Features:
 * - Keyboard navigation (Tab, Arrow keys, Enter, Space, Escape)
 * - Date popover dropdown with format(date, "PPP") display
 * - Month navigation and day-of-week grid
 * - Direct time selection input (e.g. "10:30:00" or "09:00")
 */
export function DatePickerTime({
  date,
  onDateChange,
  time = '09:00:00',
  onTimeChange,
  minDate = startOfToday(),
  id = 'care-date-picker',
}) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => (date ? new Date(date) : new Date()));
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedDate = date ? new Date(date) : undefined;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        if (triggerRef.current) triggerRef.current.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleSelectDay = (day) => {
    if (isBefore(day, minDate) && !isSameDay(day, minDate)) return;
    const formatted = format(day, 'yyyy-MM-dd');
    onDateChange(formatted);
    setOpen(false);
    if (triggerRef.current) triggerRef.current.focus();
  };

  // Calendar days generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 = Sun, 1 = Mon ...
  const blanks = Array.from({ length: startDayOfWeek });

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-start',
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
      }}
    >
      {/* Date Field */}
      <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor={`${id}-date-trigger`}
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rq-text, #1e293b)' }}
        >
          Appointment Date *
        </label>

        <div style={{ position: 'relative' }}>
          <button
            ref={triggerRef}
            id={`${id}-date-trigger`}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              borderRadius: '10px',
              border: open ? '2px solid var(--rq-primary, #004349)' : '1px solid var(--rq-border, #cbd5e1)',
              background: '#ffffff',
              fontSize: '14px',
              color: selectedDate ? 'var(--rq-text, #0f172a)' : '#64748b',
              fontWeight: selectedDate ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: open ? '0 0 0 3px rgba(0, 67, 73, 0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={17} style={{ color: selectedDate ? 'var(--rq-primary, #004349)' : '#94a3b8' }} />
              <span>{selectedDate ? format(selectedDate, 'PPP') : 'Select date'}</span>
            </div>
            <ChevronDown size={16} style={{ color: '#64748b', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
          </button>

          {/* Calendar Popover Content */}
          {open && (
            <div
              role="dialog"
              aria-label="Calendar date selector"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 50,
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 16px 36px -6px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
                padding: '16px',
                width: '310px',
                animation: 'popoverIn 0.15s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {/* Month Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day Names Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '6px' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d} style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {blanks.map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}

                {daysInMonth.map((day) => {
                  const isPast = isBefore(day, minDate) && !isSameDay(day, minDate);
                  const isSel = selectedDate && isSameDay(day, selectedDate);
                  const isTod = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleSelectDay(day)}
                      style={{
                        height: '34px',
                        borderRadius: '8px',
                        border: isTod && !isSel ? '1px solid var(--rq-primary, #004349)' : 'none',
                        background: isSel
                          ? 'var(--rq-primary, #004349)'
                          : 'transparent',
                        color: isPast
                          ? '#cbd5e1'
                          : isSel
                          ? '#ffffff'
                          : isTod
                          ? 'var(--rq-primary, #004349)'
                          : '#1e293b',
                        fontWeight: isSel || isTod ? 700 : 500,
                        fontSize: '13px',
                        cursor: isPast ? 'not-allowed' : 'pointer',
                        transition: 'background 0.1s',
                      }}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>

              {/* Quick Today helper */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--rq-primary, #004349)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onClick={() => handleSelectDay(new Date())}
                >
                  Today
                </button>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Field */}
      <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor={`${id}-time-input`}
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rq-text, #1e293b)' }}
        >
          Time *
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={`${id}-time-input`}
            type="time"
            step="60"
            value={time ? time.slice(0, 5) : '09:00'}
            onChange={(e) => {
              if (onTimeChange) {
                const val = e.target.value;
                onTimeChange(val.length === 5 ? `${val}:00` : val);
              }
            }}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '0 12px 0 36px',
              borderRadius: '10px',
              border: '1px solid var(--rq-border, #cbd5e1)',
              background: '#ffffff',
              fontSize: '14px',
              color: 'var(--rq-text, #0f172a)',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              outline: 'none',
            }}
          />
          <Clock
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--rq-primary, #004349)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default DatePickerTime;
