import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Trash2, Eye, Plus } from 'lucide-react';
import { getSession } from '../utils/Session';
import axios from 'axios';

const CompanyJobsManager = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanyJobs();
  }, []);

  const fetchCompanyJobs = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/company/my-jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch company jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId) => {
    try {
      const token = getSession('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setJobs(prev => prev.filter(job => job._id !== jobId));
      setDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete job:', error);
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
          <div>
            <h1 className="text-2xl font-bold">My Job Postings</h1>
            <p className="text-neutral-400">{jobs.length} jobs posted</p>
          </div>
          <Link
            to="/create-job"
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Post New Job</span>
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-white mb-2">No jobs posted yet</h3>
            <p className="text-neutral-400 mb-4">Create your first job posting to start receiving applications</p>
            <Link
              to="/create-job"
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Post a Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{job.company.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <p className="text-neutral-400">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-sm">
                        {job.type}
                      </span>
                      <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-sm">
                        📍 {job.location}
                      </span>
                      {job.salary && (
                        <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-sm">
                          💰 {job.salary}
                        </span>
                      )}
                    </div>

                    <p className="text-neutral-300 text-sm mb-4 line-clamp-2">
                      {job.whatYouDo || job.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-neutral-400">
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>{job.applicationCount || 0} applications</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/open-roles/job/${job._id}`}
                      className="p-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
                      title="View Job"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      to={`/jobs/${job._id}/applications`}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title="View Applications"
                    >
                      <Users size={16} />
                    </Link>
                    <button
                      onClick={() => setDeleteModal(job)}
                      className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="Delete Job"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black border border-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Delete Job Posting</h3>
            <p className="text-white mb-4">
              Are you sure you want to delete "{deleteModal.title}"? This will also delete all applications for this job.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-white hover:bg-neutral-800 border border-neutral-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(deleteModal._id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyJobsManager;