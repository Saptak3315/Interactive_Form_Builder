import { setForm } from '../../../context/FormContext/formActions';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import FormStorageService from '../../../services/FormStorageService';
import DraggableQuestionType from './DraggableQuestionType';

interface QuestionTypeOption {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: string;
}

const FormSidebar = () => {
  const { state, dispatch } = useFormContext();

  const questionTypes: QuestionTypeOption[] = [
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
      // Save the current form state
      const savedForm = FormStorageService.saveForm(state);
      // Update the form ID if it was newly created
      if (state.formId !== savedForm.formId) {
        dispatch(setForm({ formId: savedForm.formId }));
      }
      // Update saved status
      dispatch(setForm({ isFormSaved: true }));
      alert('Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('There was an error saving your form. Please try again.');
    }
  };

  const handlePublishForm = () => {
    // TODO: Implement publish functionality
    alert('Form published successfully! (This is temporary)');
  };

  const handlePreviewForm = () => {
    // TODO: Implement full screen preview
    alert('Opening full preview... (This is temporary)');
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
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 bg-white rounded-lg cursor-pointer font-medium transition-all duration-200 text-left hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-900 disabled:hover:border-slate-300"
            onClick={handleSaveForm}
            disabled={state.isFormSaved}
          >
            <span className="text-base">💾</span>
            Save Form
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 bg-white rounded-lg cursor-pointer font-medium transition-all duration-200 text-left hover:bg-blue-500 hover:text-white hover:border-blue-500"
            onClick={handlePreviewForm}
          >
            <span className="text-base">👁️</span>
            Full Preview
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-3 border border-slate-300 bg-white rounded-lg cursor-pointer font-medium transition-all duration-200 text-left hover:bg-purple-500 hover:text-white hover:border-purple-500"
            onClick={handlePublishForm}
          >
            <span className="text-base">🚀</span>
            Publish Form
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
        </div>
      </div>
    </div>
  );
};

export default FormSidebar;