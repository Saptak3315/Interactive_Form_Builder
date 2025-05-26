// src/components/FormBuilder/Core/FormHeader.tsx

import React, { useEffect, useRef, useState } from 'react'
import { useFormContext } from '../../../context/FormContext/FormProvider';
import { setForm } from '../../../context/FormContext/formActions';

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
      
      // Keep the localStorage sync for backward compatibility
      localStorage.setItem("form_name", newTitle);
    } else {
      alert("Form name cannot be empty");
      setTitleInput(state.title || ""); // Reset to current state
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    const newDescription = tempDescription.trim();
    // Allow empty descriptions
    dispatch(setForm({ description: newDescription }));
    
    // Keep the localStorage sync for backward compatibility
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
    <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-lg shadow-sm p-6 mb-5 border-l-4 border-blue-500 transition-all duration-300 hover:shadow-md">
      <div className="max-w-4xl mx-auto">
        {/* Title Section */}
        <div className="mb-4">
          {isEditingTitle ? (
            <div className="flex items-center gap-3">
              <input
                ref={titleInputRef}
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyPress}
                className="flex-1 text-2xl font-semibold px-3 py-2 border-2 border-blue-500 rounded-md outline-none bg-white transition-shadow duration-200 focus:shadow-lg focus:shadow-blue-500/30"
                placeholder="Enter form title..."
              />
              <div className="flex flex-col gap-1">
                <button 
                  type="button" 
                  onClick={handleTitleSave} 
                  className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded border-0 cursor-pointer text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  ✓
                </button>
              </div>
            </div>
          ) : (
            <h1
              className="text-3xl font-semibold text-gray-800 m-0 cursor-pointer flex items-center transition-colors duration-200 hover:text-blue-500 border-b-2 border-dashed border-transparent hover:border-blue-500 pb-1 group"
              onClick={handleTitleEdit}
              title="Click to edit title"
            >
              {state.title || 'Untitled Form'}
              <span className="ml-2 text-base opacity-0 group-hover:opacity-100 transition-opacity duration-200">✏️</span>
            </h1>
          )}
        </div>

        {/* Description Section */}
        <div className="mb-5">
          {isEditingDescription ? (
            <div className="flex items-start gap-3">
              <textarea
                ref={descriptionInputRef}
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={handleDescriptionKeyPress}
                className="flex-1 text-base leading-relaxed px-3 py-3 border-2 border-blue-500 rounded-md outline-none resize-y bg-white min-h-20 transition-shadow duration-200 focus:shadow-lg focus:shadow-blue-500/30"
                placeholder="Enter form description..."
                rows={3}
              />
              <div className="flex flex-col gap-1">
                <button 
                  type="button" 
                  onClick={handleDescriptionSave} 
                  className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded border-0 cursor-pointer text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  ✓
                </button>
              </div>
            </div>
          ) : (
            <p
              className="text-base leading-relaxed text-gray-600 m-0 py-1 cursor-pointer flex items-center transition-colors duration-200 hover:text-blue-500 border-b border-dashed border-transparent hover:border-blue-500 group"
              onClick={handleDescriptionEdit}
              title="Click to edit description"
            >
              {state.description || 'Click to add a description...'}
              <span className="ml-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">✏️</span>
            </p>
          )}
        </div>

        {/* Form Meta Information */}
        <div className="flex justify-between items-center">
          {/* <div className="text-sm text-gray-500">
            {state.formId && (
              <span className="mr-4">Form ID: {state.formId}</span>
            )}
            <span>Last saved: {new Date().toLocaleTimeString()}</span>
          </div> */}
          <span className="text-sm text-gray-500">
            {state.isFormSaved ? (
              <span className="text-green-600 flex items-center gap-1">
                <span>✓</span>
                <span>All changes saved</span>
              </span>
            ) : (
              <span className="text-orange-500 flex items-center gap-1">
                <span>○</span>
                <span>Auto-saving...</span>
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FormHeader;