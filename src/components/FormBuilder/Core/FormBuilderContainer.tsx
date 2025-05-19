// src/components/FormBuilder/Core/FormBuilderContainer.tsx

import React, { useState } from 'react';
import FormHeader from './FormHeader';
import FormSidebar from './FormSidebar';
import QuestionEditor from './QuestionEditor';
import FormPreview from './FormPreview';
import './FormBuilderContainer.css';
import { useFormContext } from '../../../context/FormContext/FormProvider';

const FormBuilderContainer: React.FC = () => {
  const { state } = useFormContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="form-builder-container">
      {/* Header with form title and description */}
      <FormHeader />
      
      {/* Main content area */}
      <div className="form-builder-content">
        {/* Collapsible Left Sidebar */}
        <div className={`form-sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
          <FormSidebar />
        </div>

        {/* Sidebar Toggle Button */}
        <button 
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        
        {/* Main Editor Area */}
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
        
        {/* Right Preview Panel */}
        <div className="form-builder-preview">
          <div className="preview-header">
            <h3>Preview</h3>
            <div className="preview-controls">
              <button className="preview-device-btn active" data-device="desktop">
                🖥️
              </button>
              {/* <button className="preview-device-btn" data-device="tablet">
                📱
              </button>
              <button className="preview-device-btn" data-device="mobile">
                📱
              </button> */}
            </div>
          </div>
          <div className="preview-content">
            <FormPreview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderContainer;