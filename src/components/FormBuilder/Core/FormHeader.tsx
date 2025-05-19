import React, { useEffect, useRef, useState } from 'react'
import './FormHeader.css';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import { setForm } from '../../../context/FormContext/formActions';

const FormHeader = () => {
  const { state, dispatch } = useFormContext();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(state.title);
  const [tempDescription, setTempDescription] = useState(state.description);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Handle title editing
  const handleTitleEdit = () => {
    setTempTitle(state.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    dispatch(setForm({ title: tempTitle }));
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(state.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Handle description editing
  const handleDescriptionEdit = () => {
    setTempDescription(state.description);
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    dispatch(setForm({ description: tempDescription }));
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(state.description);
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Allow line breaks with Shift+Enter
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  // Auto-focus inputs when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  return (
    <div className="form-header">
      <div className="form-header-content">
        <div className="form-title-section">
          {isEditingTitle ? (
            <div className="form-title-edit">
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyPress}
                className="form-title-input"
                placeholder="Enter form title..."
              />
              <div className="edit-actions">
                <button onClick={handleTitleSave} className="save-btn">✓</button>
                <button onClick={handleTitleCancel} className="cancel-btn">✕</button>
              </div>
            </div>
          ) : (
            <h1 
              className="form-title" 
              onClick={handleTitleEdit}
              title="Click to edit title"
            >
              {state.title || 'Untitled Form'}
              <span className="edit-icon">✏️</span>
            </h1>
          )}
        </div>

        <div className="form-description-section">
          {isEditingDescription ? (
            <div className="form-description-edit">
              <textarea
                ref={descriptionInputRef}
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={handleDescriptionKeyPress}
                className="form-description-input"
                placeholder="Enter form description..."
                rows={3}
              />
              <div className="edit-actions">
                <button onClick={handleDescriptionSave} className="save-btn">✓</button>
                <button onClick={handleDescriptionCancel} className="cancel-btn">✕</button>
              </div>
            </div>
          ) : (
            <p 
              className="form-description" 
              onClick={handleDescriptionEdit}
              title="Click to edit description"
            >
              {state.description || 'Click to add a description...'}
              <span className="edit-icon">✏️</span>
            </p>
          )}
        </div>

        <div className="form-meta">
          <span className="save-status">
            {state.isFormSaved ? (
              <span className="saved">✓ All changes saved</span>
            ) : (
              <span className="unsaved">○ Unsaved changes</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FormHeader