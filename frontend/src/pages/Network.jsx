import { useEffect, useState } from 'react';
import axios from 'axios';
import Discover from './Discover';
import PostModal from '../components/PostModal';
import { getSession } from '../utils/Session';

export default function Network() {
  const [networkPosts, setNetworkPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getSession('user');

  useEffect(() => {
    fetchNetworkPosts();
  }, []);

  const fetchNetworkPosts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/posts/network`,
        {
          headers: {
            Authorization: `Bearer ${getSession('token')}`,
          },
        }
      );
      setNetworkPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch network posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (networkPosts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-2">No posts available</h2>
          <p className="text-gray-400">Follow some users to see their posts in your network.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Discover
        posts={networkPosts}
        setSelectedPost={setSelectedPost}
      />

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}