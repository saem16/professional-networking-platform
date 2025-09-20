import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Eye,
  Heart,
  Calendar,
  Bell,
  Activity,
  UserPlus,
  FileText,
  BarChart3,
  Clock,
  MapPin,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSession } from '../utils/Session';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(getSession('user'));
  const token = getSession('token');
  const [stats, setStats] = useState({
    connections: 0,
    followers: 0,
    posts: 0,
    profileViews: 0,
    postLikes: 0,
    jobApplications: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [jobRecommendations, setJobRecommendations] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [notificationsRes, jobsRes, followersRes, connectionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/notifications?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/jobs`),

        axios.get(`${import.meta.env.VITE_API_URL}/follow/followers/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/social/connections/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const totalLikes = 0;
      const followersCount = followersRes.data?.success ? followersRes.data.data.followers?.length || 0 : 0;
      const connectionsCount = connectionsRes.data?.success ? connectionsRes.data.data.connections?.length || 0 : 0;
      const profileViewNotifications = notificationsRes.data?.success ? 
        notificationsRes.data.data.notifications?.filter(n => n.type === 'profile_view') || [] : [];

      setStats({
        connections: connectionsCount,
        followers: followersCount,
        posts: 0,
        profileViews: profileViewNotifications.length,
        postLikes: totalLikes,
        jobApplications: 0
      });

      if (notificationsRes.data.success && notificationsRes.data.data.notifications) {
        const activities = notificationsRes.data.data.notifications.map(notif => ({
          id: notif._id,
          type: notif.type,
          user: notif.sender?.name || 'Unknown User',
          time: formatTimeAgo(notif.createdAt),
          avatar: notif.sender?.profilePicture || '/default-avatar.png'
        }));
        setRecentActivity(activities);
      }

      if (jobsRes.data && Array.isArray(jobsRes.data)) {
        setJobRecommendations(jobsRes.data.slice(0, 3));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create-post':
        navigate('/create-post');
        break;
      case 'find-people':
        navigate('/search-users');
        break;
      case 'browse-jobs':
        navigate('/open-roles');
        break;
      case 'analytics':
        navigate('/dashboard/analytics');
        break;

    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-3 sm:p-4 lg:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-neutral-400 text-sm sm:text-base">Here's what's happening with your network today.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Connections</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.connections}</p>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Followers</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.followers}</p>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Posts</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.posts}</p>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Profile Views</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.profileViews}</p>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Post Likes</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.postLikes}</p>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Applications</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.jobApplications}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h2 className="text-lg sm:text-xl font-semibold">Recent Activity</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                  <img 
                    src={activity.avatar} 
                    alt={activity.user}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                    onError={(e) => e.target.src = '/default-avatar.png'}
                  />
                  <div className="flex-1">
                    <p className="text-sm sm:text-base">
                      <span className="font-medium">{activity.user}</span>
                      {activity.type === 'connection_request' && ' sent you a connection request'}
                      {activity.type === 'connection_accepted' && ' accepted your connection'}
                      {activity.type === 'post_like' && ' liked your post'}
                      {activity.type === 'post_comment' && ' commented on your post'}
                      {activity.type === 'follow' && ' started following you'}
                      {!['connection_request', 'connection_accepted', 'post_like', 'post_comment', 'follow'].includes(activity.type) && ' interacted with you'}
                    </p>
                    <p className="text-xs sm:text-sm text-neutral-400">{activity.time}</p>
                  </div>
                  <div className="text-neutral-400">
                    {(activity.type === 'connection_request' || activity.type === 'connection_accepted') && <Users className="w-4 h-4" />}
                    {activity.type === 'post_like' && <Heart className="w-4 h-4" />}
                    {activity.type === 'post_comment' && <MessageSquare className="w-4 h-4" />}
                    {activity.type === 'follow' && <UserPlus className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">


          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-5 h-5 text-orange-400" />
              <h3 className="text-base sm:text-lg font-semibold">Recommended Jobs</h3>
            </div>
            <div className="space-y-3">
              {jobRecommendations.map(job => (
                <div 
                  key={job._id} 
                  onClick={() => navigate(`/open-roles/job/${job._id}`)}
                  className="p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <h4 className="font-medium text-sm sm:text-base">{job.title}</h4>
                  <p className="text-xs sm:text-sm text-neutral-400">{job.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span className="text-xs text-neutral-400">{job.location || 'Remote'}</span>
                    <span className="text-xs bg-neutral-700 px-2 py-0.5 rounded">{job.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleQuickAction('create-post')}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-center"
              >
                <FileText className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <span className="text-xs">Create Post</span>
              </button>
              <button 
                onClick={() => handleQuickAction('find-people')}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-center"
              >
                <Users className="w-5 h-5 mx-auto mb-1 text-green-400" />
                <span className="text-xs">Find People</span>
              </button>
              <button 
                onClick={() => handleQuickAction('browse-jobs')}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-center"
              >
                <Briefcase className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                <span className="text-xs">Browse Jobs</span>
              </button>
              <button 
                onClick={() => handleQuickAction('analytics')}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-center"
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <span className="text-xs">Analytics</span>
              </button>

            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;