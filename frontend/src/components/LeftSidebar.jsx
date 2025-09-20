import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  BellIcon,
  UserIcon,
  RectangleStackIcon,
  ArrowRightOnRectangleIcon,
  InboxIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { clearSession, getSession } from '../utils/Session';
import NotificationSystem from '../pages/NotificationSystem';

export default function LeftSidebar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    window.notificationModalOpen = showNotifications;
  }, [showNotifications]);

  useEffect(() => {
    window.profileMenuOpen = menuOpen;
  }, [menuOpen]);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = getSession('user');

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    const token = getSession('token');
    if (!token) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };
  const handleSignOut = () => {
    clearSession();
    window.location.href = '/signin';
  };

  const navItems = [
    { icon: <HomeIcon className="h-6 w-6" />, to: '/', label: 'Home' },
    {
      icon: <PlusIcon className="h-6 w-6" />,
      to: '/create-post',
      label: 'Create Post',
    },
    {
      icon: <BriefcaseIcon className="h-6 w-6" />,
      to: '/open-roles',
      label: 'Open Roles',
    },
    {
      icon: <UserGroupIcon className="h-6 w-6" />,
      to: '/network',
      label: 'Network',
    },
    {
      icon: <InboxIcon className="h-6 w-6" />,
      to: '/inbox',
      label: 'Inbox',
    },
    {
      icon: <MagnifyingGlassIcon className="h-6 w-6" />,
      to: '/search-users',
      label: 'Search Users',
    },
    {
      icon: <BellIcon className="h-6 w-6" />,
      label: 'Notifications',
      isNotification: true,
    },
  ];

  const profileMenu = [
    {
      icon: <RectangleStackIcon className="h-5 w-5" />,
      label: 'Dashboard',
      to: '/dashboard',
    },
    {
      icon: <UserIcon className="h-5 w-5" />,
      label: 'Profile',
      to: `/profile/${user.username}`,
    },
    ...(user.accountType === 'company' ? [
      {
        icon: <BriefcaseIcon className="h-5 w-5" />,
        label: 'Create Job',
        to: '/create-job',
      },
      {
        icon: <UserGroupIcon className="h-5 w-5" />,
        label: 'Manage Jobs',
        to: '/company/jobs',
      }
    ] : [
      {
        icon: <BookmarkIcon className="h-5 w-5" />,
        label: 'My Jobs',
        to: '/my-jobs',
      }
    ]),
    {
      icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />,
      label: 'Sign Out',
      onClick: handleSignOut, 
    },
  ];

  return (
    <div className="w-20 bg-neutral-900 text-white flex flex-col items-center py-6 space-y-6 fixed h-full">
      <Link to="/" className="mb-6">
        <img 
          src="/src/images/logo_1.png" 
          alt="Logo" 
          className="w-10 h-10 hover:opacity-80 transition-opacity"
        />
      </Link>
      {navItems.map((item, i) => (
        item.isNotification ? (
          <button
            key={i}
            onClick={() => setShowNotifications(true)}
            className={`relative p-2 rounded-lg hover:bg-neutral-800 ${
              showNotifications ? 'bg-neutral-800' : ''
            }`}
          >
            {item.icon}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3"></span>
            )}
          </button>
        ) : (
          <Link
            key={i}
            to={item.to}
            className={`p-2 rounded-lg hover:bg-neutral-800 ${
              item.to === '/'
                ? pathname === '/'
                  ? 'bg-neutral-800'
                  : ''
                : pathname.startsWith(item.to) || (item.to === '/open-roles' && pathname.startsWith('/job/'))
                ? 'bg-neutral-800'
                : ''
            }`}
          >
            {item.icon}
          </Link>
        )
      ))}

      <div className="mt-auto relative">
        <img
          src={user.profilePicture}
          alt="profile"
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        />

        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => {
              setMenuOpen(false);
              window.profileMenuOpen = false;
            }}
          ></div>
        )}

        {menuOpen && (
          <div className="absolute bottom-14 left-14 w-48 bg-neutral-800 text-white rounded-xl shadow-lg z-50">
            <ul className="flex flex-col">
              {profileMenu.map((item, idx) => (
                item.onClick ? (
                  <button
                    key={idx}
                    onClick={() => {
                      setMenuOpen(false);
                      window.profileMenuOpen = false;
                      item.onClick();
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 rounded-lg transition w-full text-left"
                  >
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={idx}
                    to={item.to}
                    onClick={() => {
                      setMenuOpen(false);
                      window.profileMenuOpen = false;
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-700 rounded-lg transition"
                  >
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              ))}
            </ul>
          </div>
        )}
      </div>

      <NotificationSystem 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          window.notificationModalOpen = false;
          fetchUnreadCount();
        }} 
      />
    </div>
  );
}
