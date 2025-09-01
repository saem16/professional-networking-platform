import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import RadialNavbar from '../components/RadialNavbar';
import Discover from './Discover';
import OpenRoles from './OpenRoles';
import CreatePost from './CreatePost';
import CreateJob from './CreateJob';
import JobAlertMap from '../components/JobAlertMap';
import InboxPage from './InboxPage';
import ProfileSettings from './ProfileSettings';
import ShowJob from './ShowJob';
import ProfilePage from './ProfilePage';
import NotificationSystem from './NotificationSystem';
import Network from './Network';
import AllJobs from './AllJobs';
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import JobApplications from './JobApplications';
import SavedJobs from './SavedJobs';
import CompanyJobsManager from './CompanyJobsManager';
import MyJobs from './MyJobs';
import SearchUsers from './SearchUsers';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [following, setFollowing] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  useEffect(() => {
    axios
      .get(import.meta.env.VITE_API_URL + '/jobs')
      .then(res => setJobs(res.data));

    setFollowing([
      { name: 'Jordi van', avatar: '/f1.jpg' },
      { name: 'Vidhi Shah', avatar: '/f2.jpg' },
    ]);
  }, []);

  return (
    <div className="flex bg-black text-white min-h-screen relative">

      <div className="hidden md:block w-20 flex-shrink-0">
        <LeftSidebar />
      </div>


      <main
        className={
          'flex-1 transition-all duration-300 bg-black pb-16 md:pb-0 ' +
          (rightSidebarCollapsed ? 'md:mr-16' : 'md:mr-80')
        }
      >
        <div>
          <Routes>
            <Route
              path="/"
              element={<Discover />}
            />
            <Route path="/open-roles" element={<OpenRoles jobs={jobs} />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/open-roles/job/:id" element={<ShowJob />} />
            <Route path="/create-job" element={<CreateJob />} />
            <Route path="/open-roles/job-alert" element={<JobAlertMap />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationSystem />} />
            <Route path="/network" element={<Network />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/open-roles/all-jobs" element={<AllJobs />} />
            <Route path="/jobs/:jobId/applications" element={<JobApplications />} />
            <Route path="/saved-jobs" element={<SavedJobs />} />
            <Route path="/company/jobs" element={<CompanyJobsManager />} />
            <Route path="/my-jobs" element={<MyJobs />} />
            <Route path="/search-users" element={<SearchUsers />} />
          </Routes>
        </div>
      </main>


      <div className="hidden md:block">
        <RightSidebar onCollapsedChange={setRightSidebarCollapsed} />
      </div>


      <div className="md:hidden">
        <RadialNavbar />
      </div>
    </div>
  );
}
