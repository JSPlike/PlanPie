import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggingStyle,
  NotDraggingStyle,
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
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // order 순으로 정렬된 태그 설정
    const sortedTags = [...initialTags].sort((a, b) => a.order - b.order);
    setTags(sortedTags);
  }, [initialTags]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tags);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // order 값 재할당
    const updatedTags = items.map((tag, index) => ({
      ...tag,
      order: index,
    }));

    setTags(updatedTags);
    setHasChanges(true);
  };

  const handleEditStart = (tag: CalendarTag) => {
    setEditingTagId(tag.id);
    setEditingName(tag.custom_name || tag.default_name);
  };

  const handleEditSave = () => {
    if (editingTagId && editingName.trim()) {
      setTags(prevTags =>
        prevTags.map(tag =>
          tag.id === editingTagId
            ? { ...tag, custom_name: editingName.trim() }
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

  const handleToggleActive = (tagId: string) => {
    setTags(prevTags =>
      prevTags.map(tag =>
        tag.id === tagId ? { ...tag, is_active: !tag.is_active } : tag
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const tagsData = tags.map((tag, index) => ({
        id: tag.id,
        custom_name: tag.custom_name,
        is_active: tag.is_active,
        order: index, // 현재 인덱스를 order로 사용
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

  const handleReset = async () => {
    if (!window.confirm('모든 태그를 기본값으로 초기화하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await calendarAPI.resetCalendarTags(calendarId);
      setTags(response.data);
      setHasChanges(false);
      alert('태그가 초기화되었습니다.');
    } catch (error) {
      console.error('태그 초기화 실패:', error);
      alert('태그 초기화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getItemStyle = (
    isDragging: boolean,
    draggableStyle?: DraggingStyle | NotDraggingStyle
  ): React.CSSProperties => ({
    userSelect: 'none',
    background: isDragging ? '#f0f8ff' : 'white',
    ...draggableStyle,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tag-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>태그 설정 - {calendarName}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="tags-instructions">
            <p>🎨 드래그하여 순서를 변경하고, 클릭하여 이름을 수정하세요.</p>
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
                      isDragDisabled={loading || editingTagId !== null}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}
                          className={`tag-item ${!tag.is_active ? 'inactive' : ''}`}
                        >
                          {/* 드래그 핸들 */}
                          <div
                            {...provided.dragHandleProps}
                            className="drag-handle"
                          >
                            ⋮⋮
                          </div>

                          {/* 색상 표시 */}
                          <div
                            className="tag-color"
                            style={{ backgroundColor: tag.color }}
                          />

                          {/* 태그 이름 */}
                          <div className="tag-name-section">
                            {editingTagId === tag.id ? (
                              <div className="tag-edit-form">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleEditSave();
                                    if (e.key === 'Escape') handleEditCancel();
                                  }}
                                  autoFocus
                                  className="tag-name-input"
                                  placeholder="태그 이름"
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
                                <span className="tag-name">
                                  {tag.custom_name || tag.default_name}
                                </span>
                                {tag.custom_name && tag.custom_name !== tag.default_name && (
                                  <span className="tag-original">
                                    (기본: {tag.default_name})
                                  </span>
                                )}
                                <button className="btn-edit-name">✏️</button>
                              </div>
                            )}
                          </div>

                          {/* 활성화 토글 */}
                          <label className="tag-active-switch">
                            <input
                              type="checkbox"
                              checked={tag.is_active}
                              onChange={() => handleToggleActive(tag.id)}
                              disabled={loading}
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="tag-examples">
            <h4>💡 태그 이름 예시</h4>
            <div className="examples-grid">
              <div className="example-category">
                <strong>업무용:</strong>
                <span>긴급, 회의, 마감, 검토, 완료</span>
              </div>
              <div className="example-category">
                <strong>개인용:</strong>
                <span>가족, 운동, 취