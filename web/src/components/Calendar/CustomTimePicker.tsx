import React, { useState, useEffect, useRef } from 'react';
import styles from './CustomTimePicker.module.css';

interface CustomTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  onClose,
  isOpen
}) => {
  const [selectedTime, setSelectedTime] = useState(value || '09:00');
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setHours(h);
      setMinutes(m);
      setSelectedTime(value);
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

  const handleTimeSelect = (h: number, m: number) => {
    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    setSelectedTime(timeString);
    setHours(h);
    setMinutes(m);
    onChange(timeString);
    onClose();
  };

  const handleQuickTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    handleTimeSelect(h, m);
  };

  if (!isOpen) return null;

  // 30분 단위 시간 옵션 생성
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = hour < 12 
        ? `${hour === 0 ? 12 : hour}:${minute.toString().padStart(2, '0')} AM`
        : `${hour === 12 ? 12 : hour - 12}:${minute.toString().padStart(2, '0')} PM`;
      
      timeOptions.push({
        value: timeString,
        label: displayTime,
        hour,
        minute
      });
    }
  }

  // 빠른 선택 옵션들
  const quickTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.picker} ref={pickerRef}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h3 className={styles.title}>시간 선택</h3>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* 빠른 선택 */}
        <div className={styles.quickSelect}>
          <h4 className={styles.sectionTitle}>빠른 선택</h4>
          <div className={styles.quickTimes}>
            {quickTimes.map((time) => {
              const [h, m] = time.split(':').map(Number);
              const isSelected = selectedTime === time;
              return (
                <button
                  key={time}
                  className={`${styles.quickTimeButton} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleQuickTime(time)}
                  type="button"
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시간 그리드 */}
        <div className={styles.timeGrid}>
          <h4 className={styles.sectionTitle}>전체 시간</h4>
          <div className={styles.timeList}>
            {timeOptions.map((option) => {
              const isSelected = selectedTime === option.value;
              return (
                <button
                  key={option.value}
                  className={`${styles.timeOption} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleTimeSelect(option.hour, option.minute)}
                  type="button"
                >
                  <span className={styles.timeValue}>{option.value}</span>
                  <span className={styles.timeLabel}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 현재 선택된 시간 */}
        <div className={styles.currentTime}>
          <span className={styles.currentTimeLabel}>선택된 시간:</span>
          <span className={styles.currentTimeValue}>{selectedTime}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomTimePicker;
