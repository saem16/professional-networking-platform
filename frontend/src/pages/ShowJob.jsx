import React, { useState, useEffect } from 'react';
import { MapPin, Star, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession } from '../utils/Session';
import axios from 'axios';
import { showToast } from '../utils/toast';

const ShowJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    coverLetter: '',
    resume: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const user = getSession('user');

  const checkUserMatch = () => {
    if (!user || !job) return {};
    
    return {
      salary: !!job.salary,
      category: !!job.type,
      english: true,
      location: user.location?.address || user.address ? true : false,
      experience: user.experience && user.experience.length > 0
    };
  };

  const matchResults = checkUserMatch();

  useEffect(() => {
    fetchJob();
    if (user) {
      checkApplicationStatus();
      checkSavedStatus();
    }
    const checkNotificationState = () => {
      setNotificationOpen(!!window.notificationModalOpen || !!window.profileMenuOpen);
    };

    checkNotificationState();

    window.addEventListener('notificationStateChange', checkNotificationState);

    const interval = setInterval(checkNotificationState, 100);

    return () => {
      window.removeEventListener('notificationStateChange', checkNotificationState);
      clearInterval(interval);
    };
  }, [id, user]);

  const fetchJob = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/${id}`);
      const data = response.data;
      setJob(data);
    } catch (error) {
      showToast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/${id}/check-application`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHasApplied(response.data.hasApplied);
    } catch (error) {
      showToast.error('Failed to check application status');
    }
  };

  const checkSavedStatus = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/${id}/check-saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setIsSaved(response.data.isSaved);
    } catch (error) {
      showToast.error('Failed to check saved status');
    }
  };

  const handleApply = () => {
    if (!user || hasApplied) return;
    setApplicationData(prev => ({ ...prev, name: user.name || '' }));
    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    if (!applicationData.name || !applicationData.resume) {
      showToast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', applicationData.name);
      formData.append('coverLetter', applicationData.coverLetter);
      formData.append('resume', applicationData.resume);

      const token = getSession('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/jobs/${id}/apply`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setHasApplied(true);
      setShowApplicationModal(false);
      showToast.success('Application submitted successfully!');
    } catch (error) {
      showToast.error('Failed to apply for job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const token = getSession('token');
      if (isSaved) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/jobs/${id}/save`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/jobs/${id}/save`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      setIsSaved(!isSaved);
    } catch (error) {
      showToast.error('Failed to save/unsave job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
          <p className="text-gray-400">The job you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className={`h-32 sm:h-48 lg:h-64 bg-gradient-to-r from-blue-600 to-purple-600 relative ${notificationOpen ? '-z-10' : ''}`}>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <span className="text-neutral-300 text-sm sm:text-base">Location</span>
          </div>
          <span className="text-white text-base sm:text-lg">{job.location}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <button
          onClick={() => navigate('/open-roles')}
          className="flex items-center space-x-2 text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Back to Open Roles</span>
        </button>

        <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-base sm:text-lg">{job.company.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-neutral-500 text-xs sm:text-sm">{job.company}</span>
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 fill-current" />
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{job.title}</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <span className="px-2 sm:px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-xs sm:text-sm">{job.type}</span>
            {job.salary && (
              <span className="px-2 sm:px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-xs sm:text-sm">{job.salary}</span>
            )}
            {job.skillsRequired?.slice(0, 3).map((skill, index) => (
              <span key={index} className="px-2 sm:px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-xs sm:text-sm">{skill}</span>
            ))}
          </div>
          <div className="flex space-x-3 sm:space-x-4">
            <button 
              onClick={handleSave}
              className={`px-4 sm:px-6 py-2 rounded-lg border transition-colors text-sm sm:text-base ${
                isSaved 
                  ? 'bg-white text-black border-white' 
                  : 'bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button 
              onClick={handleApply}
              disabled={hasApplied}
              className={`px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                hasApplied 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              {hasApplied ? 'Applied' : 'Easy Apply'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4 sm:space-y-6 text-neutral-300 leading-relaxed">
              <div>
                <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">What you'll do</h3>
                <p className="whitespace-pre-line text-sm sm:text-base">{job.whatYouDo}</p>
              </div>

              <div className="pt-4 sm:pt-6 border-t border-neutral-800">
                <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">What you're good at</h3>
                <p className="whitespace-pre-line text-sm sm:text-base">{job.whatYouGoodAt}</p>
              </div>

              <div className="pt-4 sm:pt-6 border-t border-neutral-800">
                <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">About you</h3>
                <p className="whitespace-pre-line text-sm sm:text-base">{job.aboutYou}</p>
              </div>

              {job.description && (
                <div className="pt-4 sm:pt-6 border-t border-neutral-800">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Additional Details</h3>
                  <p className="whitespace-pre-line text-sm sm:text-base">{job.description}</p>
                </div>
              )}

              {job.perks && (
                <div className="pt-4 sm:pt-6 border-t border-neutral-800">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Perks & Benefits</h3>
                  <p className="whitespace-pre-line text-sm sm:text-base">{job.perks}</p>
                </div>
              )}

              {job.skillsRequired && job.skillsRequired.length > 0 && (
                <div className="pt-4 sm:pt-6 border-t border-neutral-800">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skillsRequired.map((skill, index) => (
                      <span key={index} className="px-2 sm:px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-xs sm:text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-neutral-900 rounded-lg p-4 sm:p-6">
                
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 ${matchResults.salary ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                      {matchResults.salary ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                    </div>
                    <span className="text-neutral-300 text-sm sm:text-base">Salary</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${matchResults.category ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                      {matchResults.category ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-neutral-300">Category</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${matchResults.english ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                      {matchResults.english ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-neutral-300">English</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${matchResults.location ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                      {matchResults.location ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-neutral-300">Location</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${matchResults.experience ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                      {matchResults.experience ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-neutral-300">Experience</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-800">
                  <h3 className="text-neutral-500 text-sm mb-4 flex items-center space-x-2">
                    <div className="w-4 h-4 bg-neutral-700 rounded"></div>
                    <span>Similar jobs</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-black rounded-lg border border-neutral-800">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">T</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Senior Full Stack Developer</div>
                          <div className="text-neutral-500 text-sm">TechCorp Solutions</div>
                        </div>
                      </div>
                      <div className="text-neutral-300 font-medium text-sm">₹12,00,000 - ₹18,00,000</div>
                    </div>

                    <div className="p-3 bg-black rounded-lg border border-neutral-800">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">I</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Mobile App Developer</div>
                          <div className="text-neutral-500 text-sm">InnovateLabs</div>
                        </div>
                      </div>
                      <div className="text-neutral-300 font-medium text-sm">₹8,00,000 - ₹14,00,000</div>
                    </div>

                    <div className="p-3 bg-black rounded-lg border border-neutral-800">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">D</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Data Scientist</div>
                          <div className="text-neutral-500 text-sm">DataDriven Inc</div>
                        </div>
                      </div>
                      <div className="text-neutral-300 font-medium text-sm">₹12,00,000 - ₹20,00,000</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white">Apply for {job?.title}</h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-neutral-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={applicationData.name}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white focus:border-white focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Resume/CV *</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setApplicationData(prev => ({ ...prev, resume: e.target.files[0] }))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white focus:border-white focus:outline-none file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white file:text-black"
                  />
                  <p className="text-xs text-neutral-400 mt-1">PDF, DOC, or DOCX files only</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Cover Letter</label>
                  <textarea
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white focus:border-white focus:outline-none h-24 resize-none"
                    placeholder="Why are you interested in this position?"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApplication}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowJob;