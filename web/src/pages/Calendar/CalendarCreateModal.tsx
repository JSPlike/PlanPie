// CreateCalendarModal.tsx
import React, { useState, useRef } from 'react';
import { CreateCalendarRequest } from '../../types/calendar.types';
import { calendarAPI } from '../../services/calendarApi';

interface CalendarCreateModalProps {
  calendarType: 'personal' | 'shared';
  onClose: () => void;
  onSuccess: (calendarId: string) => void;
}

const PRESET_COLORS = [
  '#2D4059', '#FF6B6B', '#5C7AEA', '#6FCF97', '#F2C94C',
  '#9B51E0', '#F2994A', '#56CCF2', '#EB5757', '#BDBDBD',
];

const CalendarCreateModal: React.FC<CalendarCreateModalProps> = ({
  calendarType,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateCalendarRequest>({
    name: '',
    description: '',
    calendar_type: calendarType,
    color: '#5C7AEA',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, image: '이미지는 5MB 이하만 가능합니다.' }));
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: undefined }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '캘린더 이름을 입력해주세요.';
    } else if (formData.name.length > 100) {
      newErrors.name = '캘린더 이름은 100자 이하로 입력해주세요.';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '설명은 500자 이하로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    console.log('캘린더 저장 요청......')
    setLoading(true);
    setErrors({});

    try {

      console.log('캘린더 저장 요청 전.....')
      console.log(formData)

      const response = await calendarAPI.createCalendar(formData);
      console.log('응답 결과 확인.....')
      console.log(response.data.id);
      onSuccess(response.data.id);
    } catch (error: any) {
      console.error('캘린더 생성 실패:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('캘린더 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-calendar-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {calendarType === 'personal' ? '개인 캘린더' : '공유 캘린더'} 만들기
          </h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 캘린더 이미지 */}
            <div className="form-group">
              <label className="form-label">캘린더 이미지 (선택)</label>
              <div className="image-upload-area">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="캘린더 이미지" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="image-placeholder"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M19 7V11H5V7H19ZM19 5H5C3.9 5 3 5.9 3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V7C21 5.9 20.1 5 19 5Z" fill="#BDBDBD"/>
                      <path d="M12 15L7 10H10V6H14V10H17L12 15Z" fill="#BDBDBD"/>
                    </svg>
                    <p>클릭하여 이미지 업로드</p>
                    <span className="image-hint">JPG, PNG (최대 5MB)</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
              {errors.image && <span className="error-message">{errors.image}</span>}
            </div>

            {/* 캘린더 이름 */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                캘린더 이름 <span className="required">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={calendarType === 'personal' ? '나의 일정' : '우리팀 일정'}
                className={`form-input ${errors.name ? 'error' : ''}`}
                maxLength={100}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
              <span className="char-count">{formData.name.length}/100</span>
            </div>

            {/* 캘린더 설명 */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                설명 (선택)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={
                  calendarType === 'personal' 
                    ? '개인 일정과 목표를 관리합니다.' 
                    : '팀의 일정과 프로젝트를 공유합니다.'
                }
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                rows={3}
                maxLength={500}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
              <span className="char-count">{formData.description?.length || 0}/500</span>
            </div>

            {/* 캘린더 색상 */}
            <div className="form-group">
              <label className="form-label">캘린더 색상</label>
              <div className="color-picker-grid">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
              <div className="selected-color-info">
                선택된 색상: <span style={{ color: formData.color }}>{formData.color}</span>
              </div>
            </div>

            {/* 캘린더 타입 정보 */}
            <div className="calendar-type-info">
              <div className={`type-badge ${calendarType}`}>
                {calendarType === 'personal' ? '개인 캘린더' : '공유 캘린더'}
              </div>
              <p className="type-description">
                {calendarType === 'personal' 
                  ? '나만 볼 수 있는 개인 캘린더입니다.'
                  : '다른 사람을 초대하여 함께 사용할 수 있는 캘린더입니다.'}
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '생성 중...' : '캘린더 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarCreateModal;