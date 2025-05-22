import { setForm } from '../../../context/FormContext/formActions';
import { useFormContext } from '../../../context/FormContext/FormProvider';
import FormStorageService from '../../../services/FormStorageService';
import DraggableQuestionType from './DraggableQuestionType';
import './FormSidebar.css';

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
    <div className="form-sidebar">
      <div className="sidebar-header">
        <h2>FormCraft</h2>
        <p>Drag questions to build your form</p>
      </div>

      {/* Question Types Section */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Question Types</h3>
        <div className="question-categories">
          {Object.entries(groupedQuestionTypes).map(([category, types]) => (
            <div key={category} className="question-category">
              <h4 className="category-title">{category}</h4>
              <div className="question-types-list">
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
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Form Actions</h3>
        <div className="form-actions">
          <button 
            className="sidebar-btn save-btn"
            onClick={handleSaveForm}
            disabled={state.isFormSaved}
          >
            <span className="btn-icon">💾</span>
            Save Form
          </button>
          <button 
            className="sidebar-btn preview-btn"
            onClick={handlePreviewForm}
          >
            <span className="btn-icon">👁️</span>
            Full Preview
          </button>
          <button 
            className="sidebar-btn publish-btn"
            onClick={handlePublishForm}
          >
            <span className="btn-icon">🚀</span>
            Publish Form
          </button>
        </div>
      </div>

      {/* Form Stats Section */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Form Statistics</h3>
        <div className="form-stats">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{state.questions.length}</div>
              <div className="stat-label">Questions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">0</div>
              <div className="stat-label">Responses</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSidebar;