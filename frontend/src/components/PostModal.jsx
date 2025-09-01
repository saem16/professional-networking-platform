import { useState, useEffect, useRef } from 'react';
import CommentThread from './CommentThread';
import axios from 'axios';
import { getSession } from '../utils/Session';
import { showToast } from '../utils/toast';

export default function PostModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage] = useState(5);
  const modalRef = useRef(null);
  const token = getSession('token');
  const currentUser = getSession('user');
  console.log('PostModal rendered with post:', post);

  useEffect(() => {
    setComments(post.comments || []);
    setLikes(post.likes || []);
    setIsLiked(post.likes?.includes(currentUser?.id || currentUser?._id) || false);

    // Prevent background scroll and focus modal
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [post]);

  const addComment = async (text, parentId = null) => {
    if (!text.trim()) return;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/posts/${post._id}/comments`,
        {
          text,
          parentCommentId: parentId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComments(res.data.comments);
    } catch (error) {
      showToast.error('Failed to add comment. Please try again.');
    }
  };

  const deleteComment = async id => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/posts/${post._id}/comments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComments(prev => prev.filter(c => c._id !== id));
    } catch (error) {
      showToast.error('Failed to delete comment. Please try again.');
    }
  };

  const toggleLike = async () => {
    try {
      console.log('Toggling like for post:', post._id);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/posts/${post._id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Like response:', res.data);
      setLikes(res.data.likes);
      setIsLiked(res.data.isLiked);
    } catch (error) {
      showToast.error('Failed to update like');
    }
  };

  // Format the published date
  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination logic
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center backdrop-blur-sm p-0 sm:p-2 md:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 rounded-none sm:rounded-xl w-full max-w-7xl mx-0 sm:mx-2 md:mx-4 my-0 sm:my-4 md:my-8 overflow-hidden flex flex-col lg:flex-row shadow-2xl border-0 sm:border border-neutral-800 min-h-screen sm:min-h-0 sm:max-h-[90vh]">


        <div className="flex lg:hidden justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <img
              src={post.user.profilePicture || '/default-avatar.png'}
              alt={post.user.name}
              className="w-10 h-10 rounded-full object-cover border border-neutral-700"
              onError={e => {
                e.target.src = '/default-avatar.png';
              }}
            />
            <div>
              <p className="font-semibold text-white text-sm">{post.user.name}</p>
              <p className="text-xs text-neutral-400">
                @{post.user.username} • {formatDate(post.publishedAt || post.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800"
          >
            ×
          </button>
        </div>


        <div className="flex-1 lg:max-w-[65%] border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col">


          <div className="hidden lg:flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={post.user.profilePicture || '/default-avatar.png'}
                alt={post.user.name}
                className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                onError={e => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div>
                <p className="font-semibold text-white text-base">{post.user.name}</p>
                <p className="text-sm text-neutral-400">
                  @{post.user.username} • {formatDate(post.publishedAt || post.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800"
            >
              ×
            </button>
          </div>


          <div className="flex-1 overflow-y-auto scrollbar-hidden">

            <div className="p-4 sm:p-6">

              {post.title && (
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-white leading-tight">
                  {post.title}
                </h2>
              )}


              <div className="mb-6 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={toggleLike}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-neutral-400 hover:text-white hover:scale-105 cursor-pointer active:scale-95"
                  >
                    <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
                    <span className="text-white text-sm sm:text-base">{likes.length}</span>
                  </button>
                </div>


                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                  <span>
                    {likes.length} like{likes.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </span>
                  {post.publishedAt && (
                    <span>Published {formatDate(post.publishedAt)}</span>
                  )}
                  {post.isDraft && (
                    <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">
                      Draft
                    </span>
                  )}
                </div>
              </div>


              <div className="prose prose-invert max-w-none">
                {post.content ? (
                  <div
                    className="text-neutral-200 leading-relaxed text-sm sm:text-base"
                    dangerouslySetInnerHTML={{
                      __html: post.content,
                    }}
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  />
                ) : (
                  <p className="text-neutral-400 italic text-sm sm:text-base">
                    No content available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>


        <div className="w-full lg:w-[35%] flex flex-col bg-neutral-900 min-h-[50vh] lg:min-h-0">


          <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex-shrink-0 sticky top-0 lg:static z-10">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Comments ({comments.length})
            </h3>
          </div>


          <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex-shrink-0 sticky top-[60px] lg:static z-10">
            <div className="flex gap-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 bg-black text-white rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-neutral-500 transition-all resize-none min-h-[40px] max-h-[120px] text-sm sm:text-base"
                placeholder="Write a comment..."
                rows="1"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (commentText.trim()) {
                      addComment(commentText);
                      setCommentText('');
                    }
                  }
                }}
                onInput={e => {
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed self-end text-sm sm:text-base"
                disabled={!commentText.trim()}
                onClick={() => {
                  if (commentText.trim()) {
                    addComment(commentText);
                    setCommentText('');
                  }
                }}
              >
                Post
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Press Enter to post, Shift+Enter for new line
            </p>
          </div>


          <div className="flex-1 overflow-y-auto scrollbar-hidden bg-neutral-900 pb-4 sm:pb-0">
            <div className="p-4">
              {comments.length > 0 ? (
                <div className="space-y-4">
                  <CommentThread
                    comments={currentComments}
                    onReply={addComment}
                    onDelete={deleteComment}
                  />
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-neutral-800">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-neutral-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Previous
                      </button>
                      <span className="text-neutral-400 text-sm">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-neutral-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-neutral-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-neutral-500 font-medium text-base">
                    No comments yet
                  </p>
                  <p className="text-neutral-600 text-sm mt-1">
                    Be the first to share your thoughts
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Hide scrollbars but keep scrolling functionality */
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
          
          /* Ensure proper touch scrolling on iOS */
          .scrollbar-hidden {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Style the HTML content properly */
          .prose img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0;
            display: block;
          }
          
          .prose p {
            margin-bottom: 16px;
            line-height: 1.7;
          }
          
          .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
            color: #ffffff;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 16px;
          }
          
          .prose ul, .prose ol {
            margin: 16px 0;
            padding-left: 24px;
          }
          
          .prose li {
            margin-bottom: 8px;
          }
          
          .prose a {
            color: #60a5fa;
            text-decoration: underline;
          }
          
          .prose a:hover {
            color: #93c5fd;
          }
          
          .prose strong {
            font-weight: 600;
            color: #ffffff;
          }
          
          .prose em {
            font-style: italic;
          }
          
          .prose blockquote {
            border-left: 4px solid #374151;
            padding-left: 16px;
            margin: 24px 0;
            font-style: italic;
            color: #d1d5db;
          }
          
          .prose pre {
            background-color: #111827;
            color: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 16px 0;
          }
          
          .prose code {
            background-color: #374151;
            color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.875em;
          }

          /* Mobile specific adjustments */
          @media (max-width: 1024px) {
            /* Ensure full height on mobile */
            .modal-container {
              min-height: 100vh;
            }
          }
        `,
        }}
      />
    </div>
  );
}