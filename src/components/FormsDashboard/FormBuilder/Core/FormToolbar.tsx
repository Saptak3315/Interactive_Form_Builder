import React from 'react';
import './FormToolbar.css';
import { useFormContext } from '../../../../context/FormContext/FormProvider';
import { addQuestion, createDefaultQuestion } from '../../../../context/FormContext/formActions';
import './FormToolbar.css';

interface QuestionTypeOption {
  type: string;
  label: string;
  icon: string;
  description: string;
}

const FormToolbar: React.FC = () => {
  const { state, dispatch } = useFormContext();

  const questionTypes: QuestionTypeOption[] = [
    { type: 'text', label: 'Short Text', icon: '📝', description: 'Single line text input' },
    { type: 'textarea', label: 'Long Text', icon: '📄', description: 'Multi-line text input' },
    { type: 'multiple_choice', label: 'Multiple Choice', icon: '🔘', description: 'Single selection from options' },
    { type: 'checkbox', label: 'Checkboxes', icon: '☑️', description: 'Multiple selections from options' },
    { type: 'number', label: 'Number', icon: '🔢', description: 'Numeric input' },
    { type: 'file', label: 'File Upload', icon: '📎', description: 'File attachment' },
    { type: 'audio', label: 'Audio', icon: '🎵', description: 'Audio recording or upload' },
  ];

  const handleAddQuestion = (questionType: string) => {
    const orderPosition = state.questions.length;
    const newQuestion = createDefaultQuestion(questionType as any, orderPosition);
    dispatch(addQuestion(newQuestion));
  };

  const handleSaveForm = () => {
    // TODO: Implement save functionality
    // For now, just mark as saved
    alert('Form saved successfully! (This is temporary)');
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
    <div className="form-toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Add Questions</h3>
        <div className="question-types-grid">
          {questionTypes.map((questionType) => (
            <button
              key={questionType.type}
              className="question-type-btn"
              onClick={() => handleAddQuestion(questionType.type)}
              title={questionType.description}
            >
              <span className="question-type-icon">{questionType.icon}</span>
              <span className="question-type-label">{questionType.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">Form Actions</h3>
        <div className="form-actions">
          <button 
            className="toolbar-btn save-btn"
            onClick={handleSaveForm}
            disabled={state.isFormSaved}
          >
            💾 Save
          </button>
          <button 
            className="toolbar-btn preview-btn"
            onClick={handlePreviewForm}
          >
            👁️ Preview
          </button>
          <button 
            className="toolbar-btn publish-btn"
            onClick={handlePublishForm}
          >
            🚀 Publish
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">Form Stats</h3>
        <div className="form-stats">
          <div className="stat-item">
            <span className="stat-label">Questions:</span>
            <span className="stat-value">{state.questions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Responses:</span>
            <span className="stat-value">0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormToolbar;