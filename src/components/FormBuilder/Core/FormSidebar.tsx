// src/components/FormBuilder/Core/FormSidebar.tsx

import Swal from 'sweetalert2';
import { setForm } from '../../../context/FormContext/formActions';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import DraggableQuestionType from './DraggableQuestionType';
import { useNavigate } from 'react-router-dom';

interface QuestionTypeOption {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: string;
}

const FormSidebar = () => {
  const { state, dispatch, saveCurrentForm, clearCurrentForm } = useFormContext();
  const navigate = useNavigate();

  const questionTypes: QuestionTypeOption[] = [
    { type: 'text', label: 'Full Name', icon: '👤', description: 'Person\'s full name', category: 'Basic' },
    { type: 'textarea', label: 'Address', icon: '🏠', description: 'Street address or location', category: 'Basic' },
    { type: 'text', label: 'Email', icon: '📧', description: 'Email address', category: 'Basic' },
    { type: 'text', label: 'Phone', icon: '📞', description: 'Phone number', category: 'Basic' },
    { type: 'text', label: 'Short Text', icon: '📝', description: 'Single line text input', category: 'Basic' },
    { type: 'textarea', label: 'Long Text', icon: '📄', description: 'Multi-line text input', category: 'Basic' },
    { type: 'number', label: 'Number', icon: '🔢', description: 'Numeric input', category: 'Basic' },
    { type: 'multiple_choice', label: 'Multiple Choice', icon: '🔘', description: 'Single selection from options', category: 'Choice' },
    { type: 'checkbox', label: 'Checkboxes', icon: '☑️', description: 'Multiple selections from options', category: 'Choice' },
    { type: 'file', label: 'File Upload', icon: '📎', description: 'File attachment', category: 'Media' },
    { type: 'audio', label: 'Audio', icon: '🎵', description: 'Audio recording or upload', category: 'Media' },
    { type: 'calculated', label: 'Calculated', icon: '🧮', description: 'Formula-based calculation', category: 'Advanced' },
  ];

  const groupedQuestionTypes = questionTypes.reduce((acc, questionType) => {
    if (!acc[questionType.category]) {
      acc[questionType.category] = [];
    }
    acc[questionType.category].push(questionType);
    return acc;
  }, {} as Record<string, QuestionTypeOption[]>);

  const handleSaveForm = () => {
    try {
      // Use the context's save function
      saveCurrentForm();
      Swal.fire('Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      Swal.fire('There was an error saving your form. Please try again.');
    }
  };

  const handleNewForm = () => {
    if (!state.isFormSaved && state.questions.length > 0) {
      const shouldSave = window.confirm(
        'You have unsaved changes. Would you like to save before creating a new form?'
      );
      if (shouldSave) {
        try {
          saveCurrentForm();
        } catch (error) {
          console.error('Error saving form:', error);
          Swal.fire('There was an error saving your form.');
          return;
        }
      }
    }

    clearCurrentForm();
    Swal.fire('New form created! Start building...');
  };

  const handlePublishForm = () => {
    // Save the form first if it has changes
    if (!state.isFormSaved) {
      try {
        saveCurrentForm();
      } catch (error) {
        console.error('Error saving form:', error);
        Swal.fire('There was an error saving your form. Please try again.');
        return;
      }
    }

    // Check if form has content
    if (state.questions.length === 0) {
      Swal.fire('Please add at least one question before publishing.');
      return;
    }

    if (!state.title.trim()) {
      Swal.fire('Please add a title to your form before publishing.');
      return;
    }

    // Navigate to publish page
    navigate('/publish-form');
  };

  const handlePreviewForm = () => {
    if (state.questions.length === 0) {
      Swal.fire('Please add some questions to preview the form.');
      return;
    }

    // Save current form state before navigating to preview
    if (!state.isFormSaved) {
      try {
        saveCurrentForm();
      } catch (error) {
        console.error('Error saving form before preview:', error);
        // Continue to preview even if save fails
      }
    }

    // Navigate to full preview page
    navigate('/form-preview');
  };

  const handleBackToDashboard = () => {
    if (!state.isFormSaved && state.questions.length > 0) {
      const shouldSave = window.confirm(
        'You have unsaved changes. Would you like to save before leaving?'
      );
      if (shouldSave) {
        try {
          saveCurrentForm();
        } catch (error) {
          console.error('Error saving form:', error);
          Swal.fire('There was an error saving your form.');
          return;
        }
      }
    }

    navigate('/');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Sidebar Header */}
      <div className="px-5 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 m-0">
          FormCraft
        </h2>
        <p className="text-sm text-slate-600 m-0">
          Drag questions to build your form
        </p>
      </div>

      {/* Question Types Section */}
      <div className="p-5 border-b border-slate-200">
        <h3 className="text-base font-semibold text-gray-700 mb-4 m-0">
          Field Types
        </h3>
        <div className="flex flex-col gap-5">
          {Object.entries(groupedQuestionTypes).map(([category, types]) => (
            <div key={category} className="bg-white rounded-lg p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 m-0">
                {category}
              </h4>
              <div className="flex flex-col gap-2">
                {types.map((questionType) => (
                  <DraggableQuestionType
                    key={questionType.type}
                    questionType={questionType}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions Section */}
      <div className="p-5 border-b border-slate-200">
        <h3 className="text-base font-semibold text-gray-700 mb-4 m-0">
          Form Actions
        </h3>
        <div className="flex flex-col gap-3">
          <button
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 bg-white rounded-lg cursor-pointer font-medium transition-all duration-200 text-left hover:bg-green-500 hover:text-white hover:border-green-500"
            onClick={handleSaveForm}
          >
            <span className="text-base">💾</span>
            Save Form
          </button>

          <button
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 bg-white rounded-lg cursor-pointer font-medium transition-all duration-200 text-left hover:bg-indigo-500 hover:text-white hover:border-indigo-500"
            onClick={handleNewForm}
          >
            <span className="text-base">📝</span>
            New Form
          </button>

          <button
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 bg-white rounded-lg cursor-pointer font-medium transition-all duration-200 text-left hover:bg-blue-500 hover:text-white hover:border-blue-500"
            onClick={handlePreviewForm}
          >
            <span className="text-base">👁️</span>
            Full Preview
          </button>

          <button
            className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer font-medium transition-all duration-200 text-left ${state.questions.length > 0 && state.title.trim()
                ? 'border-slate-300 bg-white hover:bg-purple-500 hover:text-white hover:border-purple-500'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            onClick={handlePublishForm}
            disabled={state.questions.length === 0 || !state.title.trim()}
          >
            <span className="text-base">🚀</span>
            Publish Form
          </button>

          <button
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 bg-white rounded-lg cursor-pointer font-medium transition-all duration-200 text-left hover:bg-gray-500 hover:text-white hover:border-gray-500"
            onClick={handleBackToDashboard}
          >
            <span className="text-base">🏠</span>
            Dashboard
          </button>
        </div>
      </div>

      {/* Form Stats Section */}
      <div className="p-5 flex-1">
        <h3 className="text-base font-semibold text-gray-700 mb-4 m-0">
          Form Statistics
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center justify-center w-10 h-10 text-2xl bg-slate-100 rounded-lg">
              📋
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-slate-800 leading-none">
                {state.questions.length}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Questions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center justify-center w-10 h-10 text-2xl bg-slate-100 rounded-lg">
              📊
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-slate-800 leading-none">
                0
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Responses
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center justify-center w-10 h-10 text-2xl bg-slate-100 rounded-lg">
              {state.isFormSaved ? '✅' : '⏳'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-800 leading-none">
                {state.isFormSaved ? 'Saved' : 'Auto-saving...'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Status
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSidebar;