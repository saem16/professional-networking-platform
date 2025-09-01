import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  PlusCircle,
  FilePlus,
  MessageCircle,
  Bell,
  Users,
  BarChart3,
  User,
  Settings,
  LogOut,
  X,
  Menu,
  Bookmark,
  Search
} from 'lucide-react';
import { getSession, clearSession } from '../utils/Session';
import NotificationSystem from '../pages/NotificationSystem';

const RadialNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const user = getSession('user');

  const mainNavItems = [
    { id: 'home', icon: Home, path: '/' },
    { id: 'jobs', icon: Briefcase, path: '/open-roles' },
    { id: 'profile', icon: User, path: null, isProfile: true },
    { id: 'network', icon: Users, path: '/network' },
    {
      id: 'notifications', icon: Bell, action: () => {
        setShowNotifications(true);
        // Set window property for RightSidebar z-index management
        window.notificationModalOpen = true;
        window.dispatchEvent(new Event('notificationStateChange'));
      }
    },
  ];


  const profileMenuItems = [
    { id: 'messages', icon: MessageCircle, path: '/inbox' },
    { id: 'dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'search-users', icon: Search, path: '/search-users' },
    { id: 'create-post', icon: PlusCircle, path: '/create-post' },
    { id: 'profile', icon: User, path: `/profile/${user?.username}` },
    ...(user?.accountType === 'company'
      ? [
          { id: 'create-job', icon: FilePlus, path: '/create-job' },
          { id: 'manage-jobs', icon: Users, path: '/company/jobs' }
        ]
      : [
          { id: 'my-jobs', icon: Bookmark, path: '/my-jobs' }
        ]),
    { id: 'settings', icon: Settings, path: '/profile-settings' },
    { id: 'logout', icon: LogOut, action: handleLogout }
  ];

  function handleLogout() {
    clearSession();
    navigate('/login');
    setProfileMenuOpen(false);
    setIsOpen(false);
  }

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    // Clear window property for RightSidebar z-index management
    window.notificationModalOpen = false;
    window.dispatchEvent(new Event('notificationStateChange'));
  };

  const handleNavigation = (path) => {
    if (!path) return;
    navigate(path);
    setIsOpen(false);
    setProfileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const isActive = (path) => location.pathname === path;

  // Position items in bottom semicircle
  const getRadialPosition = (index, total, radius = 90) => {
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const step = (endAngle - startAngle) / (total - 1);
    const angle = startAngle + index * step;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  // Submenu above profile button (further outward than main items)
  const getProfileRadialPosition = (index, total, radius = 140) => {
    // wider arc for clarity
    const startAngle = Math.PI * 1.1;  // ~200deg
    const endAngle = Math.PI * 1.9;    // ~340deg
    const step = (endAngle - startAngle) / (total - 1);
    const angle = startAngle + index * step;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };



  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => {
            setIsOpen(false);
            setProfileMenuOpen(false);
          }}
        />
      )}

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        {/* Main Radial Items */}
        {isOpen && (
          <div className="relative">
            {mainNavItems.map((item, index) => {
              const { x, y } = getRadialPosition(index, mainNavItems.length);
              const Icon = item.icon;
              const active = item.path && isActive(item.path);

              return (
                <div
                  key={item.id}
                  className="absolute transition-all duration-300 ease-out"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transitionDelay: `${index * 40}ms`
                  }}
                >
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else if (item.isProfile) {
                        handleProfileClick();
                      } else {
                        handleNavigation(item.path);
                      }
                    }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      border-2 backdrop-blur-md transition-all duration-200
                      hover:scale-110 active:scale-95 shadow-lg
                      ${active
                        ? 'bg-white text-black border-white shadow-white/20'
                        : 'bg-black/80 text-white border-neutral-600 hover:border-white hover:bg-neutral-900'
                      }
                    `}
                  >
                    <Icon size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Profile Submenu */}
        {isOpen && profileMenuOpen && (
          <div className="relative">
            {profileMenuItems.map((item, index) => {
              const { x, y } = getProfileRadialPosition(index, profileMenuItems.length);
              const Icon = item.icon;
              const active = item.path && isActive(item.path);

              return (
                <div
                  key={item.id}
                  className="absolute transition-all duration-200 ease-out"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    transitionDelay: `${index * 30}ms`
                  }}
                >
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        handleNavigation(item.path);
                      }
                      setProfileMenuOpen(false);
                      setIsOpen(false);
                    }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      border-2 backdrop-blur-md transition-all duration-200
                      hover:scale-110 active:scale-95 shadow-md
                      ${active
                        ? 'bg-white text-black border-white'
                        : item.id === 'logout'
                          ? 'bg-red-600/80 text-white border-red-500 hover:bg-red-500'
                          : 'bg-neutral-800/80 text-white border-neutral-600 hover:border-white hover:bg-neutral-700'
                      }
                    `}
                  >
                    {item.id === 'profile' && user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <Icon size={16} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Central Toggle */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (isOpen) setProfileMenuOpen(false);
          }}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            border-2 backdrop-blur-md transition-all duration-300
            hover:scale-110 active:scale-95 shadow-xl
            ${isOpen
              ? 'bg-white text-black border-white shadow-white/30 rotate-180'
              : 'bg-black text-white border-neutral-600 hover:border-white shadow-black/30'
            }
          `}
        >
          {isOpen ? (
            <X size={24} />
          ) : (
            <img 
              src="/src/images/logo_1.png" 
              alt="Logo" 
              className="w-8 h-8"
            />
          )}
        </button>
      </div>

      {/* Notification Modal */}
      <NotificationSystem
        isOpen={showNotifications}
        onClose={handleCloseNotifications}
      />
    </>
  );
};

export default RadialNavbar;
