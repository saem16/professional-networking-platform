import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, X, Check, Eye } from 'lucide-react';
import { getSession } from '../utils/Session';
import axios from 'axios';

const JobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [viewingResume, setViewingResume] = useState(null);


  useEffect(() => {
    fetchApplications();
    fetchJob();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/${jobId}/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJob = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const token = getSession('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/jobs/applications/${applicationId}/status`, 
        { status },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setApplications(prev => prev.map(app =>
        app._id === applicationId ? { ...app, status } : app
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleMessage = (applicant) => {
    navigate('/inbox', { state: { startConversationWith: applicant } });
  };

  const viewResume = async (filename) => {
    try {
      const token = getSession('token');
      const fileUrl = `${import.meta.env.VITE_API_URL}/jobs/files/view/${filename}?token=${encodeURIComponent(token)}`;
      setViewingResume(fileUrl);
    } catch (error) {
      console.error('Failed to load resume:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate('/open-roles')}
              className="flex items-center space-x-2 text-white hover:bg-white hover:text-black px-3 py-2 rounded transition-colors self-start"
            >
              <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back to Jobs</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{job?.title} - Applications</h1>
              <p className="text-white opacity-70 text-sm sm:text-base">{applications.length} applications received</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((application) => (
            <div key={application._id} className="bg-black rounded-lg p-6 border border-white">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={application.applicant.profilePicture || '/default-avatar.png'}
                  alt={application.applicant.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{application.name || application.applicant.name}</h3>
                  <p className="text-sm text-neutral-400">@{application.applicant.username}</p>
                  {application.resume ? (
                    <button
                      onClick={() => viewResume(application.resume)}
                      className="text-xs text-white hover:text-white opacity-70 hover:opacity-100 mt-1 block"
                    >
                      📄 View Resume
                    </button>
                  ) : (
                    <span className="text-xs text-white opacity-50 mt-1 block">No resume uploaded</span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${application.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                    application.status === 'reviewed' ? 'bg-blue-600 text-blue-100' :
                      application.status === 'accepted' ? 'bg-green-600 text-green-100' :
                        'bg-red-600 text-red-100'
                  }`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>

              {application.applicant.skills && application.applicant.skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {application.applicant.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-neutral-800 text-xs rounded">
                        {skill.name}
                      </span>
                    ))}
                    {application.applicant.skills.length > 3 && (
                      <span className="px-2 py-1 bg-neutral-800 text-xs rounded">
                        +{application.applicant.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {application.applicant.experience && application.applicant.experience.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Latest Experience:</p>
                  <div className="text-sm text-neutral-300">
                    <p className="font-medium">{application.applicant.experience[0].title}</p>
                    <p className="text-xs text-neutral-400">{application.applicant.experience[0].company}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedApplicant(application.applicant)}
                  className="flex-1 px-3 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Eye size={14} />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleMessage(application.applicant)}
                  className="flex-1 px-3 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <MessageCircle size={14} />
                  <span>Message</span>
                </button>
              </div>

              {application.status === 'pending' && (
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => updateApplicationStatus(application._id, 'accepted')}
                    className="flex-1 px-3 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <Check size={14} />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(application._id, 'rejected')}
                    className="flex-1 px-3 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              <p className="text-xs text-neutral-500 mt-3">
                Applied {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No applications received yet.</p>
          </div>
        )}
      </div>

      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedApplicant.profilePicture || '/default-avatar.png'}
                    alt={selectedApplicant.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{selectedApplicant.name}</h2>
                    <p className="text-neutral-400">@{selectedApplicant.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="p-2 hover:bg-neutral-800 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              {selectedApplicant.bio && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-neutral-300">{selectedApplicant.bio}</p>
                </div>
              )}

              {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-neutral-800 rounded-full text-sm">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplicant.experience && selectedApplicant.experience.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Experience</h3>
                  <div className="space-y-4">
                    {selectedApplicant.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-neutral-700 pl-4">
                        <h4 className="font-medium">{exp.title}</h4>
                        <p className="text-neutral-400">{exp.company}</p>
                        {exp.description && (
                          <p className="text-sm text-neutral-300 mt-1">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => handleMessage(selectedApplicant)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingResume && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white rounded-lg w-full max-w-5xl h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white">
              <h3 className="text-lg font-semibold text-white">Resume</h3>
              <button
                onClick={() => {
                  setViewingResume(null);
                  setResumeData(null);
                }}
                className="text-white hover:bg-white hover:text-black p-2 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={viewingResume}
                className="w-full h-full rounded"
                title="Resume"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplications;