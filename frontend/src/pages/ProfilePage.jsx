
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getSession } from '../utils/Session';
import { showToast } from '../utils/toast';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  Eye,
  MessageCircle,
  ThumbsUp,
  Share,
  Plus,
  Edit3,
  ExternalLink,
  Building,
  Clock,
  Star,
  BookOpen,
  Target,
  UserPlus,
  UserCheck,
  UserX,
  Settings,
} from 'lucide-react';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [socialStats, setSocialStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const { username } = useParams();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [companyEmployees, setCompanyEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      const sessionUser = getSession('user');
      const token = getSession('token');
      if (!sessionUser || !sessionUser.id) return;
      setLoadingProfile(true);

      try {
        const profileRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/profile/${username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let posts = [];
        try {
          const postsRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/posts/user-posts`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { username: username }
            }
          );
          posts = Array.isArray(postsRes.data) ? postsRes.data : [];
        } catch (err) {
          showToast.error('Failed to load posts');
        }

        const skills =
          Array.isArray(profileRes.data.skills) && profileRes.data.skills.length
            ? profileRes.data.skills.map(s =>
              typeof s === 'string'
                ? { name: s, level: 60, endorsements: 0 }
                : {
                  name: s.name || '',
                  level: 60,
                  endorsements: Array.isArray(s.endorsements)
                    ? s.endorsements.length
                    : 0,
                }
            )
            : [];

        setProfileData({
          ...profileRes.data,
          skills,
          posts: posts.length ? posts : [],
        });

        await loadSocialStats(profileRes.data._id);

        if (profileRes.data.accountType === 'company') {
          await loadCompanyEmployees(profileRes.data.companyProfile?.companyName || profileRes.data.name);
        }

      } catch (err) {
        showToast.error('Failed to load profile');
        setProfileData({
          name: 'User',
          email: '',
          accountType: 'student',
          skills: [],
          posts: [],
          connections: [],
          followers: [],
          following: [],
          experience: [],
          education: [],
          certifications: [],
        });
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [username]);

  const loadCompanyEmployees = async (companyName) => {
    if (!companyName) return;

    const token = getSession('token');
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/company-employees?company=${encodeURIComponent(companyName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCompanyEmployees(response.data.employees || []);
    } catch (error) {
      showToast.error('Failed to load company employees');
      setCompanyEmployees([]);
    }
  };

  const loadSocialStats = async (userId) => {
    const token = getSession('token');
    if (!token || !userId) return;

    try {
      const statsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/social/stats/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSocialStats(statsRes.data.data.stats);

      if (statsRes.data.data.relationshipStatus) {
        setIsFollowing(statsRes.data.data.relationshipStatus.isFollowing);
        setConnectionStatus(statsRes.data.data.relationshipStatus);
      }

    } catch (err) {
      showToast.error('Failed to load social stats');
      setSocialStats({
        followersCount: Array.isArray(profileData?.followers) ? profileData.followers.length : 0,
        followingCount: Array.isArray(profileData?.following) ? profileData.following.length : 0,
        connectionsCount: Array.isArray(profileData?.connections) ? profileData.connections.length : 0,
        postsCount: Array.isArray(profileData?.posts) ? profileData.posts.length : 0,
      });
    }
  };

  const handleFollowToggle = async () => {
    if (!profileData || followLoading) return;

    const token = getSession('token');
    if (!token) return;

    setFollowLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/follow/toggle/${profileData._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const newFollowStatus = response.data.data.isFollowing;
        setIsFollowing(newFollowStatus);

        setSocialStats(prev => ({
          ...prev,
          followersCount: newFollowStatus
            ? (prev?.followersCount || 0) + 1
            : Math.max((prev?.followersCount || 0) - 1, 0)
        }));

        if (connectionStatus) {
          setConnectionStatus(prev => ({
            ...prev,
            isFollowing: newFollowStatus,
            isMutual: newFollowStatus && prev.isFollowedBy
          }));
        }
      }
    } catch (error) {
      showToast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleConnectionRequest = async () => {
    if (!profileData || connectionLoading) return;

    const token = getSession('token');
    if (!token) return;

    setConnectionLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/connection/request/${profileData._id}`,
        {
          message: `Hi ${profileData.name}, I'd like to connect with you.`,
          connectionType: 'professional'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setConnectionStatus(prev => ({
          ...prev,
          pendingConnection: {
            id: response.data.data.request._id,
            requester: getSession('user').id,
            recipient: profileData._id,
            isRequester: true,
          }
        }));
      }
    } catch (error) {
      showToast.error('Failed to send connection request');
    } finally {
      setConnectionLoading(false);
    }
  };

  useEffect(() => {
    if (profileData?.accountType === 'company') {
      setActiveTab('posts');
    } else {
      setActiveTab('posts');
    }
  }, [profileData?.accountType]);

  useEffect(() => {
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
  }, [])

  if (!profileData) {
    return (
      <div className="flex justify-center items-center h-64 bg-black">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-3 sm:px-4 py-2 font-medium transition-all duration-200 border-b-2 text-sm sm:text-base whitespace-nowrap ${isActive
        ? 'text-white border-white'
        : 'text-neutral-400 border-transparent hover:text-white hover:border-neutral-600'
        }`}
    >
      {label}
    </button>
  );

  const SkillItem = ({ skill }) => (
    <div className="flex justify-between items-center p-2 sm:p-3 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors">
      <span className="text-white font-medium text-sm sm:text-base truncate mr-2">{skill.name}</span>
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-neutral-400 flex-shrink-0">
        <Users size={12} className="sm:w-3.5 sm:h-3.5" />
        <span>{skill.endorsements}</span>
      </div>
    </div>
  );

  const PostCard = ({ post }) => {
    const getCount = v => {
      if (Array.isArray(v)) return v.length;
      if (typeof v === 'number') return v;
      if (v && typeof v === 'object') {
        if (typeof v.length === 'number') return v.length;
        return Object.keys(v).length;
      }
      return 0;
    };

    return (
      <div className="break-inside-avoid bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl">
        {post.image && (
          <div className="relative group">
            <img
              src={post.image}
              alt="Post content"
              className="w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72 object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1 sm:gap-2">
                <button className="bg-white/90 hover:bg-white p-1.5 sm:p-2 rounded-full text-black transition-all duration-200">
                  <ThumbsUp size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button className="bg-white/90 hover:bg-white p-1.5 sm:p-2 rounded-full text-black transition-all duration-200">
                  <Share size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 sm:p-4">
          <p className="text-neutral-200 leading-relaxed text-xs sm:text-sm mb-3 sm:mb-4">
            {getPreviewContent(post.content)}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img
                src={profileData.profilePicture}
                alt={getDisplayName()}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-white text-xs sm:text-sm font-medium truncate">
                  {getDisplayName()}
                </span>
                <span className="text-neutral-400 text-xs">
                  {post.timestamp}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs text-neutral-400 ml-2">
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => navigate(`/create-post?edit=${post._id}`)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal(post)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </>
              )}
              <div className="flex items-center gap-1">
                <ThumbsUp size={10} className="sm:w-3 sm:h-3" />
                <span>{getCount(post.likes)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={10} className="sm:w-3 sm:h-3" />
                <span>{getCount(post.comments)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLocation = loc => {
    if (!loc) return '';
    if (typeof loc === 'string') return loc;
    if (loc.city || loc.country) {
      return [loc.city, loc.country].filter(Boolean).join(', ');
    }
    if (loc.address) return loc.address;
    return Object.values(loc || {}).filter(Boolean).join(', ');
  };

  const stripHtml = html => {
    if (!html) return '';
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    } catch (e) {
      return String(html);
    }
  };

  const getPreviewContent = content => {
    const text = stripHtml(content);
    if (!text) return '';
    const previewLen = Math.max(80, Math.min(300, 80 + (text.length % 160)));
    return text.length > previewLen
      ? text.slice(0, previewLen).trim() + '...'
      : text;
  };

  const filterValidCerts = certs =>
    Array.isArray(certs)
      ? certs.filter(cert => {
        if (!cert || typeof cert !== 'object') return false;
        const hasText = val => typeof val === 'string' && val.trim().length > 0;
        return (
          hasText(cert.name) ||
          hasText(cert.issuer) ||
          hasText(cert.credentialId) ||
          hasText(cert.url) ||
          Boolean(cert.date)
        );
      })
      : [];

  const filterValidExperience = exps =>
    Array.isArray(exps)
      ? exps.filter(exp => {
        if (!exp || typeof exp !== 'object') return false;
        const hasText = v => typeof v === 'string' && v.trim().length > 0;
        return (
          hasText(exp.title) ||
          hasText(exp.company) ||
          hasText(exp.location) ||
          hasText(exp.description) ||
          Boolean(exp.startDate) ||
          Boolean(exp.endDate) ||
          Boolean(exp.current)
        );
      })
      : [];

  const filterValidEducation = eds =>
    Array.isArray(eds)
      ? eds.filter(edu => {
        if (!edu || typeof edu !== 'object') return false;
        const hasText = v => typeof v === 'string' && v.trim().length > 0;
        return (
          hasText(edu.institution) ||
          hasText(edu.degree) ||
          hasText(edu.fieldOfStudy) ||
          hasText(edu.description) ||
          Boolean(edu.startYear) ||
          Boolean(edu.endYear) ||
          Boolean(edu.gpa)
        );
      })
      : [];

  const getDisplayName = () => {
    if (profileData.accountType === 'company') {
      return profileData.companyProfile?.companyName || profileData.name || 'Company';
    }
    return profileData.name || 'User';
  };

  const getHeadline = () => {
    if (profileData.accountType === 'company') {
      return profileData.companyProfile?.description || profileData.headline || '';
    }
    return profileData.headline || '';
  };

  const getAccountTypeIcon = () => {
    switch (profileData.accountType) {
      case 'student':
        return <BookOpen size={16} />;
      case 'employee':
        return <Briefcase size={16} />;
      case 'company':
        return <Building size={16} />;
      default:
        return <Users size={16} />;
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      student: 'bg-neutral-600 text-white',
      employed: 'bg-neutral-700 text-white',
      looking: 'bg-neutral-500 text-white',
      freelancer: 'bg-neutral-800 text-white',
      hiring: 'bg-black text-white border border-neutral-600',
    };

    const statusText = {
      student: 'Student',
      employed: 'Employed',
      looking: 'Looking for opportunities',
      freelancer: 'Freelancer',
      hiring: 'Hiring',
    };

    return (
      <div className={`px-2 py-1 rounded-full text-xs ${statusColors[profileData.status] || 'bg-neutral-500 text-white'}`}>
        {statusText[profileData.status] || profileData.status}
      </div>
    );
  };

  const getConnectionButton = () => {
    if (connectionLoading) {
      return (
        <button className="px-4 py-2 bg-neutral-700 text-neutral-400 rounded-lg cursor-not-allowed">
          Loading...
        </button>
      );
    }

    if (connectionStatus?.areConnected) {
      return (
        <button className="px-4 py-2 bg-neutral-800 text-white border border-neutral-600 rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-2">
          <UserCheck size={16} />
          Connected
        </button>
      );
    }

    if (connectionStatus?.pendingConnection) {
      const isRequester = connectionStatus.pendingConnection.isRequester;
      return (
        <button className="px-4 py-2 bg-neutral-700 text-neutral-300 rounded-lg cursor-not-allowed flex items-center gap-2">
          <Clock size={16} />
          {isRequester ? 'Request Sent' : 'Request Received'}
        </button>
      );
    }

    return (
      <button
        onClick={handleConnectionRequest}
        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2"
      >
        <UserPlus size={16} />
        Connect
      </button>
    );
  };

  const validCertifications = filterValidCerts(profileData.certifications || []);
  const validExperience = filterValidExperience(profileData.experience || []);
  const validEducation = filterValidEducation(profileData.education || []);

  const currentUser = getSession('user');
  const isOwnProfile = profileData && currentUser && (profileData._id === currentUser.id);

  const companyName = profileData?.companyProfile?.companyName || profileData?.company || '';
  const companyWebsite = profileData?.companyProfile?.website || '';
  const companyIndustry = profileData?.companyProfile?.industry || '';
  const companyFounded = profileData?.companyProfile?.foundedYear || null;


  const isCompany = profileData?.accountType === 'company';
  const isStudent = profileData?.accountType === 'student';
  const isEmployee = profileData?.accountType === 'employee';

  return (
    <div className="min-h-screen bg-black text-white">
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black border border-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-white">Delete Post</h3>
            <p className="text-white mb-4">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-white hover:bg-neutral-800 border border-neutral-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = getSession('token');
                    await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${deleteModal._id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    setProfileData(prev => ({
                      ...prev,
                      posts: prev.posts.filter(p => p._id !== deleteModal._id)
                    }));
                    setDeleteModal(null);
                  } catch (error) {
                    showToast.error('Failed to delete post');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`relative ${notificationOpen ? '-z-10' : ''}`}>
        <div
          className="h-48 sm:h-56 md:h-64 lg:h-72 bg-gradient-to-r from-neutral-900 to-neutral-700"
          style={{
            backgroundImage: `url(${profileData.coverPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16">
            <div className="relative flex-shrink-0">
              <img
                src={profileData.profilePicture}
                alt={getDisplayName()}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-black object-cover"
              />
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-black"></div>
            </div>

            <div className="flex-1 sm:mb-2 md:mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start lg:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {getDisplayName()}
                    </h1>
                    <div className="flex items-center gap-2">
                      {getAccountTypeIcon()}
                      <span className="text-xs sm:text-sm text-neutral-400 capitalize">
                        {profileData.accountType}
                      </span>
                    </div>
                  </div>

                  <p className="text-base sm:text-lg md:text-xl text-neutral-300 mb-2">
                    {getHeadline()}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-400 mb-2">
                    {isCompany ? (
                      <>
                        {companyIndustry && (
                          <div className="flex items-center gap-1">
                            <Briefcase size={14} className="sm:w-4 sm:h-4" />
                            <span>{companyIndustry}</span>
                          </div>
                        )}
                        {companyFounded && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="sm:w-4 sm:h-4" />
                            <span>Founded {companyFounded}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {profileData.profession && (
                          <div className="flex items-center gap-1">
                            <Briefcase size={14} className="sm:w-4 sm:h-4" />
                            <span>{profileData.profession}</span>
                          </div>
                        )}
                        {profileData.location.country && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="sm:w-4 sm:h-4" />
                            <span>{renderLocation(profileData.location)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  {!isOwnProfile && (
                    <>
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${followLoading
                          ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                          : isFollowing
                            ? 'bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700'
                            : 'bg-white text-black hover:bg-neutral-200'
                          }`}
                      >
                        {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                      </button>

                      {!isCompany && (
                        <div className="flex-shrink-0">
                          {getConnectionButton()}
                        </div>
                      )}

                      {!isCompany && (
                        <button
                          onClick={() => navigate('/inbox', { state: { startConversationWith: profileData } })}
                          className="px-3 sm:px-4 py-2 border border-white rounded-lg text-white hover:bg-white hover:text-black transition-all duration-200 text-sm sm:text-base"
                        >
                          Message
                        </button>
                      )}

                      {isCompany && companyWebsite && (
                        <a
                          href={companyWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 sm:px-4 py-2 border border-white rounded-lg text-white hover:bg-white hover:text-black transition-all duration-200 text-sm sm:text-base text-center"
                        >
                          Visit Website
                        </a>
                      )}
                    </>
                  )}

                  <div className="flex gap-2">
                    {isOwnProfile && (
                      <button
                        onClick={() => navigate('/profile-settings')}
                        className="p-2 border border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-white transition-all duration-200 self-center sm:self-auto"
                      >
                        <Settings size={18} className="sm:w-5 sm:h-5" />
                      </button>
                    )}
                    <button className="p-2 border border-neutral-600 rounded-lg text-neutral-400 hover:text-white hover:border-white transition-all duration-200 self-center sm:self-auto">
                      <Share size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 mt-4 sm:mt-6 pb-4 sm:pb-6 border-b border-neutral-800">
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {socialStats?.connectionsCount || 0}+
              </div>
              <div className="text-xs sm:text-sm text-neutral-400">Connections</div>
            </div>

            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {isCompany
                  ? (companyEmployees?.length || 0)
                  : (socialStats?.followersCount || 0).toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-neutral-400">
                {isCompany ? 'Employees' : 'Followers'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {isCompany
                  ? (profileData.listings?.length || 0)
                  : (socialStats?.followingCount || 0)}
              </div>
              <div className="text-xs sm:text-sm text-neutral-400">
                {isCompany ? 'Listings' : 'Following'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {socialStats?.postsCount || profileData.posts?.length || 0}
              </div>
              <div className="text-xs sm:text-sm text-neutral-400">Posts</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">About</h3>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-3 sm:mb-4">
                {isCompany
                  ? profileData.companyProfile?.description || profileData.bio || 'No description available.'
                  : profileData.bio || 'No bio available.'}
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                {isCompany ? (
                  <>
                    {companyWebsite && (
                      <div className="flex items-center gap-2 text-neutral-400">
                        <ExternalLink size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <a
                          href={companyWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-300 hover:underline break-all"
                        >
                          {companyWebsite}
                        </a>
                      </div>
                    )}
                    {companyFounded && (
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Calendar size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Founded {companyFounded}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Users size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{companyEmployees?.length || 0} employees</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Mail size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="break-all">{profileData.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Calendar size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>
                        Joined{' '}
                        {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                    {profileData.profession && (
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Target size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{profileData.profession}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {!isCompany && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Skills</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {Array.isArray(profileData.skills) && profileData.skills.length > 0 ? (
                    profileData.skills.map((skill, index) => (
                      <SkillItem key={index} skill={skill} />
                    ))
                  ) : (
                    <div className="col-span-full">
                      <p className="text-neutral-400 text-center text-sm">No skills added yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isCompany && validCertifications.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Certifications</h3>
                  <button className="text-neutral-400 hover:text-white">
                    <Plus size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {validCertifications.map((cert, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="bg-neutral-800 p-2 rounded-lg flex-shrink-0">
                        <Award size={16} className="sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm sm:text-base">{cert.name || '—'}</h4>
                        <p className="text-xs sm:text-sm text-neutral-400">{cert.issuer || '—'}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 text-xs text-neutral-500">
                          <span>{cert.date ? String(cert.date).slice(0, 10) : '—'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="break-all">{cert.credentialId || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="flex items-center border-b border-neutral-800 px-3 sm:px-6 overflow-x-auto">
                <TabButton
                  id="posts"
                  label="Posts"
                  isActive={activeTab === 'posts'}
                  onClick={setActiveTab}
                />

                {isCompany && (
                  <>
                    <TabButton
                      id="listings"
                      label="Job Listings"
                      isActive={activeTab === 'listings'}
                      onClick={setActiveTab}
                    />
                    <TabButton
                      id="employees"
                      label="Employees"
                      isActive={activeTab === 'employees'}
                      onClick={setActiveTab}
                    />
                  </>
                )}

                {!isCompany && (
                  <>
                    <TabButton
                      id="experience"
                      label="Experience"
                      isActive={activeTab === 'experience'}
                      onClick={setActiveTab}
                    />
                    <TabButton
                      id="education"
                      label="Education"
                      isActive={activeTab === 'education'}
                      onClick={setActiveTab}
                    />
                  </>
                )}
              </div>

              <div className="p-3 sm:p-6">
                {activeTab === 'posts' && (
                  <div>
                    {isOwnProfile && (
                      <div className="mb-4 sm:mb-6">
                        <div className="bg-black border border-neutral-700 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                          <img
                            src={profileData.profilePicture}
                            alt="Your avatar"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <button className="flex-1 text-left px-3 sm:px-4 py-2 sm:py-3 bg-neutral-900 border border-neutral-700 rounded-full text-neutral-400 hover:border-neutral-600 transition-colors text-sm sm:text-base">
                            Share your thoughts...
                          </button>
                        </div>
                      </div>
                    )}

                    {Array.isArray(profileData.posts) && profileData.posts.length > 0 ? (
                      <>
                        <div className="columns-1 md:columns-2 xl:columns-3 gap-3 sm:gap-4" style={{ columnGap: '1rem' }}>
                          {profileData.posts.slice((currentPage - 1) * 6, currentPage * 6).map(post => (
                            <div key={post._id || post.id} className="inline-block w-full mb-3 sm:mb-4">
                              <PostCard post={post} />
                            </div>
                          ))}
                        </div>
                        {profileData.posts.length > 6 && (
                          <div className="flex justify-center mt-6">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-neutral-800 text-white rounded disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <span className="px-3 py-1 text-neutral-400">
                                {currentPage} of {Math.ceil(profileData.posts.length / 6)}
                              </span>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(profileData.posts.length / 6)))}
                                disabled={currentPage === Math.ceil(profileData.posts.length / 6)}
                                className="px-3 py-1 bg-neutral-800 text-white rounded disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 text-center text-neutral-400 text-sm sm:text-base">
                        No posts available
                      </div>
                    )}
                  </div>
                )}

                {isCompany && activeTab === 'listings' && (
                  <div>
                    {Array.isArray(profileData.listings) && profileData.listings.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {profileData.listings.map((listing, i) => (
                          <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4">
                            <h4 className="font-semibold text-white text-sm sm:text-base">{listing.title}</h4>
                            <p className="text-neutral-400 text-xs sm:text-sm">
                              {listing.company || companyName} • {listing.type}
                            </p>
                            <div className="text-neutral-500 text-xs mt-2">
                              Posted {listing.postedAt ? String(listing.postedAt).slice(0, 10) : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 text-center text-neutral-400 text-sm sm:text-base">
                        No job listings available
                      </div>
                    )}
                  </div>
                )}

                {isCompany && activeTab === 'employees' && (
                  <div className="space-y-3 sm:space-y-4">
                    {companyEmployees && companyEmployees.length > 0 ? (
                      companyEmployees.map((emp, idx) => (
                        <div key={emp._id || emp.id || idx} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                          <img
                            src={emp.profilePicture || '/placeholder.png'}
                            alt={emp.name || emp.fullName || 'Employee'}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm sm:text-base">
                              {emp.name || emp.fullName || emp.email || '—'}
                            </div>
                            <div className="text-xs sm:text-sm text-neutral-400 truncate">
                              {emp.profession || emp.headline || '—'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 text-center text-neutral-400 text-sm sm:text-base">
                        No employees listed
                      </div>
                    )}
                  </div>
                )}

                {!isCompany && activeTab === 'experience' && (
                  <div className="space-y-4 sm:space-y-6">
                    {validExperience.length > 0 ? (
                      validExperience.map((exp, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-neutral-800 last:border-b-0">
                          <div className="bg-neutral-800 p-2 sm:p-3 rounded-lg flex-shrink-0 self-start">
                            <Briefcase size={20} className="sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg sm:text-xl font-semibold text-white">
                              {exp.title || '—'}
                            </h4>
                            <p className="text-base sm:text-lg text-neutral-300 mb-1">
                              {exp.company || '—'}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-400 mb-2 sm:mb-3">
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span>
                                  {exp.startDate && exp.endDate
                                    ? `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`
                                    : '—'}
                                </span>
                              </div>
                              {exp.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} className="sm:w-3.5 sm:h-3.5" />
                                  <span>{exp.location}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                              {exp.description || '—'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 text-center text-neutral-400 text-sm sm:text-base">
                        No work experience available
                      </div>
                    )}
                  </div>
                )}

                {!isCompany && activeTab === 'education' && (
                  <div className="space-y-4 sm:space-y-6">
                    {validEducation.length > 0 ? (
                      validEducation.map((edu, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-neutral-800 last:border-b-0">
                          <div className="bg-neutral-800 p-2 sm:p-3 rounded-lg flex-shrink-0 self-start">
                            <GraduationCap size={20} className="sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg sm:text-xl font-semibold text-white">
                              {edu.institution || '—'}
                            </h4>
                            <p className="text-base sm:text-lg text-neutral-300 mb-1">
                              {edu.degree || '—'} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-400 mb-2 sm:mb-3">
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                                <span>
                                  {edu.startYear && edu.endYear
                                    ? `${edu.startYear} - ${edu.endYear}`
                                    : '—'}
                                </span>
                              </div>
                              {edu.gpa && (
                                <div className="flex items-center gap-1">
                                  <Star size={12} className="sm:w-3.5 sm:h-3.5" />
                                  <span>GPA: {edu.gpa}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                              {edu.description || '—'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-6 text-center text-neutral-400 text-sm sm:text-base">
                        Education information not available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;