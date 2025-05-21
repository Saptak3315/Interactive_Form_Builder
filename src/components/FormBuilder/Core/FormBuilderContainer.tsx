// src/components/FormBuilder/Core/FormBuilderContainer.tsx
import React, { useState, useEffect } from 'react';
import FormHeader from './FormHeader';
import FormSidebar from './FormSidebar';
import QuestionEditor from './QuestionEditor';
import FormPreview from './FormPreview';
import QuestionDetailEditor from '../Questions/QuestionDetailEditor'; // Import the QuestionDetailEditor
import './FormBuilderContainer.css';
import { useFormContext } from '../../../context/FormContext/FormProvider';

const FormBuilderContainer: React.FC = () => {
  const { state } = useFormContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [activePanel, setActivePanel] = useState<'preview' | 'details'>('preview');

  useEffect(() => {
    // Debug to verify state is being properly passed
    console.log('FormBuilderContainer state:', state);
  }, [state]);

  useEffect(() => {
    console.log('FormBuilderContainer: questions updated', state.questions);
    setUpdateCounter(prev => prev + 1);
  }, [state.questions]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show details panel when a question is selected
  useEffect(() => {
    if (state.activeQuestionId) {
      setActivePanel('details');
    }
  }, [state.activeQuestionId]);

  return (
    <div className="form-builder-container">
      <FormHeader />
      
      <div className="form-builder-content">
        <div className={`form-sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
          <FormSidebar />
        </div>

        <button 
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        
        <div className="form-builder-editor">
          <div className="editor-header">
            <h3>Edit Form</h3>
            <span className="question-count">
              {state.questions.length} {state.questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>
          <div className="editor-content">
            <QuestionEditor />
          </div>
        </div>
        
        <div className="form-builder-panel">
          <div className="panel-tabs">
            <button 
              className={`panel-tab ${activePanel === 'preview' ? 'active' : ''}`}
              onClick={() => setActivePanel('preview')}
              title="Preview Form"
            >
              👁️
            </button>
            <button 
              className={`panel-tab ${activePanel === 'details' ? 'active' : ''}`}
              onClick={() => setActivePanel('details')}
              title="Question Details"
              disabled={!state.activeQuestionId}
            >
              ⚙️
            </button>
          </div>
          <div className="panel-content">
            {activePanel === 'preview' ? (
              <FormPreview />
            ) : (
              <QuestionDetailEditor />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderContainer;