import React, { useEffect, useRef, useState } from 'react'
import './FormHeader.css';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import { setForm } from '../../../context/FormContext/formActions';

const FormHeader = () => {
  const { state, dispatch } = useFormContext();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [storedFormName, setStoredFormName] = useState("");
  const [storedDescription, setStoredDescription] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("form_name");
    if (savedName) {
      setStoredFormName(savedName);
    }
  }, []);

  
  useEffect(() => {
    const savedDescription = localStorage.getItem("form_description");
    if (savedDescription) {
      setStoredDescription(savedDescription);
    }
  }, []);

  
  const handleTitleEdit = () => {
    setTitleInput(storedFormName || state.title || "");
    setIsEditingTitle(true);
  };

  const handleDescriptionEdit = () => {
    
    setTempDescription(storedDescription || state.description || "");
    setIsEditingDescription(true);
  };

  const handleTitleSave = () => {
    const newTitle = titleInput.trim();
    if (newTitle !== "") {
      
      dispatch(setForm({ title: newTitle }));
      
      
      localStorage.setItem("form_name", newTitle);
      setStoredFormName(newTitle);
    } else {
      alert("Form name cannot be empty");
    }
    
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    const newDescription = tempDescription.trim();
    if (newDescription !== "") {
      dispatch(setForm({ description: newDescription }));
      localStorage.setItem("form_description", newDescription);
      setStoredDescription(newDescription);
    } else {
      alert("Form description cannot be empty");
    }
    setIsEditingDescription(false);
  };

  const handleTitleCancel = () => {
    setTitleInput(storedFormName || state.title || "");
    setIsEditingTitle(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(storedDescription || state.description || "");
    setIsEditingDescription(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleDescriptionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return; 
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

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
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyPress}
                className="form-title-input"
                placeholder="Enter form title..."
              />

              <div className="edit-actions">
                <button type="button" onClick={handleTitleSave} className="save-btn">✓</button>
                {/* <button type="button" onClick={handleTitleCancel} className="cancel-btn">✕</button> */}
              </div>
            </div>
          ) : (
            <h1
              className="form-title"
              onClick={handleTitleEdit}
              title="Click to edit title"
            >
              {storedFormName || state.title || 'Untitled Form'}
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
                <button type="button" onClick={handleDescriptionSave} className="save-btn">✓</button>
                {/* <button type="button" onClick={handleDescriptionCancel} className="cancel-btn">✕</button> */}
              </div>
            </div>
          ) : (
            <p
              className="form-description"
              onClick={handleDescriptionEdit}
              title="Click to edit description"
            >
              {storedDescription || state.description || 'Click to add a description...'}
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

export default FormHeader;