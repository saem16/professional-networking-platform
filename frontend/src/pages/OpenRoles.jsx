import { Bookmark, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSession } from '../utils/Session';
import axios from 'axios';

const OpenRoles = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getSession('user');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs`);
      const data = response.data;
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
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

  const recommendedJobs = jobs.slice(0, 5);
  const topApplicantJobs = jobs.slice(0, 6);

  return (
    <main className="flex-1 p-2 sm:p-3 lg:p-6 bg-neutral-950 text-white">

      <div className="bg-neutral-900 h-32 sm:h-48 lg:h-60 flex flex-col justify-center px-3 sm:px-4 lg:px-6 rounded-xl shadow-lg">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">
          {user?.name}, we're here to help you land your next job!
        </h1>
        <p className="text-neutral-400 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
          Discover {jobs.length} job opportunities waiting for you
        </p>
        <Link
          to="/open-roles/job-alert"
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mt-4 transition-colors w-fit"
        >
          <MapPin size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" />
          <span className="text-xs sm:text-xs lg:text-sm">Explore jobs on map</span>
        </Link>
      </div>


      <section className="py-3 sm:py-4 lg:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="font-semibold text-base sm:text-lg lg:text-xl">Recommended for you</h2>
          <div className="flex gap-2">
            <Link
              to="/open-roles/all-jobs"
              className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition text-sm"
            >
              See all
            </Link>
            {user?.accountType === 'company' && (
              <Link
                to="/create-job"
                className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition text-sm"
              >
                Post a Job
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {recommendedJobs.map(job => (
            <div
              key={job._id}
              className="p-2 sm:p-3 lg:p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between"
            >
              <div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-neutral-700 rounded-lg flex items-center justify-center mb-1 sm:mb-2 lg:mb-3">
                  <span className="text-xs font-bold text-white">
                    {job.company.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold mt-1 sm:mt-2 lg:mt-3 text-xs sm:text-sm lg:text-base">{job.title}</h3>
                <p className="text-xs sm:text-xs lg:text-sm text-neutral-400 mt-1">{job.company}</p>
                <p className="text-xs sm:text-xs lg:text-sm text-neutral-400 mt-1 sm:mt-2 line-clamp-2">
                  {job.whatYouDo || job.description || 'No description available'}
                </p>
              </div>
              <Link
                to={`/open-roles/job/${job._id}`}
                className="mt-2 sm:mt-3 lg:mt-4 w-full rounded-lg bg-neutral-800 py-1.5 sm:py-2 hover:bg-neutral-700 transition flex justify-center items-center gap-2 text-xs sm:text-sm"
              >
                View <Bookmark size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>


      <section className="py-3 sm:py-4 lg:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="font-semibold flex items-center gap-2 text-base sm:text-lg lg:text-xl">
            <span role="img" aria-label="badge">
              🏅
            </span>{' '}
            Recent Job Postings
          </h2>
          <Link
            to="/all-jobs"
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition text-sm w-fit"
          >
            See all
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:gap-4">
          {topApplicantJobs.map(job => (
            <div
              key={job._id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-neutral-900 p-2 sm:p-3 lg:p-4 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition gap-2 sm:gap-3"
            >
              <Link
                to={`/open-roles/job/${job._id}`}
                className="flex gap-2 sm:gap-3 flex-1"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {job.company.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base">{job.title}</h3>
                  <p className="text-xs sm:text-xs lg:text-sm text-neutral-400">
                    {formatTimeAgo(job.createdAt)} • <MapPin size={8} className="sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 inline" />{' '}
                    {job.location}
                  </p>
                  <p className="text-xs sm:text-xs text-neutral-500 mt-1">
                    {job.company} • {job.type}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <span className="px-2 sm:px-2 lg:px-3 py-1 rounded-lg bg-neutral-800 text-green-400 font-medium text-xs sm:text-xs lg:text-sm">
                  {job.salary || 'Negotiable'}
                </span>
                {user?.accountType === 'company' && (job.user === user.id || job.user === user._id) && (
                  <Link
                    to={`/jobs/${job._id}/applications`}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    Applications
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default OpenRoles;