import { useState, useEffect } from 'react';
import { MapPin, Briefcase, Clock, Filter, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getSession } from '../utils/Session';
import axios from 'axios';

const AllJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('All');
  const user = getSession('user');

  useEffect(() => {
    fetchJobs(1, true);
  }, [filter]);

  const fetchJobs = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs`);
      const data = response.data;
      
      const filteredData = filter === 'All' ? data : data.filter(job => job.type === filter);
      const itemsPerPage = 10;
      const startIndex = (pageNum - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      if (reset) {
        setJobs(paginatedData);
      } else {
        setJobs(prev => [...prev, ...paginatedData]);
      }
      
      setHasMore(endIndex < filteredData.length);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchJobs(page + 1, false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const jobDate = new Date(dateString);
    const diffInHours = Math.floor((now - jobDate) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  return (
    <main className="flex-1 p-3 lg:p-6 bg-neutral-950 text-white">

      <button
        onClick={() => navigate('/open-roles')}
        className="flex items-center space-x-2 text-neutral-400 hover:text-white mb-4 lg:mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="lg:w-5 lg:h-5" />
        <span className="text-sm lg:text-base">Back to Open Roles</span>
      </button>


      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">All Job Opportunities</h1>
        <p className="text-neutral-400 text-sm lg:text-base">
          Browse through all available positions and find your perfect match
        </p>
      </div>


      <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="lg:w-[18px] lg:h-[18px]" />
          <span className="text-xs lg:text-sm font-medium">Filter by type:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Full-time', 'Part-time', 'Internship', 'Contract'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 lg:px-3 py-1 rounded-lg text-xs lg:text-sm transition ${
                filter === type
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>


      <div className="space-y-3 lg:space-y-4">
        {jobs.map(job => (
          <Link
            key={job._id}
            to={`/open-roles/job/${job._id}`}
            className="block bg-neutral-900 p-4 lg:p-6 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition"
          >
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
              <div className="flex gap-3 lg:gap-4 flex-1">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs lg:text-sm font-bold text-white">
                    {job.company.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg lg:text-xl font-semibold mb-1">{job.title}</h3>
                  <p className="text-neutral-400 mb-2 text-sm lg:text-base">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-neutral-500 mb-2 lg:mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="lg:w-[14px] lg:h-[14px]" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={12} className="lg:w-[14px] lg:h-[14px]" />
                      {job.type}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="lg:w-[14px] lg:h-[14px]" />
                      {formatTimeAgo(job.createdAt)}
                    </div>
                  </div>
                  <p className="text-neutral-300 line-clamp-2 text-sm lg:text-base">
                    {job.whatYouDo || job.description || 'No description available'}
                  </p>
                  {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div className="flex flex-wrap gap-1 lg:gap-2 mt-2 lg:mt-3">
                      {job.skillsRequired.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-neutral-800 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skillsRequired.length > 4 && (
                        <span className="px-2 py-1 bg-neutral-700 rounded text-xs">
                          +{job.skillsRequired.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-left lg:text-right">
                <span className="px-2 lg:px-3 py-1 bg-neutral-800 text-green-400 rounded-lg font-medium text-xs lg:text-sm">
                  {job.salary || 'Negotiable'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>


      {hasMore && (
        <div className="text-center mt-6 lg:mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 lg:px-6 py-2 lg:py-3 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:cursor-not-allowed rounded-lg transition text-sm lg:text-base"
          >
            {loading ? 'Loading...' : 'Load More Jobs'}
          </button>
        </div>
      )}


      {!hasMore && jobs.length > 0 && (
        <div className="text-center mt-6 lg:mt-8 text-neutral-500 text-sm lg:text-base">
          You've reached the end of all job listings
        </div>
      )}


      {!loading && jobs.length === 0 && (
        <div className="text-center mt-8 lg:mt-12">
          <Briefcase size={36} className="lg:w-12 lg:h-12 mx-auto text-neutral-600 mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-neutral-400 text-sm lg:text-base">
            {filter === 'All' 
              ? 'No job postings are available at the moment.'
              : `No ${filter.toLowerCase()} jobs are available at the moment.`
            }
          </p>
        </div>
      )}
    </main>
  );
};

export default AllJobs;