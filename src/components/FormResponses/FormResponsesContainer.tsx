// src/components/FormResponses/FormResponsesContainer.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClipboardList,
  faUsers,
  faCalendarAlt,
  faDownload,
  faEye,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import FormStorageService from '../../services/FormStorageService';
import type { FormState } from '../../types/form.types';

interface FormSubmission {
  id: number;
  formId: number;
  startedAt: string;
  completedAt: string | null;
  responses: Array<{
    questionId: number;
    answer: any;
    isValid: boolean;
  }>;
}

const FormResponsesContainer: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    if (!formId) {
      navigate('/');
      return;
    }

    loadFormAndSubmissions();
  }, [formId, navigate]);

  const loadFormAndSubmissions = async () => {
    try {
      setLoading(true);
      
      // Load form details
      const formData = FormStorageService.getFormById(parseInt(formId!));
      if (!formData) {
        console.error('Form not found');
        navigate('/');
        return;
      }
      setForm(formData);

      // Load submissions for this form
      const formSubmissions = FormStorageService.getSubmissions(parseInt(formId!));
      setSubmissions(formSubmissions);
      
    } catch (error) {
      console.error('Error loading form responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
  };

  const handleExportResponses = () => {
    // Future implementation for CSV export
    console.log('Export functionality coming soon');
  };

  const getQuestionById = (questionId: number) => {
    return form?.questions.find(q => q.id === questionId);
  };

  const formatAnswer = (answer: any, questionType: string): string => {
    if (!answer) return 'No answer';
    
    switch (questionType) {
      case 'multiple_choice':
      case 'checkbox':
        if (Array.isArray(answer)) {
          const question = form?.questions.find(q => q.type === questionType);
          return answer.map(optionId => {
            const option = question?.options?.find(opt => opt.id === optionId);
            return option?.content || `Option ${optionId}`;
          }).join(', ');
        } else {
          const question = form?.questions.find(q => q.type === questionType);
          const option = question?.options?.find(opt => opt.id === answer);
          return option?.content || `Option ${answer}`;
        }
      
      case 'full_name':
      case 'address':
        if (Array.isArray(answer)) {
          return answer.filter(val => val && val.trim()).join(', ');
        }
        return String(answer);
      
      case 'dynamic_text_fields':
        if (Array.isArray(answer)) {
          return answer.filter(val => val && val.trim()).join(', ');
        }
        return String(answer);
      
      case 'file':
        return answer instanceof File ? answer.name : 'File uploaded';
      
      default:
        return String(answer);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading responses...</h3>
          <p className="text-slate-600">Please wait while we fetch the form responses</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Form not found</h3>
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faChartBar} className="text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-800">Form Responses</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportResponses}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={submissions.length === 0}
              >
                <FontAwesomeIcon icon={faDownload} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Form Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  {form.title}
                </h2>
                <p className="text-slate-600 mb-4">
                  {form.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClipboardList} />
                    {form.questions.length} Questions
                  </span>
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} />
                    {submissions.length} Responses
                  </span>
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    Form ID: {formId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responses Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Responses List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                All Responses ({submissions.length})
              </h3>
            </div>
            
            <div className="p-6">
              {submissions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-4">📋</div>
                  <h4 className="text-lg font-medium mb-2">No responses yet</h4>
                  <p>Responses will appear here once users submit the form</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedSubmission?.id === submission.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">
                            Response #{submission.id}
                          </div>
                          <div className="text-sm text-slate-500">
                            {submission.completedAt
                              ? `Completed: ${new Date(submission.completedAt).toLocaleString()}`
                              : `Started: ${new Date(submission.startedAt).toLocaleString()}`
                            }
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            submission.completedAt
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {submission.completedAt ? 'Complete' : 'Incomplete'}
                          </span>
                          <FontAwesomeIcon icon={faEye} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Response Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Response Details
              </h3>
            </div>
            
            <div className="p-6">
              {!selectedSubmission ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-4">👈</div>
                  <h4 className="text-lg font-medium mb-2">Select a response</h4>
                  <p>Click on a response from the list to view its details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Response Header */}
                  <div className="pb-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium text-slate-800">
                        Response #{selectedSubmission.id}
                      </h4>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        selectedSubmission.completedAt
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedSubmission.completedAt ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      <div>Started: {new Date(selectedSubmission.startedAt).toLocaleString()}</div>
                      {selectedSubmission.completedAt && (
                        <div>Completed: {new Date(selectedSubmission.completedAt).toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  {/* Answers */}
                  <div className="space-y-4">
                    {selectedSubmission.responses.map((response) => {
                      const question = getQuestionById(response.questionId);
                      if (!question) return null;

                      return (
                        <div key={response.questionId} className="p-4 bg-slate-50 rounded-lg">
                          <div className="font-medium text-slate-800 mb-2">
                            {question.content}
                          </div>
                          <div className={`text-slate-700 ${
                            !response.isValid ? 'text-red-600' : ''
                          }`}>
                            {formatAnswer(response.answer, question.type)}
                          </div>
                          {!response.isValid && (
                            <div className="text-xs text-red-500 mt-1">
                              ⚠️ Invalid response
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormResponsesContainer;