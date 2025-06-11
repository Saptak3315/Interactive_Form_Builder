// src/components/FormBuilder/Questions/QuestionDetailEditor.tsx
// const mode = 'ador branch version';
import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "../../../context/FormContext/FormProvider";
import type { Question, QuestionOption } from "../../../types/form.types";
import {
  addOption,
  deleteOption,
  updateOption,
  updateQuestion,
} from "../../../context/FormContext/formActions";
import Swal from "sweetalert2";

const QuestionDetailEditor: React.FC = () => {
  const { state, dispatch } = useFormContext();
  const activeQuestion = state.questions.find(
    (q) => q.id === state.activeQuestionId
  );

  // Local state for form fields
  const [localQuestion, setLocalQuestion] = useState<Partial<Question>>({});
  const [localOptions, setLocalOptions] = useState<QuestionOption[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [optionErrors, setOptionErrors] = useState<{ [optionId: number]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localMcqOptions, setLocalMcqOptions] = useState<QuestionOption[]>([]);

  // Add MCQ-specific local state
  const [mcqSettings, setMcqSettings] = useState(activeQuestion?.mcqSettings || {
    shuffleOptions: false,
    allowMultipleCorrect: false,
    showCorrectAnswers: true,
    partialCredit: false,
    scoringMethod: 'standard' as const,
    defaultPoints: 1,
    defaultNegativePoints: 0,
    minSelections: undefined,
    maxSelections: undefined,
  });

  // Update local state when active question changes
  // Track the current question ID to prevent unnecessary state resets
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  // Update local state when active question changes
  useEffect(() => {
    // Only reset state when switching to a different question
    if (activeQuestion && activeQuestion.id !== currentQuestionId) {
      console.log('Switching to different question, resetting local state');

      let questionData = { ...activeQuestion };
      setLocalQuestion(questionData);

      // Handle different question types for options
      if (activeQuestion.type === 'full_name' || activeQuestion.type === 'address') {
        setLocalOptions(activeQuestion.options || []);
      } else if (activeQuestion.type === 'multiple_choice' || activeQuestion.type === 'checkbox') {
        setLocalMcqOptions(activeQuestion.options || []);
      }

      const defaultMcqSettings = {
        shuffleOptions: false,
        allowMultipleCorrect: false,
        showCorrectAnswers: true,
        partialCredit: false,
        scoringMethod: 'standard' as const,
        defaultPoints: 1,
        defaultNegativePoints: 0,
        minSelections: undefined,
        maxSelections: undefined,
      };
      setMcqSettings(activeQuestion.mcqSettings || defaultMcqSettings);

      // Reset file states when switching questions
      setUploadedFile(null);
      setFilePreview(null);
      setOptionErrors({}); // Reset option errors

      // If question has existing media URL, set it as preview
      if (activeQuestion.mediaUrl) {
        setFilePreview(activeQuestion.mediaUrl);
      }

      setCurrentQuestionId(activeQuestion.id);
    } else if (!activeQuestion) {
      setCurrentQuestionId(null);
    }
  }, [activeQuestion, currentQuestionId]);

  // Handle field updates
  const handleFieldChange = (field: keyof Question, value: any) => {
    setLocalQuestion((prev) => ({ ...prev, [field]: value }));
  };

  // Handle MCQ settings updates
  const handleMcqSettingsChange = (field: string, value: any) => {
    // Validate min/max selections
    if (field === 'minSelections' && mcqSettings.maxSelections && value > mcqSettings.maxSelections) {
      return; // Don't allow min to be greater than max
    }
    if (field === 'maxSelections' && mcqSettings.minSelections && value < mcqSettings.minSelections) {
      return; // Don't allow max to be less than min
    }

    const newSettings = { ...mcqSettings, [field]: value };
    setMcqSettings(newSettings);

    // Immediately update the local question with new MCQ settings
    setLocalQuestion(prev => ({
      ...prev,
      mcqSettings: newSettings
    }));

    // If default points changed, update all existing options
    if (field === 'defaultPoints') {
      setLocalMcqOptions(prev => prev.map(option => ({
        ...option,
        points: value
      })));
    }

    if (field === 'defaultNegativePoints') {
      setLocalMcqOptions(prev => prev.map(option => ({
        ...option,
        negativePoints: value
      })));
    }
  };

  // Handle local options change for full_name
  const handleLocalOptionChange = (
    optionId: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    setLocalOptions(prev =>
      prev.map(option =>
        option.id === optionId
          ? { ...option, [field]: value }
          : option
      )
    );
  };

  const handleLocalMcqOptionChange = (
    optionId: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    setLocalMcqOptions(prev =>
      prev.map(option =>
        option.id === optionId
          ? { ...option, [field]: value }
          : option
      )
    );
  };

  // Enhanced option change handlers that immediately sync to global state
  const handleLocalOptionChangeWithSync = (
    optionId: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    if (!activeQuestion) return;

    const updatedOptions = localOptions.map(option =>
      option.id === optionId
        ? { ...option, [field]: value }
        : option
    );

    setLocalOptions(updatedOptions);

    // Immediately sync to global state
    const updatedQuestion = {
      ...localQuestion,
      options: updatedOptions,
    };
    dispatch(updateQuestion(activeQuestion.id, updatedQuestion));
  };

  const handleLocalMcqOptionChangeWithSync = (
    optionId: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    if (!activeQuestion) return;

    const updatedMcqOptions = localMcqOptions.map(option =>
      option.id === optionId
        ? { ...option, [field]: value }
        : option
    );

    setLocalMcqOptions(updatedMcqOptions);

    // Immediately sync to global state
    const updatedQuestion = {
      ...localQuestion,
      options: updatedMcqOptions,
      mcqSettings: mcqSettings,
    };
    dispatch(updateQuestion(activeQuestion.id, updatedQuestion));
  };

  // Validate option content
  const validateOptionContent = (optionId: number, content: string) => {
    const trimmedContent = content.trim();

    if (content.length > 0 && trimmedContent.length === 0) {
      // Has content but only spaces
      setOptionErrors(prev => ({
        ...prev,
        [optionId]: 'Option cannot contain only spaces'
      }));
      return false;
    } else if (trimmedContent.length === 0) {
      // Completely empty
      setOptionErrors(prev => ({
        ...prev,
        [optionId]: 'Option content is required'
      }));
      return false;
    } else {
      // Valid content
      setOptionErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[optionId];
        return newErrors;
      });
      return true;
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mp3', 'audio/wav'];

    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      Swal.fire('Please upload an image, video, or audio file');
      return;
    }
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('File size must be less than 5 MB');
      return;
    }

    setUploadedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFilePreview(result);

      // Update question with file data
      handleFieldChange('mediaUrl', result);
      handleFieldChange('mediaType', file.type);
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    handleFieldChange('mediaUrl', '');
    handleFieldChange('mediaType', '');

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file type for display
  const getFileType = (mediaType?: string): 'image' | 'video' | 'audio' | 'unknown' => {
    if (!mediaType) return 'unknown';
    if (mediaType.startsWith('image/')) return 'image';
    if (mediaType.startsWith('video/')) return 'video';
    if (mediaType.startsWith('audio/')) return 'audio';
    return 'unknown';
  };

  // Render media preview
  const renderMediaPreview = () => {
    if (!filePreview) return null;

    const fileType = getFileType(localQuestion.mediaType);
    const fileName = uploadedFile?.name || 'uploaded-file';

    return (
      <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium text-gray-700">Uploaded Media:</span>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            ✕ Remove
          </button>
        </div>

        {fileType === 'image' && (
          <img
            src={filePreview}
            alt={fileName}
            className="max-w-full h-32 object-cover rounded border"
          />
        )}

        {fileType === 'video' && (
          <video
            src={filePreview}
            controls
            className="max-w-full h-32 rounded border"
          >
            Your browser does not support video playback.
          </video>
        )}

        {fileType === 'audio' && (
          <audio
            src={filePreview}
            controls
            className="w-full"
          >
            Your browser does not support audio playback.
          </audio>
        )}

        <div className="mt-2 text-xs text-gray-500">
          {fileName} • {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : 'External file'}
        </div>
      </div>
    );
  };

  // Save changes to the question (including local options for full_name)
  const saveChanges = () => {
    if (activeQuestion &&
      (activeQuestion.type === "text" ||
        activeQuestion.type === "textarea" ||
        activeQuestion.type === "dynamic_text_fields") &&
      typeof localQuestion.minLength === "number" &&
      typeof localQuestion.maxLength === "number" &&
      localQuestion.maxLength < localQuestion.minLength
    ) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Minimum length cannot be greater than maximum length.",
      });
      return;
    }

    if (activeQuestion && localQuestion) {
      if (
        activeQuestion.type === "full_name" ||
        activeQuestion.type === "address"
      ) {
        const updatedQuestion = {
          ...localQuestion,
          options: localOptions,
        };
        dispatch(updateQuestion(activeQuestion.id, updatedQuestion));
      } else if (
        activeQuestion.type === "multiple_choice" ||
        activeQuestion.type === "checkbox"
      ) {
        // Handle MCQ types with their local options and settings
        const updatedQuestion = {
          ...localQuestion,
          options: localMcqOptions,
          mcqSettings: mcqSettings,
        };
        dispatch(updateQuestion(activeQuestion.id, updatedQuestion));
      } else {
        dispatch(updateQuestion(activeQuestion.id, localQuestion));
      }
    }
  };

  // Handle option changes (for multiple_choice and checkbox - keep original behavior)
  const handleOptionChange = (
    optionId: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    if (!activeQuestion) return;
    dispatch(updateOption(activeQuestion.id, optionId, { [field]: value }));
  };

  const handleAddOption = () => {
    if (!activeQuestion) return;

    if (activeQuestion.type === 'full_name' || activeQuestion.type === 'address') {
      const newOption = {
        id: Date.now(),
        content: "",
        orderPosition: localOptions.length,
        isCorrect: false,
      };

      // Update local state immediately
      const updatedOptions = [...localOptions, newOption];
      setLocalOptions(updatedOptions);

      // Also immediately dispatch to global state so changes persist
      const updatedQuestion = {
        ...localQuestion,
        options: updatedOptions,
      };
      dispatch(updateQuestion(activeQuestion.id, updatedQuestion));

    } else if (activeQuestion.type === 'multiple_choice' || activeQuestion.type === 'checkbox') {
      const newOption = {
        id: Date.now(),
        content: "",
        orderPosition: localMcqOptions.length,
        isCorrect: false,
        points: mcqSettings.defaultPoints || 1,
        negativePoints: mcqSettings.defaultNegativePoints || 0,
        explanation: ''
      };

      // Update local state immediately
      const updatedMcqOptions = [...localMcqOptions, newOption];
      setLocalMcqOptions(updatedMcqOptions);

      // Also immediately dispatch to global state
      const updatedQuestion = {
        ...localQuestion,
        options: updatedMcqOptions,
        mcqSettings: mcqSettings,
      };
      dispatch(updateQuestion(activeQuestion.id, updatedQuestion));

    } else {
      const newOption = {
        content: "",
        orderPosition: activeQuestion.options?.length || 0,
        isCorrect: false,
      };
      dispatch(addOption(activeQuestion.id, newOption));
    }
  };

  const handleDeleteOption = (optionId: number) => {
    if (!activeQuestion) return;

    if (activeQuestion.type === 'full_name' || activeQuestion.type === 'address') {
      if (localOptions.length <= 1) {
        Swal.fire("A name field must have at least 1 field");
        return;
      }

      // Update local state immediately
      const updatedOptions = localOptions.filter(option => option.id !== optionId);
      setLocalOptions(updatedOptions);

      // Also immediately dispatch to global state
      const updatedQuestion = {
        ...localQuestion,
        options: updatedOptions,
      };
      dispatch(updateQuestion(activeQuestion.id, updatedQuestion));

    } else if (activeQuestion.type === 'multiple_choice' || activeQuestion.type === 'checkbox') {
      if (localMcqOptions.length <= 2) {
        Swal.fire("A choice question must have at least 2 options");
        return;
      }

      // Update local state immediately
      const updatedMcqOptions = localMcqOptions.filter(option => option.id !== optionId);
      setLocalMcqOptions(updatedMcqOptions);

      // Also immediately dispatch to global state
      const updatedQuestion = {
        ...localQuestion,
        options: updatedMcqOptions,
        mcqSettings: mcqSettings,
      };
      dispatch(updateQuestion(activeQuestion.id, updatedQuestion));

    } else {
      if (activeQuestion.options && activeQuestion.options.length <= 2) {
        Swal.fire("A choice question must have at least 2 options");
        return;
      }
      dispatch(deleteOption(activeQuestion.id, optionId));
    }
  };

  // Check if there are unsaved changes (include options for full_name)
  const hasUnsavedChanges = () => {
    const hasOptionErrors = Object.keys(optionErrors).length > 0;
    if (hasOptionErrors) return false;

    if (!activeQuestion) return false;

    const questionChanged = JSON.stringify(localQuestion) !== JSON.stringify(activeQuestion);

    if (activeQuestion.type === 'full_name' || activeQuestion.type === 'address') {
      const optionsChanged = JSON.stringify(localOptions) !== JSON.stringify(activeQuestion.options || []);
      return questionChanged || optionsChanged;
    } else if (activeQuestion.type === 'multiple_choice' || activeQuestion.type === 'checkbox') {
      const mcqOptionsChanged = JSON.stringify(localMcqOptions) !== JSON.stringify(activeQuestion.options || []);
      const mcqSettingsChanged = JSON.stringify(mcqSettings) !== JSON.stringify(activeQuestion.mcqSettings || {});
      return questionChanged || mcqOptionsChanged || mcqSettingsChanged;
    }

    return questionChanged;
  };

  if (!activeQuestion) {
    return (
      <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
        <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-10">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="mb-2 text-slate-800 text-xl">No question selected</h3>
          <p className="text-base">Select a question from the editor to start configuring it</p>
        </div>
      </div>
    );
  }

  const questionTypeOptions = [
    { value: "text", label: "Short Text" },
    { value: 'email', label: "Email" },
    { value: 'full_name', label: "Full Name" },
    { value: 'address', label: "Address" },
    { value: 'phone', label: "Phone" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "checkbox", label: "Checkboxes" },
    { value: "file", label: "File Upload" },
    { value: "audio", label: "Audio" },
    { value: "dynamic_text_fields", label: "Dynamic Text Fields" },
    { value: "calculated", label: "Calculated" },
  ];

  // Add full_name to hasOptions
  const hasOptions =
    activeQuestion.type === "multiple_choice" ||
    activeQuestion.type === "checkbox" ||
    activeQuestion.type === "full_name" ||
    activeQuestion.type === "address";

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="m-0 text-lg font-semibold text-slate-800">Field Details</h3>
        <div className="flex gap-2.5">
          <button
            className={`
              px-4 py-2 border-none rounded-md font-medium cursor-pointer transition-all duration-200 flex items-center gap-1.5
              ${!hasUnsavedChanges()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }
            `}
            onClick={saveChanges}
            disabled={!hasUnsavedChanges()}
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {/* Question Content */}
        <div className="mb-5">
          <label htmlFor="question-content" className="block mb-1.5 text-sm font-medium text-gray-700">
            Field Label
          </label>
          <textarea
            id="question-content"
            value={localQuestion.content || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="Enter your question..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
            rows={3}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="question-explanation" className="block mb-1.5 text-sm font-medium text-gray-700">
            Explanation
          </label>
          <textarea
            id="question-explanation"
            value={localQuestion.explanation || ""}
            onChange={(e) => handleFieldChange('explanation', e.target.value)}
            placeholder="Enter explanation..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
            rows={3}
          />
        </div>

        {/* Required checkbox */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="question-required"
              checked={localQuestion.isRequired || false}
              onChange={(e) =>
                handleFieldChange("isRequired", e.target.checked)
              }
              className="w-auto m-0"
            />
            <label htmlFor="question-required" className="m-0 cursor-pointer select-none text-sm font-medium text-gray-700">
              Required
            </label>
          </div>
        </div>

        {/* Media Upload field */}
        <div className="mb-5">
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            Field Media
          </label>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileUpload}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <div className="text-xs text-gray-500">
              Supported formats: Images (JPG, PNG, GIF, WebP), Videos (MP4), Audio (MP3, WAV). Max size: 5MB
            </div>
            {renderMediaPreview()}
          </div>
        </div>

        {/* Enhanced options section with MCQ and full_name support */}
        {hasOptions && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                {activeQuestion.type === 'full_name' ? 'Name Fields' :
                  activeQuestion.type === 'multiple_choice' ? 'Answer Options' : 'Answer Options'}
              </label>

              {/* MCQ Settings for multiple_choice */}
              {activeQuestion.type === 'multiple_choice' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMcqSettingsChange('allowMultipleCorrect', !mcqSettings.allowMultipleCorrect)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${mcqSettings.allowMultipleCorrect
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                  >
                    {mcqSettings.allowMultipleCorrect ? '☑️ Multi-Select' : '🔘 Single Select'}
                  </button>
                  <button
                    className="px-3 py-1.5 bg-indigo-500 text-white border-none rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600"
                    onClick={handleAddOption}
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {/* Other question types */}
              {activeQuestion.type !== 'multiple_choice' && (
                activeQuestion.type === 'full_name' ? (
                  localOptions.length < 5 && (
                    <button
                      className="px-3 py-1.5 bg-indigo-500 text-white border-none rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600"
                      onClick={handleAddOption}
                    >
                      + Add Name Field
                    </button>
                  )
                ) : (
                  <button
                    className="px-3 py-1.5 bg-indigo-500 text-white border-none rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-indigo-600"
                    onClick={handleAddOption}
                  >
                    + Add Option
                  </button>
                )
              )}
            </div>

            {/* MCQ Scoring Settings */}
            {activeQuestion.type === 'multiple_choice' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-3">📊 Scoring Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Default Points per Option</label>
                    <input
                      type="number"
                      value={mcqSettings.defaultPoints || 1}
                      onChange={(e) => {
                        const value = e.target.valueAsNumber || 1;
                        handleMcqSettingsChange('defaultPoints', value);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Negative Marking</label>
                    <input
                      type="number"
                      value={mcqSettings.defaultNegativePoints || 0}
                      onChange={(e) => handleMcqSettingsChange('defaultNegativePoints', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Selection Limits (for multi-select)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          placeholder="Min selections"
                          value={mcqSettings.minSelections || ''}
                          onChange={(e) => handleMcqSettingsChange('minSelections', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          disabled={!mcqSettings.allowMultipleCorrect}
                        />
                        <label className="text-xs text-gray-500">Min</label>
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Max selections"
                          value={mcqSettings.maxSelections || ''}
                          onChange={(e) => handleMcqSettingsChange('maxSelections', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="1"
                          disabled={!mcqSettings.allowMultipleCorrect}
                        />
                        <label className="text-xs text-gray-500">Max</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Scoring Method</label>
                    <select
                      value={mcqSettings.scoringMethod || 'standard'}
                      onChange={(e) => handleMcqSettingsChange('scoringMethod', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="standard">Standard (No negative)</option>
                      <option value="negative_marking">Negative Marking</option>
                      <option value="no_negative">No Negative Points</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="partial-credit"
                      checked={mcqSettings.partialCredit || false}
                      onChange={(e) => handleMcqSettingsChange('partialCredit', e.target.checked)}
                      className="w-4 h-4 mr-2"
                    />
                    <label htmlFor="partial-credit" className="text-xs font-medium text-gray-700">
                      Allow Partial Credit
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Use localOptions for full_name, activeQuestion.options for others */}
              {/* Use appropriate local state for different question types */}
              {(activeQuestion.type === 'full_name' ? localOptions :
                activeQuestion.type === 'multiple_choice' || activeQuestion.type === 'checkbox' ? localMcqOptions :
                  activeQuestion.options)?.map((option: any, index: number) => (
                    <div key={option.id} className={`p-4 border rounded-lg ${activeQuestion.type === 'multiple_choice'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                      }`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${activeQuestion.type === 'multiple_choice'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-600'
                          }`}>
                          {activeQuestion.type === 'full_name' ? `Field ${index + 1}` :
                            activeQuestion.type === 'multiple_choice' ? String.fromCharCode(65 + index) : `${index + 1}`}
                        </span>
                        <button
                          className={`px-2 py-1 border-none rounded cursor-pointer text-xs transition-all duration-200 ${(activeQuestion.type === 'full_name' && localOptions.length <= 1) ||
                            (activeQuestion.type !== 'full_name' && (activeQuestion.options?.length || 0) <= 2)
                            ? 'opacity-50 cursor-not-allowed bg-red-50 text-red-600'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          onClick={() => handleDeleteOption(option.id)}
                          disabled={
                            (activeQuestion.type === 'full_name' && localOptions.length <= 1) ||
                            (activeQuestion.type !== 'full_name' && (activeQuestion.options?.length || 0) <= 2)
                          }
                          title={activeQuestion.type === 'full_name' ? 'Delete field' : 'Delete option'}
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Option Content */}
                      <input
                        type="text"
                        value={option.content}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (activeQuestion.type === 'full_name' || activeQuestion.type === 'address') {
                            handleLocalOptionChangeWithSync(option.id, "content", newValue);
                          } else if (activeQuestion.type === 'multiple_choice' || activeQuestion.type === 'checkbox') {
                            handleLocalMcqOptionChangeWithSync(option.id, "content", newValue);
                          } else {
                            handleOptionChange(option.id, "content", newValue);
                          }
                          // Validate the content
                          validateOptionContent(option.id, newValue);
                        }}
                        onBlur={(e) => {
                          // Additional validation on blur to catch edge cases
                          validateOptionContent(option.id, e.target.value);
                        }}
                        placeholder={activeQuestion.type === 'full_name' ? `Field ${index + 1} Label` :
                          activeQuestion.type === 'multiple_choice' ? `Option ${String.fromCharCode(65 + index)}` :
                            `Option ${index + 1}`}
                        className={`w-full px-3 py-2 border rounded mb-3 text-sm transition-all duration-200 ${optionErrors[option.id]
                          ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500'
                          }`}
                      />

                      {/* Add error message display */}
                      {optionErrors[option.id] && (
                        <div className="text-xs text-red-600 mb-2 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{optionErrors[option.id]}</span>
                        </div>
                      )}

                      {/* MCQ-specific fields */}
                      {activeQuestion.type === 'multiple_choice' && (
                        <>
                          {/* Explanation field */}
                          <textarea
                            value={option.explanation || ''}
                            onChange={(e) => {
                              if (activeQuestion.type === 'multiple_choice') {
                                handleLocalMcqOptionChange(option.id, "explanation", e.target.value);
                              }
                            }}
                            placeholder="Explanation for this option (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm resize-none"
                            rows={2}
                          />

                          {/* Scoring and correctness */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`option-correct-${option.id}`}
                                checked={option.isCorrect || false}
                                onChange={(e) => {
                                  if (activeQuestion.type === 'multiple_choice') {
                                    handleLocalMcqOptionChange(option.id, "isCorrect", e.target.checked);
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <label htmlFor={`option-correct-${option.id}`} className="text-sm font-medium text-green-700">
                                ✓ Correct Answer
                              </label>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Points (+)</label>
                              <input
                                type="number"
                                value={option.points !== undefined ? option.points : (mcqSettings.defaultPoints || 1)}
                                onChange={(e) => {
                                  const newValue = parseFloat(e.target.value) || 0;
                                  if (activeQuestion.type === 'multiple_choice') {
                                    handleLocalMcqOptionChange(option.id, "points", newValue);
                                  }
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                min="0"
                                step="0.1"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Negative (-)</label>
                              <input
                                type="number"
                                value={option.negativePoints || mcqSettings.defaultNegativePoints || 0}
                                onChange={(e) => {
                                  if (activeQuestion.type === 'multiple_choice') {
                                    handleLocalMcqOptionChange(option.id, "negativePoints", parseFloat(e.target.value) || 0);
                                  }
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Show correct/points only for checkbox (non-MCQ) - Simplified for basic forms */}
                      {activeQuestion.type === 'checkbox' && (
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`option-checkbox-${option.id}`}
                                checked={option.isCorrect || false}
                                onChange={(e) => handleLocalMcqOptionChange(option.id, "isCorrect", e.target.checked)}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                              />
                              <label htmlFor={`option-checkbox-${option.id}`} className="text-sm font-medium text-gray-700">
                                Mark as important option
                              </label>
                            </div>

                            <div className="text-xs text-gray-500">
                              For form analytics only
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Use this to track which options are most important for your form analysis.
                          </p>
                        </div>
                      )}
                    </div>
                  )) || (
                  <div className="text-sm text-slate-400 italic">
                    {activeQuestion.type === 'full_name' ? 'No name fields configured' : 'No options configured'}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Text Input Settings */}
        {activeQuestion.type === "text" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Input Placeholder</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min length"
                  value={localQuestion.minLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "minLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max length"
                  value={localQuestion.maxLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "maxLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
              </div>

              {typeof localQuestion.minLength === "number" && localQuestion.minLength > 0 && (
                <div className="mb-5">
                  <label htmlFor="question-content" className="block mb-1.5 text-sm font-medium text-gray-700">
                    Error Message For Minimum Length
                  </label>
                  <textarea
                    id="question-content"
                    value={localQuestion.errorMessageForMinLength || ""}
                    onChange={(e) => handleFieldChange("errorMessageForMinLength", e.target.value)}
                    placeholder="Your result should be between Min and Max Length"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    rows={3}
                  />
                </div>
              )}

              {typeof localQuestion.maxLength === "number" && localQuestion.maxLength > 0 && (
                <div className="mb-5">
                  <label htmlFor="question-content" className="block mb-1.5 text-sm font-medium text-gray-700">
                    Error Message For Maximum Length
                  </label>
                  <textarea
                    id="question-content"
                    value={localQuestion.errorMessageForMaxLength || ""}
                    onChange={(e) => handleFieldChange("errorMessageForMaxLength", e.target.value)}
                    placeholder="Your Result should be between Min and Max Length"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    rows={3}
                  />
                </div>
              )}
              {/* VALIDATION DROPDOWN */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Validation Type</label>
                <select
                  value={localQuestion.validationType || "none"}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    handleFieldChange("validationType", selectedType);

                    // Auto-set regex patterns
                    const patterns: Record<string, string> = {
                      email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                      url: "/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?::\d+)?(\/[^\s]*)?(#[^\s]*)?$/",
                      number: "^\d+$",
                      alphanumeric: "^[a-zA-Z0-9]+$"
                    };

                    if (selectedType in patterns) {
                      handleFieldChange("validationPattern", patterns[selectedType]);
                    } else if (selectedType === "none") {
                      handleFieldChange("validationPattern", "");
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                >
                  <option value="none">No validation</option>
                  <option value="email">Email address</option>
                  <option value="url">Website URL</option>
                  <option value="phone">Phone number</option>
                  <option value="number">Numbers only</option>
                  <option value="alphanumeric">Letters and numbers only</option>
                  <option value="custom">Custom pattern</option>
                </select>
              </div>

              {/* Editable pattern input - show for any validation type except none */}
              {localQuestion.validationType &&
                localQuestion.validationType !== 'none' &&
                localQuestion.validationType !== '' && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Error Message for Validation</label>
                    <input
                      type="text"
                      placeholder="Enter error message for validation failure"
                      value={localQuestion.errorMessageForPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("errorMessageForPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}

              {localQuestion.validationType &&
                localQuestion.validationType !== 'none' &&
                localQuestion.validationType !== '' && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Validation Pattern</label>
                    <input
                      type="text"
                      placeholder="Enter regex pattern (e.g., ^[0-9]+$)"
                      value={localQuestion.validationPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("validationPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}

            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeQuestion.type === 'email' && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Input Placeholder</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
            </div>
            {localQuestion.validationType &&
              localQuestion.validationType !== 'none' &&
              localQuestion.validationType !== '' && (
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Error Message for Validation</label>
                  <input
                    type="text"
                    placeholder="Enter error message for validation failure"
                    value={localQuestion.errorMessageForPattern || ""}
                    onChange={(e) =>
                      handleFieldChange("errorMessageForPattern", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  />
                </div>
              )}
          </div>
        )}

        {/* Phone Settings */}
        {activeQuestion.type === 'phone' && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Input Placeholder</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
            </div>
            {localQuestion.validationType &&
              localQuestion.validationType !== 'none' &&
              localQuestion.validationType !== '' && (
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Error Message for Validation</label>
                  <input
                    type="text"
                    placeholder="Enter error message for validation failure"
                    value={localQuestion.errorMessageForPattern || ""}
                    onChange={(e) =>
                      handleFieldChange("errorMessageForPattern", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  />
                </div>
              )}
          </div>
        )}

        {/* Textarea Settings */}
        {activeQuestion.type === "textarea" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Input Placeholder</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Placeholder text"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min length"
                  value={localQuestion.minLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "minLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max length"
                  value={localQuestion.maxLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "maxLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
              </div>

              {typeof localQuestion.minLength === "number" && localQuestion.minLength > 0 && (
                <div className="mb-5">
                  <label htmlFor="question-content" className="block mb-1.5 text-sm font-medium text-gray-700">
                    Error Message For Minimum Length
                  </label>
                  <textarea
                    id="question-content"
                    value={localQuestion.errorMessageForMinLength || ""}
                    onChange={(e) => handleFieldChange("errorMessageForMinLength", e.target.value)}
                    placeholder="Your result should be between Min and Max Length"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    rows={3}
                  />
                </div>
              )}

              {typeof localQuestion.maxLength === "number" && localQuestion.maxLength > 0 && (
                <div className="mb-5">
                  <label htmlFor="question-content" className="block mb-1.5 text-sm font-medium text-gray-700">
                    Error Message For Maximum Length
                  </label>
                  <textarea
                    id="question-content"
                    value={localQuestion.errorMessageForMaxLength || ""}
                    onChange={(e) => handleFieldChange("errorMessageForMaxLength", e.target.value)}
                    placeholder="Your Result should be between Min and Max Length"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    rows={3}
                  />
                </div>
              )}
              {/* VALIDATION DROPDOWN */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Validation Type</label>
                <select
                  value={localQuestion.validationType || "none"}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    handleFieldChange("validationType", selectedType);

                    // Auto-set regex patterns
                    const patterns: Record<string, string> = {
                      email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                      url: "/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?::\d+)?(\/[^\s]*)?(#[^\s]*)?$/",
                      number: "^\d+$",
                      alphanumeric: "^[a-zA-Z0-9]+$"
                    };

                    if (selectedType in patterns) {
                      handleFieldChange("validationPattern", patterns[selectedType]);
                    } else if (selectedType === "none") {
                      handleFieldChange("validationPattern", "");
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                >
                  <option value="none">No validation</option>
                  <option value="email">Email address</option>
                  <option value="url">Website URL</option>
                  <option value="phone">Phone number</option>
                  <option value="number">Numbers only</option>
                  <option value="alphanumeric">Letters and numbers only</option>
                  <option value="custom">Custom pattern</option>
                </select>
              </div>

              {/* Editable pattern input - show for any validation type except none */}
              {localQuestion.validationType &&
                localQuestion.validationType !== 'none' &&
                localQuestion.validationType !== '' && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Error Message for Validation</label>
                    <input
                      type="text"
                      placeholder="Enter error message for validation failure"
                      value={localQuestion.errorMessageForPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("errorMessageForPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}

              {localQuestion.validationType &&
                localQuestion.validationType !== 'none' &&
                localQuestion.validationType !== '' && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Validation Pattern</label>
                    <input
                      type="text"
                      placeholder="Enter regex pattern (e.g., ^[0-9]+$)"
                      value={localQuestion.validationPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("validationPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}

            </div>
          </div>
        )}

        {/* Dynamic Text Fields Settings */}
        {activeQuestion.type === "dynamic_text_fields" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Input Placeholder</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Placeholder text for each field"
                value={localQuestion.placeholder || ""}
                onChange={(e) =>
                  handleFieldChange("placeholder", e.target.value)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Min length per field"
                  value={localQuestion.minLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "minLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max length per field"
                  value={localQuestion.maxLength || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "maxLength",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                  min="0"
                />
              </div>

              {typeof localQuestion.minLength === "number" && localQuestion.minLength > 0 && (
                <div className="mb-5">
                  <label htmlFor="dynamic-min-error" className="block mb-1.5 text-sm font-medium text-gray-700">
                    Error Message For Minimum Length
                  </label>
                  <textarea
                    id="dynamic-min-error"
                    value={localQuestion.errorMessageForMinLength || ""}
                    onChange={(e) => handleFieldChange("errorMessageForMinLength", e.target.value)}
                    placeholder="Each field should have minimum required characters"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    rows={3}
                  />
                </div>
              )}

              {typeof localQuestion.maxLength === "number" && localQuestion.maxLength > 0 && (
                <div className="mb-5">
                  <label htmlFor="dynamic-max-error" className="block mb-1.5 text-sm font-medium text-gray-700">
                    Error Message For Maximum Length
                  </label>
                  <textarea
                    id="dynamic-max-error"
                    value={localQuestion.errorMessageForMaxLength || ""}
                    onChange={(e) => handleFieldChange("errorMessageForMaxLength", e.target.value)}
                    placeholder="Each field should not exceed maximum characters"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 resize-vertical min-h-20 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    rows={3}
                  />
                </div>
              )}

              {/* VALIDATION DROPDOWN for dynamic fields */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Validation Type</label>
                <select
                  value={localQuestion.validationType || "none"}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    handleFieldChange("validationType", selectedType);

                    // Auto-set regex patterns
                    const patterns: Record<string, string> = {
                      email: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                      url: "^https?:\\/\\/[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?::\\d+)?(?:\\/[^\\s]*)?(#[^\\s]*)?$",
                      number: "^\\d+$",
                      alphanumeric: "^[a-zA-Z0-9]+$"
                    };

                    if (selectedType in patterns) {
                      handleFieldChange("validationPattern", patterns[selectedType]);
                    } else if (selectedType === "none") {
                      handleFieldChange("validationPattern", "");
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                >
                  <option value="none">No validation</option>
                  <option value="email">Email address</option>
                  <option value="url">Website URL</option>
                  <option value="phone">Phone number</option>
                  <option value="number">Numbers only</option>
                  <option value="alphanumeric">Letters and numbers only</option>
                  <option value="custom">Custom pattern</option>
                </select>
              </div>

              {/* Error message and pattern inputs */}
              {localQuestion.validationType &&
                localQuestion.validationType !== 'none' &&
                localQuestion.validationType !== '' && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Error Message for Validation</label>
                    <input
                      type="text"
                      placeholder="Enter error message for validation failure"
                      value={localQuestion.errorMessageForPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("errorMessageForPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}

              {localQuestion.validationType &&
                localQuestion.validationType !== 'none' &&
                localQuestion.validationType !== '' && (
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">Validation Pattern</label>
                    <input
                      type="text"
                      placeholder="Enter regex pattern (e.g., ^[0-9]+$)"
                      value={localQuestion.validationPattern || ""}
                      onChange={(e) =>
                        handleFieldChange("validationPattern", e.target.value)
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                    />
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Number Settings */}
        {activeQuestion.type === "number" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Number Settings</label>
            <div className="flex gap-3 items-center flex-wrap">
              <input
                type="number"
                placeholder="Min value"
                className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <input
                type="number"
                placeholder="Max value"
                className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <select className="w-auto min-w-40 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100">
                <option value="">Any number</option>
                <option value="integer">Whole numbers only</option>
                <option value="decimal">Decimal numbers</option>
              </select>
            </div>
          </div>
        )}

        {/* File Upload Settings */}
        {activeQuestion.type === "file" && (
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-medium text-gray-700">File Upload Settings</label>
            <div className="flex gap-3 items-center flex-wrap">
              <input
                type="text"
                placeholder="Allowed file types (e.g., .pdf,.doc,.jpg)"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
              />
              <input
                type="number"
                placeholder="Max file size (MB)"
                className="w-auto min-w-32 px-3 py-2.5 border border-gray-300 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:shadow-sm focus:shadow-indigo-100"
                min="1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailEditor;