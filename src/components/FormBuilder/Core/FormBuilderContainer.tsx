// src/components/FormBuilder/Core/FormBuilderContainer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FormHeader from './FormHeader';
import FormSidebar from './FormSidebar';
import QuestionEditor from './QuestionEditor';
import QuestionDetailEditor from '../Questions/QuestionDetailEditor';
import { useFormContext } from '../../../context/FormContext/FormProvider';

const FormBuilderContainer: React.FC = () => {
  const { state, formVersion, isFormLoading } = useFormContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const navigate = useNavigate();

  // Create a stable key for the entire form builder that changes when form significantly changes
  const builderKey = useMemo(() => {
    return `builder-${state.formId || 'new'}-${formVersion}`;
  }, [state.formId, formVersion]);

  useEffect(() => {
    // Debug to verify state is being properly passed
    console.log('FormBuilderContainer state:', {
      formId: state.formId,
      questionsCount: state.questions.length,
      formVersion,
      isFormLoading
    });
  }, [state, formVersion, isFormLoading]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleRightPanel = () => {
    setRightPanelOpen(!rightPanelOpen);
  };

  // Show loading overlay when form operations are in progress
  if (isFormLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Processing...</h3>
          <p className="text-slate-600">Please wait while we process your form</p>
        </div>
      </div>
    );
  }

  return (
    <div key={builderKey} className="h-screen flex flex-col bg-slate-50">
      {/* Top Header with FormCraft Logo */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold text-slate-800">FormCraft</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${state.isFormSaved ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              {state.isFormSaved ? 'Saved' : 'Unsaved changes'}
            </span>
            <span>{state.questions.length} questions</span>
          </div>
        </div>
      </div>

      {/* Form Header - Now Narrower */}
      <div className="bg-white border-b border-slate-200 py-1">
        <FormHeader />
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* Sidebar */}
        <div className={`bg-white border-r border-slate-200 transition-all duration-300 ease-in-out overflow-y-auto z-10 ${
          sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
        }`}>
          <FormSidebar />
        </div>

        {/* Sidebar Toggle Button */}
        <button
          className={`absolute top-5 z-15 w-8 h-8 bg-white border border-slate-200 cursor-pointer flex items-center justify-center text-sm text-slate-500 transition-all duration-300 ease-in-out shadow-md hover:bg-slate-50 hover:text-slate-700 ${
            sidebarOpen
              ? 'left-80 rounded-r-md border-l-0'
              : 'left-0 rounded-r-md'
          }`}
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* Editor Section */}
        <div className={`flex-1 bg-slate-50 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'ml-10' : 'ml-10'
        } ${
          rightPanelOpen ? 'mr-10' : 'mr-10'
        }`}>
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Force re-render of QuestionEditor when form structure changes */}
            <QuestionEditor key={`editor-${builderKey}`} />
          </div>
        </div>

        {/* Right Panel (Details Only) */}
        <div className={`border-l border-slate-200 flex flex-col bg-white transition-all duration-300 ease-in-out overflow-y-auto z-10 ${
          rightPanelOpen ? 'w-96' : 'w-0 overflow-hidden'
        }`}>
          {/* Panel Header */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="px-4 py-3 text-lg text-indigo-600 relative flex items-center gap-2 flex-1">
              <span>⚙️</span>
              <span className="font-medium">Field Details</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto">
            {/* Force re-render of QuestionDetailEditor when form structure changes */}
            <QuestionDetailEditor key={`details-${builderKey}`} />
          </div>
        </div>

        {/* Right Panel Toggle Button */}
        <button 
          className={`absolute top-5 z-15 w-8 h-8 bg-white border border-slate-200 cursor-pointer flex items-center justify-center text-sm text-slate-500 transition-all duration-300 ease-in-out shadow-md hover:bg-slate-50 hover:text-slate-700 ${
            rightPanelOpen 
              ? 'right-96 rounded-l-md border-r-0' 
              : 'right-0 rounded-l-md'
          }`}
          onClick={toggleRightPanel}
          title={rightPanelOpen ? 'Hide field details' : 'Show field details'}
        >
          {rightPanelOpen ? '▶' : '◀'}
        </button>
      </div>
    </div>
  );
};

export default FormBuilderContainer;