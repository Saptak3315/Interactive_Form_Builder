// src/components/FormBuilder/Core/FormBuilderContainer.tsx
import React, { useState, useEffect } from 'react';
import FormHeader from './FormHeader';
import FormSidebar from './FormSidebar';
import QuestionEditor from './QuestionEditor';
import FormPreview from './FormPreview';
import QuestionDetailEditor from '../Questions/QuestionDetailEditor';
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
    <div className="h-screen flex flex-col bg-slate-50">
      <FormHeader />
      
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
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        
        {/* Editor Section */}
        <div className={`flex-1 bg-white flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'ml-10' : 'ml-10'
        }`}>
          <div className="px-5 py-5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 m-0">
              Edit Form
            </h3>
            <span className="text-sm text-slate-600">
              {state.questions.length} {state.questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            <QuestionEditor />
          </div>
        </div>
        
        {/* Right Panel (Preview/Details) */}
        <div className="w-96 border-l border-slate-200 flex flex-col bg-white">
          {/* Panel Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button 
              className={`px-4 py-3 bg-none border-0 text-lg cursor-pointer relative transition-all duration-200 ${
                activePanel === 'preview' 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
              onClick={() => setActivePanel('preview')}
              title="Preview Form"
            >
              👁️
              {activePanel === 'preview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
            <button 
              className={`px-4 py-3 bg-none border-0 text-lg cursor-pointer relative transition-all duration-200 ${
                activePanel === 'details' 
                  ? 'text-indigo-600' 
                  : state.activeQuestionId 
                    ? 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600' 
                    : 'text-slate-300 cursor-not-allowed'
              }`}
              onClick={() => setActivePanel('details')}
              title="Question Details"
              disabled={!state.activeQuestionId}
            >
              ⚙️
              {activePanel === 'details' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
          </div>
          
          {/* Panel Content */}
          <div className="flex-1 overflow-auto">
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