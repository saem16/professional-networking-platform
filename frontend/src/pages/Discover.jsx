import { useEffect, useState } from 'react';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import PostModal from '../components/PostModal';
import { getSession } from '../utils/Session';

export default function Discover() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
        setPosts(response.data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };
    fetchPosts();
  }, []);

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    768: 2,
    640: 1,
  };


  const stripHtml = html => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };


  const seededRandom = seedStr => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }

    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return (h >>> 0) / 4294967295;
  };


  const getExcerpt = (p, minLen = 80, maxLen = 220) => {
    let text = '';
    const content = p.content;
    if (!content) return '';

    if (typeof content === 'string') {
      text = stripHtml(content);
    } else if (content.blocks && Array.isArray(content.blocks)) {
      text = content.blocks
        .map(b => (b.data?.text ? stripHtml(b.data.text) : ''))
        .join(' ');
      text = text.trim();
    } else {

      try {
        text = stripHtml(String(content));
      } catch {
        text = '';
      }
    }

    if (!text) return '';

    const seed = String(p._id || p.id || Math.random());
    const r = seededRandom(seed);
    const len = Math.max(minLen, Math.floor(minLen + r * (maxLen - minLen)));
    if (text.length <= len) return text;

    const cut = text.lastIndexOf(' ', len);
    const end = cut > Math.floor(len * 0.6) ? cut : len;
    return text.slice(0, end).trim() + '...';
  };

  return (
    <main className="flex-1 ml-1 md:ml-2 lg:ml-2 mr-2 md:mr-4 lg:mr-8 p-2 md:p-3 lg:p-6">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-2 md:gap-3 lg:gap-6"
        columnClassName="space-y-2 md:space-y-3 lg:space-y-6"
      >
        {posts.map((p, i) => {
          const excerpt = getExcerpt(p);
          const hasImage = !!p.banner;

          return (
            <div
              key={p._id || p.id || i}
              onClick={() => setSelectedPost(p)}
              className="bg-neutral-900 hover:bg-neutral-800 transition rounded-lg overflow-hidden cursor-pointer shadow-lg"
            >

              {hasImage && (
                <img
                  src={p.banner}
                  alt={p.user?.name || 'banner'}
                  className="w-full object-cover"
                  style={{ maxHeight: '350px' }}
                />
              )}


              <div className="p-2 md:p-3 lg:p-4">
                <div className="flex items-center gap-2 md:gap-2 lg:gap-3 mb-2 md:mb-2 lg:mb-3">
                  <img
                    src={p.user?.profilePicture}
                    alt={p.user?.name}
                    className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-xs md:text-sm lg:text-base">{p.user?.name}</p>
                    <p className="text-xs md:text-xs text-neutral-400">
                      {p.user?.headline}
                    </p>
                  </div>
                </div>

                {excerpt ? (
                  <p className="text-xs md:text-xs lg:text-sm text-neutral-300 whitespace-pre-line">
                    {excerpt}
                  </p>
                ) : (
                  <p className="text-xs md:text-xs lg:text-sm text-neutral-500">
                    No preview available
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </Masonry>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </main>
  );
}
