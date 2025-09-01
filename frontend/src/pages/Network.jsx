import { useEffect, useState } from 'react';
import axios from 'axios';
import Discover from './Discover';
import PostModal from '../components/PostModal';
import { getSession } from '../utils/Session';

export default function Network() {
  const [networkPosts, setNetworkPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
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
    }
  };

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