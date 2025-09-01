import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bookmark, X } from 'lucide-react';
import { getSession } from '../utils/Session';
import axios from 'axios';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/saved/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSavedJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    } finally {
      setLoading(false);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Saved Jobs</h1>
          <p className="text-neutral-400">{savedJobs.length} jobs saved</p>
        </div>

        {savedJobs.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No saved jobs yet</h3>
            <p className="text-neutral-400 mb-4">Start saving jobs you're interested in to view them here</p>
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
              <div key={job._id} className="bg-neutral-900 rounded-lg p-6 border border-neutral-800 relative">
                <button
                  onClick={() => handleUnsave(job._id)}
                  className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={16} />
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

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs">
                    {job.type}
                  </span>
                  {job.salary && (
                    <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs">
                      {job.salary}
                    </span>
                  )}
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
    </div>
  );
};

export default SavedJobs;