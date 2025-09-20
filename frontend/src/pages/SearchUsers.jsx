import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { getSession } from '../utils/Session';
import { showToast } from '../utils/toast';

export default function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const token = getSession('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(response.data.users || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setUsers([]);
      } else {
        showToast.error('Search failed');
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchUsers]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Search Users</h1>
        
        <div className="relative mb-8">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-white transition-colors"
          />
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div key={user._id} className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 hover:border-neutral-600 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{user.name}</h3>
                  <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                </div>
              </div>
              
              {user.headline && (
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{user.headline}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs bg-neutral-800 px-2 py-1 rounded capitalize">
                  {user.accountType}
                </span>
                <div className="flex space-x-2">
                  <Link
                    to={`/profile/${user.username}`}
                    className="text-sm bg-white text-black px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    View
                  </Link>
                  <button className="text-sm bg-neutral-800 px-3 py-1 rounded hover:bg-neutral-700 transition-colors">
                    <UserPlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchTerm && !loading && users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No users found for "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}