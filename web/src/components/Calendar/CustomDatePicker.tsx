import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from './CustomDatePicker.module.css';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  onClose,
  isOpen
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onChange(format(date, 'yyyy-MM-dd'));
    onClose();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    onChange(format(today, 'yyyy-MM-dd'));
    onClose();
  };

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className={styles.overlay}>
      <div className={styles.picker} ref={pickerRef}>
        {/* 헤더 */}
        <div className={styles.header}>
          <button 
            className={styles.navButton} 
            onClick={handlePrevMonth}
            type="button"
          >
            ‹
          </button>
          <h3 className={styles.monthYear}>
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h3>
          <button 
            className={styles.navButton} 
            onClick={handleNextMonth}
            type="button"
          >
            ›
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className={styles.weekDays}>
          {weekDays.map((day, index) => (
            <div key={day} className={`${styles.weekDay} ${index === 0 ? styles.sunday : ''}`}>
              {day}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div className={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                className={`
                  ${styles.dayButton}
                  ${!isCurrentMonth ? styles.otherMonth : ''}
                  ${isSelected ? styles.selected : ''}
                  ${isToday ? styles.today : ''}
                `}
                onClick={() => handleDateClick(day)}
                type="button"
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <button 
            className={styles.todayButton} 
            onClick={handleTodayClick}
            type="button"
          >
            오늘
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDatePicker;
