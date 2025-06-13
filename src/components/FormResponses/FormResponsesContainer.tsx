// src/components/FormResponses/FormResponsesContainer.tsx
import React, { useState, useEffect, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClipboardList,
  faUsers,
  faCalendarAlt,
  faDownload,
  faEye,
  faChartBar,
  faCheckCircle,
  faExclamationTriangle,
  faUser,
  faClock,
  faFileAlt,
  faImage,
  faVideo,
  faMusic,
  faQuestionCircle
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

      const formData = FormStorageService.getFormById(parseInt(formId!));
      if (!formData) {
        console.error('Form not found');
        navigate('/');
        return;
      }
      setForm(formData);

      const formSubmissions = FormStorageService.getSubmissions(parseInt(formId!));
      setSubmissions(formSubmissions);

    } catch (error) {
      console.error('Error loading form responses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add effect to refresh dashboard when responses change
  useEffect(() => {
    // Listen for storage changes to update counts in real-time
    const handleStorageChange = () => {
      loadFormAndSubmissions();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
  };

  const handleExportResponses = () => {
    console.log('Export functionality coming soon');
  };

  const getQuestionById = (questionId: number) => {
    return form?.questions.find(q => q.id === questionId);
  };

  const getQuestionIcon = (type: string) => {
    const icons: Record<string, any> = {
      text: faFileAlt,
      textarea: faFileAlt,
      email: faUser,
      phone: faUser,
      number: faFileAlt,
      multiple_choice: faQuestionCircle,
      checkbox: faQuestionCircle,
      full_name: faUser,
      address: faUser,
      file: faImage,
      audio: faMusic,
      dynamic_text_fields: faFileAlt,
      calculated: faFileAlt
    };
    return icons[type] || faQuestionCircle;
  };

  const formatDetailedAnswer = (response: any, question: any): JSX.Element => {
    const { answer } = response;

    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      return (
        <div className="flex items-center gap-2 text-slate-400 italic py-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-400" />
          <span>No answer provided</span>
        </div>
      );
    }

    switch (question.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div className="py-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-800 font-medium break-words">
                {String(answer)}
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Character count: {String(answer).length}
            </div>
          </div>
        );

      case 'multiple_choice':
        const isMultiSelect = question.mcqSettings?.allowMultipleCorrect || false;

        if (isMultiSelect && Array.isArray(answer)) {
          return (
            <div className="py-3 space-y-3">
              {question.options?.map((option: any) => {
                const isSelected = answer.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${isSelected
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className={`flex-1 ${isSelected ? 'text-indigo-800 font-medium' : 'text-slate-600'}`}>
                      {option.content}
                    </span>
                    {isSelected && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-indigo-600" />
                    )}
                  </div>
                );
              })}
            </div>
          );
        } else {
          // Single select
          return (
            <div className="py-3 space-y-2">
              {question.options?.map((option: any) => {
                const isSelected = option.id === answer;
                return (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${isSelected
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <input
                      type="radio"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className={`flex-1 ${isSelected ? 'text-indigo-800 font-medium' : 'text-slate-600'}`}>
                      {option.content}
                    </span>
                    {isSelected && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-indigo-600" />
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

      case 'checkbox':
        const selectedOptions = Array.isArray(answer) ? answer : [];
        return (
          <div className="py-3 space-y-2">
            {question.options?.map((option: any) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${isSelected
                      ? 'bg-green-50 border-green-200'
                      : 'bg-slate-50 border-slate-200'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className={`flex-1 ${isSelected ? 'text-green-800 font-medium' : 'text-slate-600'}`}>
                    {option.content}
                  </span>
                  {isSelected && (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'full_name':
      case 'address':
        const values = Array.isArray(answer) ? answer : [];
        return (
          <div className="py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options?.map((option: any, index: number) => (
                <div key={option.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    {option.content}
                  </div>
                  <div className="text-slate-800 font-medium">
                    {values[index] || <span className="text-slate-400 italic">Not provided</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'dynamic_text_fields':
        const dynamicValues = Array.isArray(answer) ? answer.filter(val => val && val.trim()) : [];
        return (
          <div className="py-3">
            {dynamicValues.length > 0 ? (
              <div className="space-y-3">
                {dynamicValues.map((value: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="text-slate-800 font-medium flex-1">
                      {value}
                    </div>
                  </div>
                ))}
                <div className="text-xs text-slate-500 mt-2">
                  Total items: {dynamicValues.length}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic py-3">No items added</div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="py-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faImage} className="text-slate-400 text-xl" />
              <div>
                <div className="text-slate-800 font-medium">
                  {answer instanceof File ? answer.name : 'File uploaded'}
                </div>
                <div className="text-xs text-slate-500">
                  {answer instanceof File ? `${(answer.size / 1024).toFixed(1)} KB` : 'File size unknown'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="py-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faMusic} className="text-slate-400 text-xl" />
              <div>
                <div className="text-slate-800 font-medium">Audio recorded</div>
                <div className="text-xs text-slate-500">Audio response provided</div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-800 font-medium">
                {String(answer)}
              </div>
            </div>
          </div>
        );
    }
  };

  const calculateCompletionTime = (submission: FormSubmission): string => {
    if (!submission.completedAt) return 'Not completed';

    const startTime = new Date(submission.startedAt).getTime();
    const endTime = new Date(submission.completedAt).getTime();
    const diffMinutes = Math.round((endTime - startTime) / (1000 * 60));

    if (diffMinutes < 1) return 'Less than 1 minute';
    if (diffMinutes === 1) return '1 minute';
    return `${diffMinutes} minutes`;
  };

  const getValidationSummary = (submission: FormSubmission) => {
    const total = submission.responses.length;
    const valid = submission.responses.filter(r => r.isValid).length;
    const invalid = total - valid;

    return { total, valid, invalid, percentage: total > 0 ? Math.round((valid / total) * 100) : 0 };
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
                  {submissions.map((submission) => {
                    const validationSummary = getValidationSummary(submission);
                    return (
                      <div
                        key={submission.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedSubmission?.id === submission.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        onClick={() => handleViewSubmission(submission)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-slate-800">
                            Response #{submission.id}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${submission.completedAt
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                              }`}>
                              {submission.completedAt ? 'Complete' : 'Incomplete'}
                            </span>
                            <FontAwesomeIcon icon={faEye} className="text-slate-400" />
                          </div>
                        </div>
                        <div className="text-sm text-slate-500 space-y-1">
                          <div>
                            {submission.completedAt
                              ? `Completed: ${new Date(submission.completedAt).toLocaleString()}`
                              : `Started: ${new Date(submission.startedAt).toLocaleString()}`
                            }
                          </div>
                          <div className="flex items-center gap-4">
                            <span>⏱️ {calculateCompletionTime(submission)}</span>
                            <span className={`flex items-center gap-1 ${validationSummary.percentage === 100 ? 'text-green-600' : 'text-orange-600'
                              }`}>
                              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                              {validationSummary.valid}/{validationSummary.total} valid
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Response Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Response Details
              </h3>
            </div>

            <div className="overflow-y-auto max-h-[800px]">
              {!selectedSubmission ? (
                <div className="p-6 text-center py-12 text-slate-500">
                  <div className="text-4xl mb-4">👈</div>
                  <h4 className="text-lg font-medium mb-2">Select a response</h4>
                  <p>Click on a response from the list to view its details</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Enhanced Response Header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-indigo-800 mb-1">
                          Response #{selectedSubmission.id}
                        </h4>
                        <div className="text-sm text-indigo-600">
                          Submission Details
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedSubmission.completedAt
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                        {selectedSubmission.completedAt ? '✅ Complete' : '⏳ Incomplete'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FontAwesomeIcon icon={faClock} className="text-indigo-500" />
                        <span className="font-medium">Started:</span>
                        <span>{new Date(selectedSubmission.startedAt).toLocaleString()}</span>
                      </div>
                      {selectedSubmission.completedAt && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                          <span className="font-medium">Completed:</span>
                          <span>{new Date(selectedSubmission.completedAt).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                        <span className="font-medium">Duration:</span>
                        <span>{calculateCompletionTime(selectedSubmission)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <FontAwesomeIcon icon={faClipboardList} className="text-purple-500" />
                        <span className="font-medium">Answers:</span>
                        <span>{(() => {
                          const summary = getValidationSummary(selectedSubmission);
                          return `${summary.valid}/${summary.total} valid (${summary.percentage}%)`;
                        })()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Answers Section */}
                  <div>
                    <h5 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileAlt} className="text-indigo-600" />
                      Submitted Answers
                    </h5>

                    <div className="space-y-6">
                      {form.questions.map((question, index) => {
                        const response = selectedSubmission.responses.find(r => r.questionId === question.id);
                        const hasResponse = response && response.answer !== null && response.answer !== undefined && response.answer !== '';

                        return (
                          <div key={question.id} className="border border-slate-200 rounded-lg overflow-hidden">
                            {/* Question Header */}
                            <div className={`p-4 border-b border-slate-200 ${hasResponse
                                ? response.isValid
                                  ? 'bg-green-50'
                                  : 'bg-red-50'
                                : 'bg-gray-50'
                              }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${hasResponse
                                      ? response.isValid
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                                      : 'bg-gray-400'
                                    }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <FontAwesomeIcon
                                        icon={getQuestionIcon(question.type)}
                                        className="text-slate-500 text-sm"
                                      />
                                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full uppercase font-medium">
                                        {question.type.replace('_', ' ')}
                                      </span>
                                      {question.isRequired && (
                                        <span className="text-red-500 text-xs font-bold">Required</span>
                                      )}
                                    </div>
                                    <h6 className="font-medium text-slate-800 leading-relaxed">
                                      {question.content || `Question ${index + 1}`}
                                    </h6>
                                    {question.explanation && (
                                      <p className="text-sm text-slate-600 mt-1 italic">
                                        {question.explanation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {hasResponse ? (
                                    response.isValid ? (
                                      <div className="flex items-center gap-1 text-green-600 text-sm">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        <span className="font-medium">Valid</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-red-600 text-sm">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                        <span className="font-medium">Invalid</span>
                                      </div>
                                    )
                                  ) : (
                                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                                      <FontAwesomeIcon icon={faExclamationTriangle} />
                                      <span className="font-medium">No Answer</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Answer Content */}
                            <div className="p-4">
                              {response ? (
                                formatDetailedAnswer(response, question)
                              ) : (
                                <div className="flex items-center gap-2 text-slate-400 italic py-4">
                                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-400" />
                                  <span>This question was not answered</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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