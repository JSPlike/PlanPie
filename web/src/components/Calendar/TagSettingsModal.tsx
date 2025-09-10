import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { CalendarTag } from '../../types/calendar.types';
import { calendarAPI } from '../../services/calendarApi';
import './TagSettingsModal.css';

interface TagSettingsModalProps {
  calendarId: string;
  calendarName: string;
  tags: CalendarTag[];
  onClose: () => void;
  onUpdate: (tags: CalendarTag[]) => void;
}

// 미리 정의된 색상 팔레트 (모델의 DEFAULT_TAG_COLORS와 동일)
const COLOR_PALETTE = [
  '#2D4059',  // 차콜 블랙
  '#FF6B6B',  // 코랄 레드
  '#5C7AEA',  // 모던 블루
  '#6FCF97',  // 세이지 그린
  '#F2C94C',  // 머스타드 옐로우
  '#9B51E0',  // 라벤더 퍼플
  '#F2994A',  // 앰버 오렌지
  '#56CCF2',  // 스카이 민트
  '#EB5757',  // 체리 핑크
  '#BDBDBD',  // 쿨 그레이
];

// 추가 색상 옵션
const ADDITIONAL_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
  '#1ABC9C', '#34495E', '#16A085', '#27AE60', '#2980B9',
];

// 기본 태그 이름 (영어)
const DEFAULT_TAG_NAMES = [
  'Important',
  'Urgent', 
  'Meeting',
  'Personal',
  'Work',
  'Family',
  'Health',
  'Study',
  'Travel',
  'Other'
];

const TagSettingsModal: React.FC<TagSettingsModalProps> = ({
  calendarId,
  calendarName,
  tags: initialTags,
  onClose,
  onUpdate,
}) => {
  const [tags, setTags] = useState<CalendarTag[]>([]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState('#000000');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const sortedTags = [...initialTags].sort((a, b) => a.order - b.order);
    setTags(sortedTags);
  }, [initialTags]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tags);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedTags = items.map((tag, index) => ({
      ...tag,
      order: index,
    }));

    setTags(updatedTags);
    setHasChanges(true);
  };

  const handleEditStart = (tag: CalendarTag) => {
    setEditingTagId(tag.id);
    setEditingName(tag.name);
  };

  const handleEditSave = () => {
    if (editingTagId && editingName.trim()) {
      setTags(prevTags =>
        prevTags.map(tag =>
          tag.id === editingTagId
            ? { ...tag, name: editingName.trim() }
            : tag
        )
      );
      setHasChanges(true);
    }
    setEditingTagId(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingTagId(null);
    setEditingName('');
  };

  const handleColorChange = (tagId: string, color: string) => {
    // 같은 색상이 이미 사용중인지 확인
    const isColorUsed = tags.some(tag => tag.id !== tagId && tag.color === color);
    if (isColorUsed) {
      alert('이미 사용 중인 색상입니다. 다른 색상을 선택해주세요.');
      return;
    }

    setTags(prevTags =>
      prevTags.map(tag =>
        tag.id === tagId
          ? { ...tag, color: color }
          : tag
      )
    );
    setHasChanges(true);
    setShowColorPicker(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const tagsData = tags.map((tag, index) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        order: index,
      }));

      const response = await calendarAPI.updateCalendarTags(calendarId, { tags: tagsData });
      onUpdate(response.data);
      alert('태그 설정이 저장되었습니다.');
      onClose();
    } catch (error) {
      console.error('태그 저장 실패:', error);
      alert('태그 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('모든 태그를 기본값으로 초기화하시겠습니까?')) {
      return;
    }

    // 기존 태그의 ID와 created_at을 유지하면서 기본값으로 리셋
    const resetTags = tags.map((tag, index) => ({
      ...tag,
      name: DEFAULT_TAG_NAMES[index] || `Tag ${index + 1}`,
      color: COLOR_PALETTE[index] || '#95A5A6',
      order: index,
    }));

    setTags(resetTags);
    setHasChanges(true);
  };

  // 사용 가능한 색상 필터링 (이미 사용중인 색상 제외)
  const getAvailableColors = (currentTagId: string) => {
    const usedColors = tags
      .filter(tag => tag.id !== currentTagId)
      .map(tag => tag.color);
    
    return [...COLOR_PALETTE, ...ADDITIONAL_COLORS].filter(
      color => !usedColors.includes(color)
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tag-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>태그 설정 - {calendarName}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="tags-instructions">
            <p>🎨 드래그하여 순서 변경, 클릭하여 이름과 색상을 수정하세요.</p>
            <p className="tags-note">⚠️ 한 캘린더에서 같은 색상은 하나의 태그만 사용 가능합니다.</p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tags-list">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`tags-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                >
                  {tags.map((tag, index) => (
                    <Draggable
                      key={tag.id}
                      draggableId={tag.id}
                      index={index}
                      isDragDisabled={loading || editingTagId !== null || showColorPicker !== null}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                          }}
                          className={`tag-item ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          {/* 드래그 핸들 */}
                          <div
                            {...provided.dragHandleProps}
                            className="drag-handle"
                          >
                            ⋮⋮
                          </div>

                          {/* 순서 번호 */}
                          <div className="tag-order">
                            {index + 1}
                          </div>

                          {/* 색상 선택 */}
                          <div className="tag-color-section">
                            <div
                              className="tag-color-display"
                              style={{ backgroundColor: tag.color }}
                              onClick={() => setShowColorPicker(showColorPicker === tag.id ? null : tag.id)}
                              title="색상 변경"
                            />
                            
                            {/* 색상 선택 팝오버 */}
                            {showColorPicker === tag.id && (
                              <div className="color-picker-popover">
                                <div className="color-palette">
                                  {getAvailableColors(tag.id).map(color => (
                                    <button
                                      key={color}
                                      className={`color-option ${tag.color === color ? 'selected' : ''}`}
                                      style={{ backgroundColor: color }}
                                      onClick={() => handleColorChange(tag.id, color)}
                                      title={color}
                                    />
                                  ))}
                                </div>
                                <div className="custom-color-input">
                                  <input
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleColorChange(tag.id, customColor)}
                                    className="btn-apply-color"
                                  >
                                    적용
                                  </button>
                                </div>
                                <div className="color-info">
                                  <span>현재: {tag.color}</span>
                                  <span className="available-count">
                                    사용 가능: {getAvailableColors(tag.id).length}개
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 태그 이름 */}
                          <div className="tag-name-section">
                            {editingTagId === tag.id ? (
                              <div className="tag-edit-form">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSave();
                                    if (e.key === 'Escape') handleEditCancel();
                                  }}
                                  autoFocus
                                  className="tag-name-input"
                                  placeholder="태그 이름"
                                  maxLength={50}
                                />
                                <button
                                  onClick={handleEditSave}
                                  className="btn-save-name"
                                  disabled={!editingName.trim()}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="btn-cancel-name"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                className="tag-name-display"
                                onClick={() => handleEditStart(tag)}
                              >
                                <span 
                                  className="tag-preview"
                                  style={{ 
                                    backgroundColor: tag.color,
                                    color: '#fff',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                  }}
                                >
                                  {tag.name}
                                </span>
                                <button className="btn-edit-name" title="이름 수정">✏️</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="modal-info">
            <div className="info-section">
              <h4>💡 사용 팁</h4>
              <ul>
                <li>색상 클릭: 색상 변경 (중복 불가)</li>
                <li>이름 클릭: 이름 변경</li>
                <li>드래그: 순서 변경</li>
                <li>최대 10개의 태그 사용 가능</li>
              </ul>
            </div>
            <div className="info-section">
              <h4>📝 추천 태그 이름</h4>
              <div className="example-tags">
                <span className="example-tag">업무: Urgent, Meeting, Review</span>
                <span className="example-tag">개인: Family, Exercise, Hobby</span>
                <span className="example-tag">프로젝트: Planning, Development, Done</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleReset} className="btn-reset" disabled={loading}>
            초기화
          </button>
          <div className="footer-actions">
            <button onClick={onClose} className="btn-cancel">
              취소
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagSettingsModal;