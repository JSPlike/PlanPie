// src/components/CalendarRightSide/CalendarRightSide.tsx
import React, { useState, useEffect, useMemo }  from 'react';
import styles from './CalendarRightSide.module.css';
import { Event, Calendar, CalendarTag, CreateUpdateEventRequest } from '../../types/calendar.types';
import { format, parseISO, isSameDay, formatDate } from 'date-fns';
import { ko } from 'date-fns/locale';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';

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
  onDateErrorChange?: (hasError: boolean) => void;
  onCalendarDateChange?: (date: Date) => void; // 달력 날짜 변경 콜백
  isLoading?: boolean;
  onClose: () => void;
}

const CalendarRightSide: React.FC<CalendarRightSideProps> = ({
  isOpen,
  selectedDate,
  selectedRange,
  selectedEvent,
  calendars,
  events,
  tempEvent,
  onUpdateTempEvent,
  onSaveEvent,
  onDeleteEvent,
  onDateErrorChange,
  onCalendarDateChange,
  isLoading = false,
  onClose
}) => {
  const [mode, setMode] = useState<'detail' | 'edit'>('detail'); // 상세/수정 모드 구분
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
  
  // 커스텀 피커 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  //const [isLoading, setIsLoading] = useState(false);


  // 30분 단위로 시간을 제한하는 함수
  const validateAndFormatTime = (time: string): string => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time;
    
    // 분이 이미 30분 단위인지 확인
    if (minutes === 0 || minutes === 30) {
      return time; // 이미 30분 단위면 그대로 반환
    }
    
    // 분을 30분 단위로 반올림
    const roundedMinutes = Math.round(minutes / 30) * 30;
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
    const finalHours = roundedMinutes === 60 ? hours + 1 : hours;
    
    return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  };

  // rightside 캘린더 목록
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // 태그 드롭다운 상태 추가
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // 날짜 형식 오류 체크 함수
  const checkDateFormatError = (date: string): boolean => {
    if (!date) return false;
    
    // 완전한 YYYY-MM-DD 형식인지 확인
    const completeDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const completeMatch = date.match(completeDateRegex);
    
    if (completeMatch) {
      const [, year, month, day] = completeMatch;
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      // 연도 제한 (1900-2099)
      if (yearNum < 1900 || yearNum > 2099) {
        return true;
      }
      
      // 월 제한 (01-12)
      if (monthNum < 1 || monthNum > 12) {
        return true;
      }
      
      // 일 제한 (01-31)
      if (dayNum < 1 || dayNum > 31) {
        return true;
      }
      
      // 실제 날짜 유효성 검증
      const dateObj = new Date(yearNum, monthNum - 1, dayNum);
      if (dateObj.getFullYear() !== yearNum || 
          dateObj.getMonth() !== monthNum - 1 || 
          dateObj.getDate() !== dayNum) {
        return true;
      }
    }
    
    return false;
  };

  const hasDateError = useMemo(() => {
    // 완전한 날짜 형식인지 먼저 확인
    const startDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const endDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!startDateRegex.test(startDate) || !endDateRegex.test(endDate)) {
      return false; // 부분 입력 중에는 오류로 간주하지 않음
    }
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // 유효하지 않은 날짜인 경우 오류로 간주하지 않음
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return false;
    }
    
    if (startDateObj > endDateObj) {
      return true;
    }
    
    if (!isAllDay) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return false; // 유효하지 않은 날짜/시간인 경우 오류로 간주하지 않음
      }
      
      if (startDateTime >= endDateTime) {
        return true;
      }
    }
    
    return false;
  }, [startDate, endDate, startTime, endTime, isAllDay]);

  // 포커스 상태 추가
  const [startDateFocused, setStartDateFocused] = useState(false);
  const [endDateFocused, setEndDateFocused] = useState(false);

  // 개별 날짜 형식 오류 상태 - 포커스 상태에 따라 다르게 체크
  const hasStartDateFormatError = useMemo(() => {
    // 포커스 중이면 오류 표시하지 않음
    if (startDateFocused) {
      return false;
    }
    
    // 포커스가 벗어났을 때는 부분 입력도 검증
    if (!startDate) return false;
    
    // 완전한 YYYY-MM-DD 형식인 경우
    const completeDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (completeDateRegex.test(startDate)) {
      return checkDateFormatError(startDate);
    }
    
    // 부분 입력인 경우 연도 형식 체크
    const yearRegex = /^\d{4}$/;
    const yearMonthRegex = /^\d{4}-\d{2}$/;
    const yearMonthDayRegex = /^\d{4}-\d{2}-\d{1,2}$/;
    
    if (yearRegex.test(startDate)) {
      const year = parseInt(startDate);
      return year < 1900 || year > 2099;
    }
    
    if (yearMonthRegex.test(startDate)) {
      const [year, month] = startDate.split('-').map(Number);
      return year < 1900 || year > 2099 || month < 1 || month > 12;
    }
    
    if (yearMonthDayRegex.test(startDate)) {
      const [year, month, day] = startDate.split('-').map(Number);
      return year < 1900 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31;
    }
    
    // 다른 형식은 오류로 간주
    return startDate.length > 0;
  }, [startDate, startDateFocused]);

  const hasEndDateFormatError = useMemo(() => {
    // 포커스 중이면 오류 표시하지 않음
    if (endDateFocused) {
      return false;
    }
    
    // 포커스가 벗어났을 때는 부분 입력도 검증
    if (!endDate) return false;
    
    // 완전한 YYYY-MM-DD 형식인 경우
    const completeDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (completeDateRegex.test(endDate)) {
      return checkDateFormatError(endDate);
    }
    
    // 부분 입력인 경우 연도 형식 체크
    const yearRegex = /^\d{4}$/;
    const yearMonthRegex = /^\d{4}-\d{2}$/;
    const yearMonthDayRegex = /^\d{4}-\d{2}-\d{1,2}$/;
    
    if (yearRegex.test(endDate)) {
      const year = parseInt(endDate);
      return year < 1900 || year > 2099;
    }
    
    if (yearMonthRegex.test(endDate)) {
      const [year, month] = endDate.split('-').map(Number);
      return year < 1900 || year > 2099 || month < 1 || month > 12;
    }
    
    if (yearMonthDayRegex.test(endDate)) {
      const [year, month, day] = endDate.split('-').map(Number);
      return year < 1900 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31;
    }
    
    // 다른 형식은 오류로 간주
    return endDate.length > 0;
  }, [endDate, endDateFocused]);

  // 전체 날짜 형식 오류 상태 (저장 버튼용)
  const hasDateFormatError = useMemo(() => {
    return hasStartDateFormatError || hasEndDateFormatError;
  }, [hasStartDateFormatError, hasEndDateFormatError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(`.${styles.customSelect}`) && 
          !target.closest(`.${styles.menuContainer}`)) {
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

  useEffect(() => {
    if (onDateErrorChange) {
      onDateErrorChange(hasDateError);
    }
  }, [hasDateError, onDateErrorChange]);

  // 모드 설정 useEffect
  useEffect(() => {
    if (selectedEvent && !tempEvent) {
      // 기존 이벤트 클릭 시 상세 모드
      setMode('detail');
    } else {
      // 새 이벤트 생성 시 수정 모드
      setMode('edit');
    }
  }, [selectedEvent, tempEvent]);

  // 상세 모드 핸들러들
  const handleEditClick = () => {
    setMode('edit');
  };

  const handleDeleteClick = () => {
    if (selectedEvent && window.confirm(`'${selectedEvent.title}' 일정을 삭제하시겠습니까?\n\n삭제된 일정은 복구할 수 없습니다.`)) {
      onDeleteEvent(selectedEvent.id);
      onClose();
    }
  };

  const handleBackToDetail = () => {
    setMode('detail');
  };

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

  const handleSave = async () => {

    console.log('CalendarRightSide ======> handleSave 저장버튼 클릭')
    //setIsLoading(true);
    // 날짜와 시간을 조합하여 ISO 문자열 생성
    let startDateTime: string;
    let endDateTime: string;

    if (isAllDay) {
      // 종일 이벤트: KST 고정으로 저장하여 날짜 넘어감 방지
      startDateTime = `${startDate}T00:00:00+09:00`;
      endDateTime = `${endDate}T23:59:59+09:00`;
    } else {
      // 시간 지정 이벤트: KST 고정 오프셋 사용
      startDateTime = `${startDate}T${startTime}:00+09:00`;
      endDateTime = `${endDate}T${endTime}:00+09:00`;
    }

    let eventId: string;
    if (selectedEvent?.id) {
      eventId = selectedEvent.id; // 기존 이벤트 수정
    } else if (tempEvent?.id) {
      eventId = tempEvent.id; // 새 이벤트 생성 (temp-xxx)
    } else {
      console.error('이벤트 ID가 없습니다!');
      alert('이벤트 정보가 올바르지 않습니다.');
      return; // 저장 중단
    }
    
    const eventData: CreateUpdateEventRequest = {
      id: eventId,
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
    //setIsLoading(false);
    onClose();
  };

  const handleDelete = () => {
    if (selectedEvent && window.confirm('이 일정을 삭제하시겠습니까?')) {
      onDeleteEvent(selectedEvent.id);
      onClose();
    }
  };

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

  // 날짜 포맷 헬퍼
  const formatDate = (date: Date): string => {
    // 유효하지 않은 날짜인 경우 빈 문자열 반환
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  };

  // 시작일 변경 이벤트
  const handleStartDateChange = (newDate: string) => {
    // 날짜 형식 검증
    const validatedDate = validateDateFormat(newDate);
    
    // 유효하지 않은 날짜인 경우 처리
    const currentStartDate = new Date(startDate);
    const currentEndDate = new Date(endDate);
    const newStartDateObj = new Date(validatedDate);
    
    // 유효하지 않은 날짜인 경우 기본값 사용
    if (isNaN(newStartDateObj.getTime())) {
      setStartDate(validatedDate);
      return;
    }
  
    // 현재 범위 계산 (일 단위) - 유효한 날짜인 경우에만
    const currentRange = Math.ceil((currentEndDate.getTime() - currentStartDate.getTime()) / (1000 * 60 * 60 * 24));

    if (hasDateError) {
      setStartDate(validatedDate);
      // 오류가 있을 때는 종료일을 변경하지 않음
      
      console.log('날짜 오류 상태 - 시작일만 변경:', newDate);
      
      if (!selectedEvent && tempEvent) {
        // 완전한 날짜 형식인지 확인
        const completeDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (completeDateRegex.test(validatedDate)) {
          const startDateTime = isAllDay 
            ? `${validatedDate}T00:00:00+09:00`
            : `${validatedDate}T${startTime}:00+09:00`;
          
          onUpdateTempEvent({ 
            start_date: startDateTime
          });
        }
      }
      return;
    }

    // 시작일 변경
    setStartDate(validatedDate);
    
    // 달력 날짜도 시작일에 맞춰 조정
    const validatedStartDateObj = new Date(validatedDate);
    if (!isNaN(validatedStartDateObj.getTime()) && onCalendarDateChange) {
      onCalendarDateChange(validatedStartDateObj);
      console.log('달력 날짜를 시작일에 맞춰 조정:', validatedDate);
    }
    
    // 종료일이 시작일보다 작으면 자동으로 조정
    const currentEndDateObj = new Date(endDate);
    
    if (!isNaN(validatedStartDateObj.getTime()) && !isNaN(currentEndDateObj.getTime())) {
      if (validatedStartDateObj > currentEndDateObj) {
        setEndDate(validatedDate);
        console.log('종료일이 시작일보다 작아서 자동 조정:', validatedDate);
      }
    }
    
    // selectedEvent가 있으면 tempEvent 업데이트 안함
    if (!selectedEvent && tempEvent) {
      // 완전한 날짜 형식인지 확인
      const completeDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (completeDateRegex.test(validatedDate)) {
        const startDateTime = isAllDay 
          ? `${validatedDate}T00:00:00+09:00`
          : `${validatedDate}T${startTime}:00+09:00`;
        
        // 종료일도 조정되었는지 확인
        const finalEndDate = validatedStartDateObj > currentEndDateObj ? validatedDate : endDate;
        const endDateTime = isAllDay 
          ? `${finalEndDate}T23:59:59+09:00`
          : `${finalEndDate}T${endTime}:00+09:00`;
        
        onUpdateTempEvent({ 
          start_date: startDateTime,
          end_date: endDateTime
        });
      }
    }
  };

  const handleStartTimeChange = (newTime: string) => {
    // 30분 단위로 제한
    const formattedTime = validateAndFormatTime(newTime);
    setStartTime(formattedTime);

    // 시작 시간이 종료 시간보다 늦으면 종료 시간을 1시간 후로 설정
    const [startHour, startMin] = formattedTime.split(':').map(Number);
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
      const newDateTime = `${startDate}T${formattedTime}:00+09:00`;
      onUpdateTempEvent({ start_date: newDateTime });
    }
  };

  const handleEndDateChange = (newDate: string) => {
    // 날짜 형식 검증
    const validatedDate = validateDateFormat(newDate);
    setEndDate(validatedDate);
    
    // 유효하지 않은 날짜인 경우 tempEvent 업데이트 안함
    const endDateObj = new Date(validatedDate);
    if (isNaN(endDateObj.getTime())) {
      return;
    }
    
    if (!selectedEvent && tempEvent) {
      // 완전한 날짜 형식인지 확인
      const completeDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (completeDateRegex.test(validatedDate)) {
        const newDateTime = isAllDay 
          ? `${validatedDate}T23:59:59+09:00`
          : `${validatedDate}T${endTime}:00+09:00`;
        onUpdateTempEvent({ end_date: newDateTime });
      }
    }
  };

  // 포커스 이벤트 핸들러
  const handleStartDateFocus = () => {
    setStartDateFocused(true);
  };

  const handleStartDateBlur = () => {
    setStartDateFocused(false);
  };

  const handleEndDateFocus = () => {
    setEndDateFocused(true);
  };

  const handleEndDateBlur = () => {
    setEndDateFocused(false);
  };
  
  const handleEndTimeChange = (newTime: string) => {
    // 30분 단위로 제한
    const formattedTime = validateAndFormatTime(newTime);
    setEndTime(formattedTime);
    
    if (!selectedEvent && tempEvent && !isAllDay) {
      const newDateTime = `${endDate}T${formattedTime}:00+09:00`;
      onUpdateTempEvent({ end_date: newDateTime });
    }
  };

  // 커스텀 피커 핸들러들
  const handleDatePickerOpen = (type: 'start' | 'end') => {
    setActivePicker(type);
    setShowDatePicker(true);
  };

  const handleTimePickerOpen = (type: 'start' | 'end') => {
    setActivePicker(type);
    setShowTimePicker(true);
  };

  const handleDatePickerClose = () => {
    setShowDatePicker(false);
    setActivePicker(null);
  };

  const handleTimePickerClose = () => {
    setShowTimePicker(false);
    setActivePicker(null);
  };

  const handleCustomDateChange = (date: string) => {
    if (activePicker === 'start') {
      handleStartDateChange(date);
    } else if (activePicker === 'end') {
      handleEndDateChange(date);
    }
  };

  const handleCustomTimeChange = (time: string) => {
    if (activePicker === 'start') {
      handleStartTimeChange(time);
    } else if (activePicker === 'end') {
      handleEndTimeChange(time);
    }
  };

  // 날짜 형식 검증 함수 - 1자리부터 허용
  const validateDateFormat = (date: string): string => {
    if (!date) return '';
    
    // 1자리부터 허용하되, 완전한 형식일 때만 상세 검증
    return date;
  };

  const handleAllDayChange = (checked: boolean, event?: React.ChangeEvent<HTMLInputElement>) => {
    // 이벤트 전파 막기
    if (event) {
      event.stopPropagation();
    }
    
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

  // 상세 모드 렌더링
  if (mode === 'detail' && selectedEvent) {
    const eventCalendar = calendars.find(cal => cal.id === selectedEvent.calendar);
    
    const formatEventDate = (startDate: string, endDate: string, allDay: boolean) => {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (allDay) {
        if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
          return format(start, 'M월 d일 (E)', { locale: ko });
        } else {
          return `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'M월 d일 (E)', { locale: ko })}`;
        }
      } else {
        if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
          return `${format(start, 'M월 d일 (E) HH:mm', { locale: ko })} - ${format(end, 'HH:mm', { locale: ko })}`;
        } else {
          return `${format(start, 'M월 d일 HH:mm', { locale: ko })} - ${format(end, 'M월 d일 HH:mm', { locale: ko })}`;
        }
      }
    };

    return (
      <div className={styles.sidebar}>
        <div className={styles.detailHeader}>
          <h2 className={styles.headerTitle}>일정 상세</h2>
          <div className={styles.headerActions}>
            <div className={styles.menuContainer}>
              <button 
                type="button"
                className={styles.menuButton}
                onClick={() => setShowTagDropdown(!showTagDropdown)}
              >
                ⋮
              </button>
              {showTagDropdown && (
                <div className={styles.dropdown}>
                  <button type="button" onClick={handleEditClick} className={styles.dropdownEditItem}>
                    ✏️ 수정
                  </button>
                  <button type="button" onClick={handleDeleteClick} className={styles.dropdownEditItem}>
                    🗑️ 삭제
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={onClose} className={styles.closeButton}>×</button>
          </div>
        </div>

        <div className={styles.detailContent}>
          {/* 참여자 */}
          <div className={styles.section}>
            <div className={styles.participants}>
              <div className={styles.participant}>
                <div className={styles.avatar}>박</div>
                <span>박준영</span>
              </div>
              <div className={styles.participant}>
                <div className={styles.avatar}>김</div>
                <span>김개발</span>
              </div>
            </div>
          </div>

          {/* 이벤트 정보 */}
          <div className={styles.section}>
            <h3 className={styles.eventTitle}>{selectedEvent.title}</h3>
            <div className={styles.eventInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>📅 일정</span>
                <span className={styles.infoValue}>
                  {formatEventDate(selectedEvent.start_date, selectedEvent.end_date, selectedEvent.all_day)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>📋 캘린더</span>
                <span className={styles.infoValue}>{eventCalendar?.name || '알 수 없음'}</span>
              </div>
              {selectedEvent.tag && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>🏷️ 태그</span>
                  <span 
                    className={styles.tag}
                    style={{ backgroundColor: selectedEvent.tag.color }}
                  >
                    {selectedEvent.tag.name}
                  </span>
                </div>
              )}
              {selectedEvent.location && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>📍 장소</span>
                  <span className={styles.infoValue}>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>📝 설명</span>
                  <span className={styles.infoValue}>{selectedEvent.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* 수정 로그 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>수정 기록</h3>
            <div className={styles.editLogs}>
              <div className={styles.logItem}>
                <div className={styles.logHeader}>
                  <span className={styles.logAction}>생성</span>
                  <span className={styles.logUser}>박준영</span>
                  <span className={styles.logTime}>11월 30일 14:20</span>
                </div>
                <div className={styles.logContent}>이벤트가 생성되었습니다.</div>
              </div>
            </div>
          </div>

          {/* 댓글 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>댓글</h3>
            <div className={styles.comments}>
              <div className={styles.comment}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentAvatar}>박</div>
                  <div className={styles.commentInfo}>
                    <span className={styles.commentAuthor}>박준영</span>
                    <span className={styles.commentTime}>12월 1일 10:30</span>
                  </div>
                </div>
                <div className={styles.commentContent}>회의 자료 준비 완료했습니다.</div>
              </div>
            </div>
            
            <div className={styles.commentInput}>
              <div className={styles.inputAvatar}>박</div>
              <div className={styles.inputContainer}>
                <textarea
                  placeholder="댓글을 입력하세요..."
                  className={styles.textarea}
                />
                <button type="button" className={styles.submitButton}>
                  게시
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 수정 모드 렌더링
  return (
    <div className={styles.sidebar}>
      {mode === 'edit' && selectedEvent && (
        <div className={styles.editModeHeader}>
          <button type="button" onClick={handleBackToDetail} className={styles.backButton}>
            ← 상세보기
          </button>
        </div>
      )}
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
                    <div className={styles.dateInputContainer}>
                      <input
                        type="text"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        onFocus={handleStartDateFocus}
                        onBlur={handleStartDateBlur}
                        className={`${styles.dateInput} ${styles.dateInputField} ${!isAllDay ? styles.fullWidth : ''}`}
                        placeholder="YYYY-MM-DD"
                        title="YYYY-MM-DD 형식으로 입력하세요"
                        style={{
                          backgroundColor: hasStartDateFormatError
                            ? 'rgba(231, 59, 59, 0.1)'
                            : 'white',
                          fontWeight: hasStartDateFormatError ? '700' : '400',
                        }}
                      />
                      <button
                        type="button"
                        className={styles.datePickerButton}
                        onClick={() => handleDatePickerOpen('start')}
                        title="달력 열기"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {!isAllDay && (
                    <div className={styles.timeDiv}>
                      <div className={styles.timeInputContainer}>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          className={`${styles.timeInput} ${styles.timeInputField}`}
                          step="1800"
                          placeholder="HH:MM"
                        />
                        <button
                          type="button"
                          className={styles.timePickerButton}
                          onClick={() => handleTimePickerOpen('start')}
                          title="시간 선택기 열기"
                        >
                          🕐
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.dateTimeGroup}>
                <label className={styles.smallLabel}>종료</label>
                <div className={styles.dateTimeInputs}
                >
                  <div className={styles.dateDiv}
                  >
                    <div className={styles.dateInputContainer}>
                      <input
                        type="text"
                        value={endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        onFocus={handleEndDateFocus}
                        onBlur={handleEndDateBlur}
                        className={`${styles.dateInput} ${styles.dateInputField}`}
                        placeholder="YYYY-MM-DD"
                        title="YYYY-MM-DD 형식으로 입력하세요"
                        style={{
                          backgroundColor: hasDateError || hasEndDateFormatError
                            ? 'rgba(231, 59, 59, 0.1)'
                            : 'white',
                          fontWeight: hasDateError || hasEndDateFormatError ? '700' : '400',
                        }}
                      />
                      <button
                        type="button"
                        className={styles.datePickerButton}
                        onClick={() => handleDatePickerOpen('end')}
                        title="달력 열기"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {!isAllDay && (
                    <div className={styles.timeDiv}>
                      <div className={styles.timeInputContainer}>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => handleEndTimeChange(e.target.value)}
                          className={`${styles.timeInput} ${styles.timeInputField}`}
                          step="1800"
                          placeholder="HH:MM"
                          style={{
                            backgroundColor: hasDateError
                              ? 'rgba(231, 59, 59, 0.1)'
                              : 'white',
                            fontWeight: hasDateError ? '700' : '400',
                          }}
                        />
                        <button
                          type="button"
                          className={styles.timePickerButton}
                          onClick={() => handleTimePickerOpen('end')}
                          title="시간 선택기 열기"
                        >
                          🕐
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.checkboxGroup}>
                <div className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => handleAllDayChange(e.target.checked, e)}
                    className={styles.checkbox}
                  />
                  <span>종일</span>
                </div>
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
                      onClick={() => {
                        const newState = !showCalendarDropdown;
                        setShowCalendarDropdown(newState);
                        setShowTagDropdown(false);
                      }}
                      readOnly
                      placeholder="캘린더를 선택하세요"
                      className={styles.selectInput}
                    />
                    <div 
                      className={styles.dropdownArrow}
                      onClick={() => {
                        const newState = !showCalendarDropdown;
                        setShowCalendarDropdown(newState);
                        setShowTagDropdown(false);
                      }}
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
                    onClick={() => {
                      const newState = !showTagDropdown;
                      setShowTagDropdown(newState);
                      setShowCalendarDropdown(false);
                    }}
                    readOnly
                    placeholder="태그를 선택하세요"
                    className={styles.selectInput}
                  />
                  <div 
                    className={styles.dropdownArrow}
                    onClick={() => {
                      const newState = !showTagDropdown;
                      setShowTagDropdown(newState);
                      setShowCalendarDropdown(false);
                    }}
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
                  disabled={!isFormValid || hasDateError || hasDateFormatError || isLoading}
                  className={`${styles.saveButton} ${!isFormValid ? styles.disabled : ''}`}
                >
                  {/* {selectedEvent ? '수정' : '저장'} */}
                  {isLoading ? '저장 중...' : '저장'}
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

      {/* 커스텀 피커들 */}
      <CustomDatePicker
        value={activePicker === 'start' ? startDate : endDate}
        onChange={handleCustomDateChange}
        onClose={handleDatePickerClose}
        isOpen={showDatePicker}
      />

      <CustomTimePicker
        value={activePicker === 'start' ? startTime : endTime}
        onChange={handleCustomTimeChange}
        onClose={handleTimePickerClose}
        isOpen={showTimePicker}
      />
    </div>
  );
};

export default CalendarRightSide;
