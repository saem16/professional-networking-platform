import { useState } from 'react';

const CommentThread = ({ comments, onReply, onDelete }) => {
  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentNode
          key={comment._id}
          comment={comment}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

const CommentNode = ({ comment, onReply, onDelete }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyMode, setReplyMode] = useState(false);

  return (
    <div className="pl-4 border-l-2 border-neutral-700">

      <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors">

        <img
          src={comment.user.profilePicture}
          alt={comment.user.name}
          className="w-10 h-10 rounded-full object-cover border border-neutral-700"
        />


        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">{comment.user.name}</p>
            <span className="text-xs text-neutral-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-neutral-200 mt-1">{comment.text}</p>


          <div className="flex gap-4 text-xs text-neutral-400 mt-2">
            <button
              onClick={() => setReplyMode(!replyMode)}
              className="hover:text-white transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => onDelete(comment._id)}
              className="hover:text-white transition-colors"
            >
              Delete
            </button>
            {comment.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="hover:text-white transition-colors"
              >
                {showReplies ? 'Hide' : 'View'} {comment.replies.length} Replies
              </button>
            )}
          </div>


          {replyMode && (
            <div className="mt-3 flex gap-2">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 px-3 py-1 bg-black text-white rounded-lg border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-white placeholder-neutral-500"
                placeholder="Write a reply..."
              />
              <button
                className="bg-white text-black px-3 py-1 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
                onClick={() => {
                  if (replyText.trim()) {
                    onReply(replyText, comment._id);
                    setReplyText('');
                    setReplyMode(false);
                  }
                }}
              >
                Send
              </button>
            </div>
          )}


          {showReplies && comment.replies?.length > 0 && (
            <div className="mt-4">
              <CommentThread
                comments={comment.replies}
                onReply={onReply}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentThread;
