import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getSession } from '../utils/Session';
import {
  Bell,
  BellRing,
  User,
  Users,
  Heart,
  MessageCircle,
  Send,
  Eye,
  UserCheck,
  UserPlus,
  FileText,
  X,
  Check,
  CheckCheck,
  Filter,
  Settings,
  Clock,
  ChevronDown,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ unreadCount: 0, totalCount: 0 });
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async (pageNum = 1, reset = true) => {
    const token = getSession('token');
    if (!token) return;

    setLoading(true);
    try {
      const params = {
        page: pageNum,
        limit: 20,
        ...(filter !== 'all' && { type: filter }),
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (response.data.success) {
        const newNotifications = response.data.data.notifications;

        setNotifications(prev => {
          if (reset) return newNotifications;
          return newNotifications.concat(prev);
        });
        setStats(response.data.data.stats);
        setHasMore(response.data.data.pagination.hasNext);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setStats({ unreadCount: 0, totalCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    const token = getSession('token');
    if (!token) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/notifications/mark-read`,
        { notificationIds },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          } 
        }
      );

      setNotifications(prev =>
        prev.map(notif =>
          notificationIds.includes(notif._id)
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );

      setStats(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - notificationIds.length),
      }));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const token = getSession('token');
    if (!token) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/notifications/mark-all-read`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          } 
        }
      );

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      setStats(prev => ({ ...prev, unreadCount: 0 }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    const token = getSession('token');
    if (!token) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/notifications/${notificationId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          },
        }
      );

      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      setStats(prev => ({ 
        ...prev, 
        totalCount: Math.max(0, prev.totalCount - 1),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { size: 16, className: "text-white" };

    switch (type) {
      case 'follow':
        return <UserPlus {...iconProps} />;
      case 'connection_request':
      case 'connection_accepted':
        return <Users {...iconProps} />;
      case 'post_like':
        return <Heart {...iconProps} />;
      case 'post_comment':
      case 'comment_reply':
        return <MessageCircle {...iconProps} />;
      case 'message':
        return <Send {...iconProps} />;
      case 'post_published':
        return <FileText {...iconProps} />;
      case 'profile_view':
        return <Eye {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent') return 'bg-red-500';
    if (priority === 'high') return 'bg-orange-500';

    switch (type) {
      case 'follow':
        return 'bg-blue-500';
      case 'connection_request':
      case 'connection_accepted':
        return 'bg-green-500';
      case 'post_like':
        return 'bg-pink-500';
      case 'post_comment':
      case 'comment_reply':
        return 'bg-purple-500';
      case 'message':
        return 'bg-indigo-500';
      case 'post_published':
        return 'bg-yellow-500';
      case 'profile_view':
        return 'bg-gray-500';
      default:
        return 'bg-neutral-500';
    }
  };

  const getTimeDisplay = (createdAt) => {
    const now = new Date();
    const notifTime = new Date(createdAt);
    const diff = now - notifTime;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return notifTime.toLocaleDateString();
  };

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'follow', label: 'Follows' },
    { value: 'connection_request', label: 'Connection Requests' },
    { value: 'connection_accepted', label: 'Connections' },
    { value: 'post_like', label: 'Likes' },
    { value: 'post_comment', label: 'Comments' },
    { value: 'message', label: 'Messages' },
    { value: 'post_published', label: 'New Posts' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 lg:-translate-x-3/5 h-5/6 w-full sm:w-4/5 lg:w-3/5 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-b-lg flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800 p-3 lg:p-4">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="relative">
                <Bell size={20} className="lg:w-6 lg:h-6 text-white" />
                {stats.unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center">
                    {stats.unreadCount > 99 ? '99+' : stats.unreadCount}
                  </span>
                )}
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-white">Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X size={18} className="lg:w-5 lg:h-5" />
            </button>
          </div>

  
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="text-xs lg:text-sm text-neutral-400">
              {stats.unreadCount > 0 && (
                <span className="text-white font-medium">{stats.unreadCount} unread</span>
              )}
              {stats.unreadCount === 0 && "All caught up!"}
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => fetchNotifications(1, true)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                disabled={loading}
              >
                <RefreshCw size={14} className={`lg:w-4 lg:h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {stats.unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} className="lg:w-4 lg:h-4" />
                </button>
              )}
            </div>
          </div>

  
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-2 lg:px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors text-sm lg:text-base w-full sm:w-auto"
            >
              <Filter size={14} className="lg:w-4 lg:h-4" />
              <span className="truncate">{filterOptions.find(f => f.value === filter)?.label}</span>
              <ChevronDown size={14} className={`lg:w-4 lg:h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-20">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-700 transition-colors ${filter === option.value ? 'bg-neutral-700 text-white' : 'text-neutral-300'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={48} className="text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400">No notifications yet</p>
              <p className="text-sm text-neutral-500 mt-2">
                You'll see your latest updates here
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`group relative bg-neutral-800 border border-neutral-700 rounded-xl p-3 lg:p-4 hover:bg-neutral-750 transition-all duration-200 ${!notification.isRead ? 'bg-opacity-100 border-neutral-600' : 'bg-opacity-50'
                    }`}
                >
        
                  {!notification.isRead && (
                    <div className="absolute left-2 top-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}

                  <div className="flex items-start gap-2 lg:gap-3 pl-3 lg:pl-4">
          
                    <div className="relative flex-shrink-0">
                      <img
                        src={notification.sender?.profilePicture || '/placeholder-avatar.png'}
                        alt={notification.sender?.name}
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

          
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-xs lg:text-sm font-medium text-white mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-xs lg:text-sm text-neutral-300 leading-relaxed">
                            {notification.message}
                          </p>

              
                          {notification.metadata?.postTitle && (
                            <p className="text-xs text-neutral-400 mt-1 italic">
                              "{notification.metadata.postTitle}"
                            </p>
                          )}
                          {notification.metadata?.commentText && (
                            <p className="text-xs text-neutral-400 mt-1 italic">
                              "{notification.metadata.commentText}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1 lg:mt-2">
                            <span className="text-xs text-neutral-500">
                              {getTimeDisplay(notification.createdAt)}
                            </span>
                            {notification.batchCount > 1 && (
                              <span className="text-xs bg-neutral-700 text-neutral-300 px-1.5 lg:px-2 py-1 rounded-full">
                                +{notification.batchCount - 1} more
                              </span>
                            )}
                          </div>
                        </div>

            
                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead([notification._id]);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check size={12} className="lg:w-[14px] lg:h-[14px]" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} className="lg:w-[14px] lg:h-[14px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

        
                  {notification.metadata?.actionUrl && (
                    <div
                      className="absolute inset-0 cursor-pointer rounded-xl"
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead([notification._id]);
                        }

                        window.location.href = notification.metadata.actionUrl;
                      }}
                    />
                  )}
                </div>
              ))}

    
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={() => fetchNotifications(page + 1, false)}
                    disabled={loading}
                    className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>


      </div>
    </div>
  );
};

export default NotificationCenter;