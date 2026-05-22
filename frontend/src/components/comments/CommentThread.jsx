// comments/CommentThread.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CommentForm from './CommentForm';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();

  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getInitials = (name) => {
  if (!name) return '?';

  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
};

const avatarColors = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-pink-500',
];

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];

  const index = name.charCodeAt(0) % avatarColors.length;

  return avatarColors[index];
};

const CommentItem = ({ comment }) => {
  // Backend only provides createdBy
  const authorName =
    comment?.authorName ||
    comment?.author?.name ||
    comment?.createdBy ||
    'Unknown User';

  const initials = getInitials(authorName);
  const avatarColor = getAvatarColor(authorName);

  const timestamp = comment?.createdAt;

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}
      >
        {initials}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 group-hover:bg-white/8 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-sm font-semibold text-white">
              {authorName}
            </span>

            <span className="text-xs text-slate-500 shrink-0">
              {formatRelativeTime(timestamp)}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
            {comment?.content || ''}
          </p>
        </div>
      </div>
    </div>
  );
};

const CommentSkeleton = () => (
  <div className="flex gap-3 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />

    <div className="flex-1 space-y-2">
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-3 mb-2">
          <div className="h-3 bg-white/10 rounded w-24" />
          <div className="h-3 bg-white/10 rounded w-12 ml-auto" />
        </div>

        <div className="h-3 bg-white/10 rounded w-full mb-1.5" />
        <div className="h-3 bg-white/10 rounded w-3/4" />
      </div>
    </div>
  </div>
);

const CommentThread = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('idToken');

      const response = await axios.get(
        `${API_BASE_URL}/api/comments/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Backend returns array directly
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);

      setError(
        err.response?.data?.error ||
          'Failed to load comments.'
      );
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentAdded = (newComment) => {
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
    } else {
      fetchComments();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>

          Comments

          {!loading && (
            <span className="text-xs font-normal text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </h3>

        {!loading && (
          <button
            onClick={fetchComments}
            className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            Refresh
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm flex items-center gap-3">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          {error}

          <button
            onClick={fetchComments}
            className="ml-auto underline text-red-300 hover:text-red-200 transition text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Comment List */}
      {!loading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && comments.length === 0 && (
        <div className="text-center py-8 backdrop-blur-sm bg-white/3 border border-white/5 rounded-2xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          <p className="text-sm font-medium text-slate-400">
            No comments yet
          </p>

          <p className="text-xs text-slate-600 mt-1">
            Be the first to comment on this task.
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Form */}
      <CommentForm
        taskId={taskId}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default CommentThread;