import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getSession } from '../utils/Session';
import axios from 'axios';

const MyJobs = () => {
  const [activeTab, setActiveTab] = useState('applied');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppliedJobs();
    fetchSavedJobs();
  }, []);

  const fetchAppliedJobs = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/my-applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAppliedJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch applied jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/saved/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSavedJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      const token = getSession('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/jobs/${jobId}/save`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    } catch (error) {
      console.error('Failed to unsave job:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'reviewed': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-600 text-green-100';
      case 'rejected': return 'bg-red-600 text-red-100';
      case 'reviewed': return 'bg-blue-600 text-blue-100';
      default: return 'bg-yellow-600 text-yellow-100';
    }
  };

  const filteredAppliedJobs = statusFilter === 'all' 
    ? appliedJobs 
    : appliedJobs.filter(app => app.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">My Jobs</h1>
          
  
          <div className="flex space-x-1 bg-neutral-900 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('applied')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'applied'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Applied Jobs ({appliedJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Saved Jobs ({savedJobs.length})
            </button>
          </div>
        </div>


        {activeTab === 'applied' && (
          <div>
  
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === 'all'
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                All ({appliedJobs.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === 'pending'
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Pending ({appliedJobs.filter(app => app.status === 'pending').length})
              </button>
              <button
                onClick={() => setStatusFilter('accepted')}
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === 'accepted'
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Accepted ({appliedJobs.filter(app => app.status === 'accepted').length})
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1 rounded-full text-sm ${
                  statusFilter === 'rejected'
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Rejected ({appliedJobs.filter(app => app.status === 'rejected').length})
              </button>
            </div>

  
            {filteredAppliedJobs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
                <p className="text-neutral-400 mb-4">Start applying to jobs to see them here</p>
                <Link
                  to="/open-roles"
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppliedJobs.map((application) => (
                  <div key={application._id} className="bg-black border border-white rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">{application.job.company.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{application.job.title}</h3>
                            <p className="text-neutral-400">{application.job.company}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} className="text-neutral-400" />
                            <span className="text-sm text-neutral-400">{application.job.location}</span>
                          </div>
                          <span className="text-sm text-neutral-400">
                            Applied {new Date(application.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-sm text-neutral-300 mb-4 line-clamp-2">
                          {application.job.whatYouDo || application.job.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="capitalize">{application.status}</span>
                        </div>
                        <Link
                          to={`/open-roles/job/${application.job._id}`}
                          className="px-3 py-1 bg-white text-black rounded text-sm hover:bg-neutral-200 transition-colors"
                        >
                          View Job
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'saved' && (
          <div>
            {savedJobs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-white mb-2">No saved jobs yet</h3>
                <p className="text-neutral-400 mb-4">Save jobs you're interested in to view them here</p>
                <Link
                  to="/open-roles"
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobs.map((job) => (
                  <div key={job._id} className="bg-black rounded-lg p-6 border border-white relative">
                    <button
                      onClick={() => handleUnsave(job._id)}
                      className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white transition-colors"
                    >
                      ×
                    </button>

                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">{job.company.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-neutral-400">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <MapPin size={14} className="text-neutral-400" />
                      <span className="text-sm text-neutral-400">{job.location}</span>
                    </div>

                    <p className="text-sm text-neutral-300 mb-4 line-clamp-3">
                      {job.whatYouDo || job.description || 'No description available'}
                    </p>

                    <Link
                      to={`/open-roles/job/${job._id}`}
                      className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors text-center block"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJobs;