// src/components/CalendarRightSide/CalendarRightSide.tsx
import React, { useState, useEffect, useMemo }  from 'react';
import styles from './CalendarRightSide.module.css';
import { Event, Calendar, CalendarTag, CreateUpdateEventRequest } from '../../types/calendar.types';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarRightSideProps {
  isOpen: boolean;
  selectedDate: Date | null;
  selectedRange: {start: Date, end: Date} | null;
  selectedEvent: Event | null;
  calendars: Calendar[];
  events: Event[];
  tempEvent: Event | null; // 추가
  onUpdateTempEvent: (updates: Partial<Event>) => void; // 추가
  onSaveEvent: (eventData: CreateUpdateEventRequest & { id?: string }) => void;
  onDeleteEvent: (eventId: string) => void;
  onClose: () => void;
}

const CalendarRightSide: React.FC<CalendarRightSideProps> = ({
  isOpen,
  selectedDate,
  selectedEvent,
  calendars,
  events,
  tempEvent,
  onUpdateTempEvent,
  onSaveEvent,
  onDeleteEvent,
  onClose
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [showMemo, setShowMemo] = useState(false);
  const [description, setDescription] = useState('');
  const [showTagEditor, setShowTagEditor] = useState(false);

  // rightside 캘린더 목록
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // 태그 드롭다운 상태 추가
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(`.${styles.customSelect}`)) {
        setShowCalendarDropdown(false);
        setShowTagDropdown(false); // 태그 드롭다운도 닫기
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 선택된 캘린더의 태그들 가져오기
  const getSelectedCalendarTags = () => {
    //const calendar = calendars.find(cal => cal.id === selectedCalendarId);
    //return calendar?.tags || [];

    const calendar = calendars.find(cal => cal.id === selectedCalendarId);

    // 실제 캘린더에 태그가 있으면 사용, 없으면 임시 데이터 사용
    if (calendar?.tags && calendar.tags.length > 0) {
      return calendar.tags;
    }
    
    // 테스트용: 선택된 캘린더 ID에 따라 다른 태그 반환
    return MOCK_TAGS.filter(tag => tag.calendar === selectedCalendarId);
  };

  // 선택된 태그 정보 가져오기
  const getSelectedTag = () => {
    const tags = getSelectedCalendarTags();
    return tags.find(tag => tag.id === selectedTagId);
  };


  // 선택된 날짜의 이벤트 필터링
  const dayEvents = selectedDate 
    ? events.filter(event => {
        const eventDate = parseISO(event.start_date);
        return isSameDay(eventDate, selectedDate);
      })
    : [];

  // 폼 초기화 useEffect 수정
  useEffect(() => {
    // selectedEvent가 있으면 우선, 없으면 tempEvent 사용
    const eventToEdit = selectedEvent || tempEvent;
    
    if (eventToEdit) {
      setEventTitle(eventToEdit.title);
      
      const startDateTime = new Date(eventToEdit.start_date);
      const endDateTime = new Date(eventToEdit.end_date);

      setStartDate(format(startDateTime, 'yyyy-MM-dd'));
      setEndDate(format(endDateTime, 'yyyy-MM-dd'));
      setIsAllDay(eventToEdit.all_day);
      setStartTime(eventToEdit.all_day ? '09:00' : format(startDateTime, 'HH:mm'));
      setEndTime(eventToEdit.all_day ? '18:00' : format(endDateTime, 'HH:mm'));
      setSelectedCalendarId(eventToEdit.calendar);
      setSelectedTagId(eventToEdit.tag?.id || null);
      setLocation(eventToEdit.location || '');
      setShowMemo(!!eventToEdit.description);
      setDescription(eventToEdit.description || '');
    } else if (selectedDate) {
      // 새 이벤트 생성 시 초기화
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      setEventTitle('');
      setStartDate(dateStr);
      setStartTime('09:00');
      setEndDate(dateStr);
      setEndTime('18:00');
      setIsAllDay(true);
      setSelectedCalendarId(calendars[0]?.id || '');

      const firstCalendar = calendars[0];
      const firstTag = firstCalendar?.tags?.[0] || MOCK_TAGS.find(tag => tag.calendar === calendars[0]?.id);
      setSelectedTagId(firstTag?.id || null);
      setLocation('');
      setShowMemo(false);
      setDescription('');
    }
  }, [selectedEvent, tempEvent, selectedDate, calendars]);

  useEffect(() => {
    // 캘린더가 변경되었을 때 선택된 태그가 해당 캘린더의 태그가 아니면 초기화
    if (selectedCalendarId) {
      const availableTags = getSelectedCalendarTags();
      if (selectedTagId && !availableTags.some(tag => tag.id === selectedTagId)) {
        setSelectedTagId(availableTags[0]?.id || null);
      }
      else if (!selectedTagId && availableTags.length > 0) {
        setSelectedTagId(availableTags[0].id);
      }
    }
  }, [selectedCalendarId]);

  // 임시 태그 데이터
  const MOCK_TAGS: CalendarTag[] = [
    {
      id: '1',
      name: '회의',
      color: '#FF6B6B',
      order: 0,
      calendar: '1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '2',
      name: '개인 일정',
      color: '#4ECDC4',
      order: 1,
      calendar: '1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '3',
      name: '업무',
      color: '#45B7D1',
      order: 2,
      calendar: '1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '4',
      name: '휴가',
      color: '#96CEB4',
      order: 0,
      calendar: '2',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: '5',
      name: '약속',
      color: '#FECA57',
      order: 1,
      calendar: '2',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ];  

  const handleSave = () => {
    // 날짜와 시간을 조합하여 ISO 문자열 생성
    let startDateTime: string;
    let endDateTime: string;

    if (isAllDay) {
      // 종일 이벤트: 시간을 00:00:00과 23:59:59로 설정
      startDateTime = `${startDate}T00:00:00Z`;
      endDateTime = `${endDate}T23:59:59Z`;
    } else {
      // 시간 지정 이벤트: 입력된 시간 사용
      startDateTime = `${startDate}T${startTime}:00Z`;
      endDateTime = `${endDate}T${endTime}:00Z`;
    }
    
    const eventData: CreateUpdateEventRequest & { id?: string } = {
      ...(selectedEvent?.id && { id: selectedEvent.id }), // 수정 시에만 ID 포함
      title: eventTitle,
      start_date: startDateTime,
      end_date: endDateTime,
      all_day: isAllDay,
      calendar: selectedCalendarId,
      tag_id: selectedTagId,
      description: showMemo ? description : '',
      location: location
    };
  
    onSaveEvent(eventData); // 하나의 함수로 처리
    onClose();
  };

  const handleDelete = () => {
    if (selectedEvent && window.confirm('이 일정을 삭제하시겠습니까?')) {
      onDeleteEvent(selectedEvent.id);
      onClose();
    }
  };

  //const isFormValid = eventTitle.trim() && selectedCalendarId && startDate && endDate;

  // 더 엄격한 폼 검증
  const isFormValid = useMemo(() => {
    if (!eventTitle.trim() || !selectedCalendarId || !startDate || !endDate) {
      return false;
    }
    
    // 날짜 검증
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (startDateObj > endDateObj) {
      return false;
    }
    
    // 시간 검증 (종일이 아닌 경우)
    if (!isAllDay) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (startDateTime >= endDateTime) {
        return false;
      }
    }
    
    return true;
  }, [eventTitle, selectedCalendarId, startDate, endDate, startTime, endTime, isAllDay]);

  const availableTags = getSelectedCalendarTags();

  const handleTagSelect = (tag: CalendarTag) => {
    setSelectedTagId(tag.id);
    setShowTagDropdown(false);
    
    // 임시 이벤트가 있으면 태그 정보도 업데이트
    if (tempEvent) {
      onUpdateTempEvent({ 
        tag: {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          order: tag.order,
          calendar: tag.calendar,
          created_at: tag.created_at,
          updated_at: tag.updated_at
        }
      });
    }
  };

  const getNextHourTime = (addHours: number = 1) => {
    const now = new Date();

    // 한국 시간대로 현재 시간 가져오기 (올바른 방법)
    const kstTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const currentMinutes = kstTime.getHours() * 60 + kstTime.getMinutes();
    
    // 다음 정시로 올림 (예: 12:30 → 13:00)
    const nextHourMinutes = Math.ceil(currentMinutes / 60) * 60 + (addHours - 1) * 60;
    const nextHour = Math.floor(nextHourMinutes / 60) % 24;
    return `${nextHour.toString().padStart(2, '0')}:00`;
  };

  const handleTitleChange = (newTitle: string) => {
    setEventTitle(newTitle);
    
    // 임시 이벤트가 있으면 제목도 실시간 업데이트
    if (selectedEvent) {
      // 실제 이벤트 편집 모드에서는 tempEvent 업데이트 안함
      return;
    } else if (tempEvent) {
      onUpdateTempEvent({ title: newTitle });
    }
  };

  // 시간 검증 함수 추가
  const validateDateTime = () => {
    if (!isAllDay) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (startDateTime >= endDateTime) {
        return false;
      }
    }
    return true;
  };

  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    
    // selectedEvent가 있으면 tempEvent 업데이트 안함
    if (!selectedEvent && tempEvent) {
      const newDateTime = isAllDay 
        ? `${newDate}T00:00:00+09:00`
        : `${newDate}T${startTime}:00+09:00`;
      onUpdateTempEvent({ start_date: newDateTime });
    }
  };

  const handleStartTimeChange = (newTime: string) => {
    setStartTime(newTime);

    // 시작 시간이 종료 시간보다 늦으면 종료 시간을 1시간 후로 설정
    const [startHour, startMin] = newTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      const newEndMinutes = startMinutes + 60;
      const newEndHour = Math.floor(newEndMinutes / 60) % 24;
      const newEndMin = newEndMinutes % 60;
      const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;
      setEndTime(newEndTime);
    }
    
    if (!selectedEvent && tempEvent && !isAllDay) {
      const newDateTime = `${startDate}T${newTime}:00Z`;
      onUpdateTempEvent({ start_date: newDateTime });
    }
  };

  const handleEndDateChange = (newDate: string) => {
    setEndDate(newDate);
    
    if (!selectedEvent && tempEvent) {
      const newDateTime = isAllDay 
        ? `${newDate}T23:59:59+09:00`
        : `${newDate}T${endTime}:00+09:00`;
      onUpdateTempEvent({ end_date: newDateTime });
    }
  };
  
  const handleEndTimeChange = (newTime: string) => {
    setEndTime(newTime);
    
    if (!selectedEvent && tempEvent && !isAllDay) {
      const newDateTime = `${endDate}T${newTime}:00Z`;
      onUpdateTempEvent({ end_date: newDateTime });
    }
  };

  const handleAllDayChange = (checked: boolean) => {
    setIsAllDay(checked);
    let newStartTime = startTime;
    let newEndTime = endTime;

    if (!checked) {
      // 시간 지정으로 변경: 현재 시간 기준으로 설정
      const nextHourTime = getNextHourTime(1); // 현재 시간 + 1시간
      const twoHoursLaterTime = getNextHourTime(2); // 현재 시간 + 2시간
      

      newStartTime = nextHourTime;
      newEndTime = twoHoursLaterTime;
      setStartTime(newStartTime);
      setEndTime(newEndTime);
    }
    
    if (!selectedEvent && tempEvent) {
      const startDateTime = checked 
        ? `${startDate}T00:00:00+09:00`
        : `${startDate}T${newStartTime}:00+09:00`; // 새로운 시간 사용
      const endDateTime = checked 
        ? `${endDate}T23:59:59+09:00`
        : `${endDate}T${newEndTime}:00+09:00`;     // 새로운 시간 사용

      onUpdateTempEvent({ 
        all_day: checked,
        start_date: startDateTime,
        end_date: endDateTime
      });
    }
  };

  return (
    <div className={styles.sidebar}>
      <form className={styles.eventForm}>
        <div className={styles.sidebarHeader}>
        {isEditingTitle ? (
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                setIsEditingTitle(false);
              }
            }}
            className={styles.headerTitleEdit}
            placeholder="일정 제목을 입력하세요"
            autoFocus
          />
        ) : (
          <h2
            className={styles.headerTitle}
            onClick={() => setIsEditingTitle(true)}
            title="클릭해서 제목 수정"
          >
            {/* {eventTitle || (selectedEvent ? selectedEvent.title : 'Title')} */}
            {eventTitle || 'Title'}
          </h2>
        )}
        </div>

        <div className={styles.sidebarContent}>
          {/* 날짜 및 시간 */}
          <div className={styles.sidebarDateContent}>
            <div className={styles.formGroup}>
              <div className={styles.dateTimeGroup}>
                <label className={styles.smallLabel}>시작</label>
                <div className={styles.dateTimeInputs}>
                  <div className={styles.dateDiv}>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className={`${styles.dateInput} ${!isAllDay ? styles.fullWidth : ''}`}
                    />
                  </div>
                  {!isAllDay && (
                    <div className={styles.timeDiv}>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className={styles.timeInput}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.dateTimeGroup}>
                <label className={styles.smallLabel}>종료</label>
                <div className={styles.dateTimeInputs}>
                  <div className={styles.dateDiv}>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                  {!isAllDay && (
                    <div className={styles.timeDiv}>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className={styles.timeInput}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => handleAllDayChange(e.target.checked)}
                    className={styles.checkbox}
                  />
                  종일
                </label>
              </div>
            </div>
          </div>
          
          <div className={styles.sidebarOptionContent}>
            <div className={styles.formGroup}>
              {/* 캘린더 선택 (캘린더가 2개 이상일 때만 표시) */}
              {calendars.length > 1 && (
                <div className={styles.optionDiv}>
                  <div className={styles.customLabel}>
                    <label className={styles.smallLabel}>달력</label>
                  </div>
                  <div className={styles.customSelect}>
                    <input
                      type="text"
                      value={calendars.find(cal => cal.id === selectedCalendarId)?.name || ''}
                      onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                      readOnly
                      placeholder="캘린더를 선택하세요"
                      className={styles.selectInput}
                    />
                    <div 
                      className={styles.dropdownArrow}
                      onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    
                    {/* 드롭다운 목록 */}
                    {showCalendarDropdown && (
                      <div className={styles.dropdownList}>
                        {calendars.map((calendar) => (
                          <div
                            key={calendar.id}
                            className={`${styles.dropdownItem} ${selectedCalendarId === calendar.id ? styles.selected : ''}`}
                            onClick={() => {
                              setSelectedCalendarId(calendar.id);
                              setSelectedTagId(null); // 캘린더 변경 시 태그 초기화
                              setShowCalendarDropdown(false);
                            }}
                          >
                            <div className={styles.calendarInfo}>
                              <img 
                                src={calendar.image || '/images/default-calendar.png'} 
                                alt={calendar.name}
                                className={styles.calendarImage}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/default-calendar.png';
                                }}
                              />
                              <span className={styles.calendarName}>{calendar.name}</span>
                            </div>
                            <div className={styles.radioButton}>
                              {selectedCalendarId === calendar.id && (
                                <div className={styles.radioSelected} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 태그 선택 */}
              <div className={styles.optionDiv}>
                <div className={styles.customLabel}>
                  <label className={styles.smallLabel}
                  style={{
                    color: selectedTagId 
                      ? availableTags.find(tag => tag.id === selectedTagId)?.color || '#718096'
                      : '#718096'
                  }}>태그</label>
                </div>
                <div className={styles.customSelect}>
                  <input
                    type="text"
                    value={selectedTagId ? availableTags.find(tag => tag.id === selectedTagId)?.name || availableTags[0]?.name : '태그 없음'}
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    readOnly
                    placeholder="태그를 선택하세요"
                    className={styles.selectInput}
                  />
                  <div 
                    className={styles.dropdownArrow}
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  
                  {/* 태그 드롭다운 목록 */}
                  {showTagDropdown && (
                    <div className={styles.dropdownList}>
                      {/* 사용 가능한 태그들 */}
                      {availableTags.map((tag) => (
                        <div
                          key={tag.id}
                          className={`${styles.dropdownItem} ${selectedTagId === tag.id ? styles.selected : ''}`}
                          onClick={() => {
                            //setSelectedTagId(tag.id);
                            //setShowTagDropdown(false);
                            handleTagSelect(tag);
                          }}
                        >
                          <div className={styles.tagInfo}>
                            <div 
                              className={styles.tagColorDot}
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className={styles.tagName}>{tag.name}</span>
                          </div>
                          <div className={styles.radioButton}>
                            {selectedTagId === tag.id && (
                              <div className={styles.radioSelected} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 메모 체크박스 */}
              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={showMemo}
                      onChange={(e) => setShowMemo(e.target.checked)}
                      className={styles.checkbox}
                    />
                    메모 추가
                  </label>
                </div>

                {showMemo && (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="메모를 입력하세요"
                    className={styles.textarea}
                    rows={4}
                  />
                )}
              </div>

              {/* 버튼들 */}
              <div className={styles.buttonGroup}>
                {/* 닫기 */}
                <button className={styles.closeButton} type="button" onClick={onClose}>취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isFormValid}
                  className={`${styles.saveButton} ${!isFormValid ? styles.disabled : ''}`}
                >
                  {selectedEvent ? '수정' : '저장'}
                </button>

                {selectedEvent && selectedEvent.can_delete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={styles.deleteButton}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CalendarRightSide;
