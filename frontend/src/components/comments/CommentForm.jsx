// comments/CommentForm.jsx
import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const MAX_CHARS = 1000;

const CommentForm = ({ taskId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isEmpty = content.trim().length === 0;

  const handleChange = (e) => {
    setContent(e.target.value);

    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEmpty || isOverLimit || !taskId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('idToken');

      const response = await axios.post(
        `${API_BASE_URL}/api/comments`,
        {
          taskId,
          content: content.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setContent('');

      // Backend returns the created comment directly
      if (onCommentAdded) {
        onCommentAdded(response.data);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);

      setError(
        err.response?.data?.error ||
          'Failed to post comment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
      <h4 className="text-sm font-semibold text-slate-300 mb-3">
        Add a Comment
      </h4>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="Write a comment..."
            rows={3}
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg text-sm text-white placeholder-slate-500 bg-white/10 border resize-none focus:outline-none focus:ring-2 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isOverLimit
                ? 'border-red-500/50 focus:ring-red-500 bg-red-500/5'
                : 'border-white/20 focus:ring-indigo-500'
            }`}
          />

          <span
            className={`absolute bottom-3 right-3 text-xs ${
              isOverLimit
                ? 'text-red-400 font-semibold'
                : charsLeft < 100
                ? 'text-amber-400'
                : 'text-slate-500'
            }`}
          >
            {charsLeft}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || isEmpty || isOverLimit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>

                Posting...
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>

                Post Comment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;