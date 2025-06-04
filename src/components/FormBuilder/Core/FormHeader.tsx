// src/components/FormBuilder/Core/FormHeader.tsx

import React, { useEffect, useRef, useState } from 'react'
import { useFormContext } from '../../../context/FormContext/FormProvider';
import { setForm } from '../../../context/FormContext/formActions';
import Swal from 'sweetalert2';

const FormHeader = () => {
  const { state, dispatch } = useFormContext();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync local editing states with context state
  useEffect(() => {
    setTitleInput(state.title || "");
    setTempDescription(state.description || "");
  }, [state.title, state.description]);

  const handleTitleEdit = () => {
    setTitleInput(state.title || "");
    setIsEditingTitle(true);
  };

  const handleDescriptionEdit = () => {
    setTempDescription(state.description || "");
    setIsEditingDescription(true);
  };

  const handleTitleSave = () => {
    const newTitle = titleInput.trim();
    if (newTitle !== "") {
      dispatch(setForm({ title: newTitle }));
      localStorage.setItem("form_name", newTitle);
    } else {
      Swal.fire("Form name cannot be empty");
      setTitleInput(state.title || "");
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    const newDescription = tempDescription.trim();
    dispatch(setForm({ description: newDescription }));
    localStorage.setItem("form_description", newDescription);
    setIsEditingDescription(false);
  };

  const handleTitleCancel = () => {
    setTitleInput(state.title || "");
    setIsEditingTitle(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(state.description || "");
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
    <div className="max-w-4xl mx-auto px-6 py-2">
      {/* Title Section */}
      <div className="mb-2">
        {isEditingTitle ? (
          <div className="flex items-center gap-3">
            <input
              ref={titleInputRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyPress}
              className="flex-1 text-xl font-semibold px-3 py-2 border-2 border-indigo-500 rounded-md outline-none bg-white transition-shadow duration-200 focus:shadow-lg focus:shadow-indigo-500/30"
              placeholder="Enter form title..."
            />
            <button 
              type="button" 
              onClick={handleTitleSave} 
              className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded border-0 cursor-pointer text-sm font-medium transition-colors duration-200 flex items-center justify-center"
            >
              ✓
            </button>
          </div>
        ) : (
          <h1
            className="text-2xl font-semibold text-gray-800 m-0 cursor-pointer flex items-center transition-colors duration-200 hover:text-indigo-500 border-b-2 border-dashed border-transparent hover:border-indigo-500 pb-1 group"
            onClick={handleTitleEdit}
            title="Click to edit title"
          >
            {state.title || 'Untitled Form'}
            <span className="ml-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">✏️</span>
          </h1>
        )}
      </div>

      {/* Description Section */}
      <div>
        {isEditingDescription ? (
          <div className="flex items-start gap-3">
            <textarea
              ref={descriptionInputRef}
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              onKeyDown={handleDescriptionKeyPress}
              className="flex-1 text-sm leading-relaxed px-3 py-2 border-2 border-indigo-500 rounded-md outline-none resize-y bg-white min-h-16 transition-shadow duration-200 focus:shadow-lg focus:shadow-indigo-500/30"
              placeholder="Enter form description..."
              rows={2}
            />
            <button 
              type="button" 
              onClick={handleDescriptionSave} 
              className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded border-0 cursor-pointer text-sm font-medium transition-colors duration-200 flex items-center justify-center"
            >
              ✓
            </button>
          </div>
        ) : (
          <p
            className="text-sm leading-relaxed text-gray-600 m-0 py-1 cursor-pointer flex items-center transition-colors duration-200 hover:text-indigo-500 border-b border-dashed border-transparent hover:border-indigo-500 group"
            onClick={handleDescriptionEdit}
            title="Click to edit description"
          >
            {state.description || 'Click to add a description...'}
            <span className="ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">✏️</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default FormHeader;