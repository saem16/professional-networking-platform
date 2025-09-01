import React, { useState, useEffect } from 'react';
import { getSession } from '../utils/Session';
import PostModal from './PostModal';
import axios from 'axios';

const RightSidebar = ({ onCollapsedChange }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapsedChange = (newCollapsed) => {
    setCollapsed(newCollapsed);
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    }
  };
  const [jobs, setJobs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const user = getSession('user');

  useEffect(() => {
    fetchRecentJobs();
    fetchNetworkPosts();

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
  }, []);

  const fetchRecentJobs = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs`);
      const data = response.data;
      setJobs(data.slice(0, 2));
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchNetworkPosts = async () => {
    try {
      const token = getSession('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/network`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = response.data;
      setPosts(data.slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch network posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  return (
    <>
      {collapsed ? (
        <div className={`w-16 bg-black text-white fixed right-0 top-0 h-full flex flex-col items-center py-4 space-y-4 ${notificationOpen ? '-z-10' : 'z-10'}`}>
          <button
            onClick={() => handleCollapsedChange(false)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zM8 6h8V4h-4v2z" />
            </svg>
          </div>

          {jobs.slice(0, 2).map((job, i) => (
            <div key={job._id} className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-xs font-bold text-black">{job.company.charAt(0)}</span>
            </div>
          ))}

          <div className="w-8 h-8 flex items-center justify-center mt-2">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99l-2.95 3.96c-.3.4-.22.96.18 1.26.4.3.96.22 1.26-.18L15.45 12H16v10h4z" />
            </svg>
          </div>

          {posts.slice(0, 4).map((post, i) => (
            <div key={post._id} className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{post.user.name.charAt(0)}</span>
            </div>
          ))}


        </div>
      ) : (
        <div className={`w-80 bg-black text-white fixed right-0 top-0 h-full overflow-y-auto ${notificationOpen ? '-z-10' : 'z-10'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          <div className="flex items-center justify-between p-4 pb-0">
            <h2 className="text-lg font-medium text-white">Open Roles</h2>
            <button
              onClick={() => handleCollapsedChange(true)}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>


          <div className="p-4">
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              {jobs.map((job, i) => (
                <div
                  key={job._id}
                  className="flex items-start gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors"
                  onClick={() => window.location.href = `/open-roles/job/${job._id}`}
                >
                  <div className="w-8 h-8 bg-white rounded flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-black">{job.company.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                      <span>{job.company}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(job.createdAt)}</span>
                    </div>
                    <div className="text-white text-sm font-medium">
                      {job.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Following</h2>
              <button className="p-1 hover:bg-gray-800 rounded transition-colors">
                <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {posts.map((post, i) => (
                <div
                  key={post._id}
                  className="cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{post.user.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white font-medium">{post.user.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400 text-xs">{formatTimeAgo(post.createdAt)}</span>
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        published a new post
                      </div>
                    </div>
                  </div>

                  <div className="ml-11 mb-2">
                    <div className="text-white font-medium text-sm mb-1 line-clamp-2">
                      {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </div>
                    {post.banner && (
                      <div className="w-12 h-12 bg-gray-700 rounded mt-2">
                        <img src={post.banner} alt="Post" className="w-full h-full object-cover rounded" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="p-4 pt-8">
            <button
              onClick={() => window.location.href = '/network'}
              className="w-full flex items-center justify-center gap-2 text-white text-sm py-2 hover:bg-gray-800 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              View Network
            </button>
          </div>
        </div>
      )}

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </>
  );
};

export default RightSidebar;