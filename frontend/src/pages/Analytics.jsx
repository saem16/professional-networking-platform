import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Activity,
  ArrowUp,
} from 'lucide-react';
import { getSession } from '../utils/Session';

const Analytics = () => {
  const [user] = useState(getSession('user'));
  const token = getSession('token');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    profileViews: 0,
    connections: 0,
    followers: 0
  });
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [postsRes, notificationsRes, followersRes, followingRes, connectionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/posts/user-posts?username=${user?.username}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/follow/followers/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/follow/following/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/social/connections/${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const userPosts = postsRes.data || [];
      setPosts(userPosts);


      const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
      const totalComments = userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);


      const followersCount = followersRes.data?.success ? followersRes.data.data.followers?.length || 0 : 0;
      const connectionsCount = connectionsRes.data?.success ? connectionsRes.data.data.connections?.length || 0 : 0;
      

      const profileViewNotifications = notifications.filter(n => n.type === 'profile_view');
      const profileViews = profileViewNotifications.length;

      setAnalytics({
        totalPosts: userPosts.length,
        totalLikes,
        totalComments,
        profileViews,
        connections: connectionsCount,
        followers: followersCount
      });

      if (notificationsRes.data.success) {
        setNotifications(notificationsRes.data.data.notifications || []);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);

      setAnalytics({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        profileViews: 0,
        connections: 0,
        followers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getTopPosts = () => {
    return posts
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, 5);
  };

  const getEngagementRate = () => {
    if (analytics.totalPosts === 0) return 0;
    return ((analytics.totalLikes + analytics.totalComments) / analytics.totalPosts).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-3 sm:p-4 lg:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-neutral-400 text-sm sm:text-base">Track your performance and engagement metrics</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Posts</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.totalPosts}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">+12%</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Total Likes</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.totalLikes}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">+8%</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Comments</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.totalComments}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">+15%</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Profile Views</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.profileViews}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">+5%</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Connections</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{analytics.connections}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">+3%</span>
          </div>
        </div>

        <div className="bg-neutral-900 p-3 sm:p-4 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            <span className="text-xs sm:text-sm text-neutral-400">Engagement</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{getEngagementRate()}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">+7%</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
              <h2 className="text-lg sm:text-xl font-semibold">Top Performing Posts</h2>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-hidden">
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {getTopPosts().map((post, index) => (
                <div key={post._id} className="p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-white mb-2 break-words">
                        {post.content?.replace(/<[^>]*>/g, '').substring(0, 120) || 'No content'}...
                      </p>
                      <div className="flex items-center gap-4 text-xs sm:text-sm text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" />
                          {post.likes?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-blue-400" />
                          {post.comments?.length || 0}
                        </span>
                        <span className="text-neutral-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {getTopPosts().length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-500 font-medium">No posts available</p>
                  <p className="text-neutral-600 text-sm mt-1">Create your first post to see analytics</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h2 className="text-lg sm:text-xl font-semibold">Recent Activity</h2>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-hidden">
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {notifications.slice(0, 10).map(notification => (
                <div key={notification._id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base text-white break-words">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-neutral-400">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                      <span className="w-1 h-1 bg-neutral-600 rounded-full"></span>
                      <span className="text-xs text-neutral-500 capitalize">{notification.type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-500 font-medium">No recent activity</p>
                  <p className="text-neutral-600 text-sm mt-1">Start engaging to see activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </div>
  );
};

export default Analytics;