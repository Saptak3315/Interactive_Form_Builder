// src/components/PublishForm/PublishFormContainer.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormContext } from '../../context/FormContext/FormProvider';
import FormStorageService from '../../services/FormStorageService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faShare,
  faCode,
  faQrcode,
  faCopy,
  faCheck,
  faEye,
  faEdit,
  faToggleOn,
  faToggleOff,
  faChartLine,
  faUsers,
  faCalendarAlt,
  faGlobe,
  faLock,
  faClipboardList
} from '@fortawesome/free-solid-svg-icons';

const PublishFormContainer: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useFormContext();
  const [isPublished, setIsPublished] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [formSettings, setFormSettings] = useState({
    isActive: true,
    allowMultipleSubmissions: true,
    requireLogin: false,
    collectEmail: false,
    showProgressBar: true,
    allowSaveProgress: false,
    responseLimit: null as number | null,
    expiryDate: '',
    customTheme: 'default'
  });

  useEffect(() => {
    // Generate form URL and embed code when component mounts
    const baseUrl = window.location.origin;
    const formId = state.formId || 'demo';
    const url = `${baseUrl}/form/${formId}`;
    setFormUrl(url);
    
    const embed = `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;
    setEmbedCode(embed);
  }, [state.formId]);

  const handlePublish = () => {
    if (!state.formId) {
      // Save form first if not saved
      const savedForm = FormStorageService.saveForm(state);
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/form/${savedForm.formId}`;
      setFormUrl(url);
      
      const embed = `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;
      setEmbedCode(embed);
    }
    
    setIsPublished(true);
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleBackToBuilder = () => {
    navigate('/form-builder');
  };

  const handlePreviewForm = () => {
    window.open(formUrl, '_blank');
  };

  const handleSettingChange = (setting: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToBuilder}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Back to Builder</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faClipboardList} className="text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-800">
                  {isPublished ? 'Form Published' : 'Publish Form'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviewForm}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FontAwesomeIcon icon={faEye} />
                Preview
              </button>
              <button
                onClick={handleBackToBuilder}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <FontAwesomeIcon icon={faEdit} />
                Edit Form
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
                  {state.title || 'Untitled Form'}
                </h2>
                <p className="text-slate-600 mb-4">
                  {state.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} />
                    {state.questions.length} Questions
                  </span>
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    Created today
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPublished 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Publish Section */}
            {!isPublished ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faShare} className="text-2xl text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      Ready to publish your form?
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Once published, your form will be accessible via a public URL and can be embedded on websites.
                    </p>
                    <button
                      onClick={handlePublish}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                      Publish Form
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Share Options */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Share Your Form
                    </h3>
                    
                    {/* Direct Link */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Direct Link
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 text-sm"
                        />
                        <button
                          onClick={() => handleCopyToClipboard(formUrl, 'url')}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          {copySuccess === 'url' ? (
                            <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                          ) : (
                            <FontAwesomeIcon icon={faCopy} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Embed Code */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Embed Code
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          value={embedCode}
                          readOnly
                          rows={3}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 text-sm resize-none"
                        />
                        <button
                          onClick={() => handleCopyToClipboard(embedCode, 'embed')}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          {copySuccess === 'embed' ? (
                            <FontAwesomeIcon icon={faCheck} className="text-green-600" />
                          ) : (
                            <FontAwesomeIcon icon={faCopy} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* QR Code placeholder */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        QR Code
                      </label>
                      <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                        <FontAwesomeIcon icon={faQrcode} className="text-3xl text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">QR code generation coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Analytics Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                      Analytics Preview
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-800">0</div>
                        <div className="text-sm text-slate-600">Views</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-800">0</div>
                        <div className="text-sm text-slate-600">Submissions</div>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-800">0%</div>
                        <div className="text-sm text-slate-600">Completion</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Form Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Form Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Form Active</label>
                    <button
                      onClick={() => handleSettingChange('isActive', !formSettings.isActive)}
                      className={`${formSettings.isActive ? 'text-green-600' : 'text-slate-400'}`}
                    >
                      <FontAwesomeIcon 
                        icon={formSettings.isActive ? faToggleOn : faToggleOff} 
                        className="text-2xl"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Multiple Submissions</label>
                    <button
                      onClick={() => handleSettingChange('allowMultipleSubmissions', !formSettings.allowMultipleSubmissions)}
                      className={`${formSettings.allowMultipleSubmissions ? 'text-green-600' : 'text-slate-400'}`}
                    >
                      <FontAwesomeIcon 
                        icon={formSettings.allowMultipleSubmissions ? faToggleOn : faToggleOff} 
                        className="text-2xl"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Require Login</label>
                    <button
                      onClick={() => handleSettingChange('requireLogin', !formSettings.requireLogin)}
                      className={`${formSettings.requireLogin ? 'text-green-600' : 'text-slate-400'}`}
                    >
                      <FontAwesomeIcon 
                        icon={formSettings.requireLogin ? faToggleOn : faToggleOff} 
                        className="text-2xl"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Show Progress Bar</label>
                    <button
                      onClick={() => handleSettingChange('showProgressBar', !formSettings.showProgressBar)}
                      className={`${formSettings.showProgressBar ? 'text-green-600' : 'text-slate-400'}`}
                    >
                      <FontAwesomeIcon 
                        icon={formSettings.showProgressBar ? faToggleOn : faToggleOff} 
                        className="text-2xl"
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Response Limit
                  </label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={formSettings.responseLimit || ''}
                    onChange={(e) => handleSettingChange('responseLimit', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formSettings.expiryDate}
                    onChange={(e) => handleSettingChange('expiryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Dashboard
                  </button>
                  <button
                    onClick={handlePreviewForm}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Preview Form
                  </button>
                  <button
                    onClick={() => navigate('/form-builder')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishFormContainer;