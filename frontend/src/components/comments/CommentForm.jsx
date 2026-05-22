import { useState } from 'react';
import { commentsAPI } from '../../services/api';

export default function CommentForm({ taskId, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);

      const newComment = await commentsAPI.create({
        taskId,
        content: content.trim(),
      });

      onCommentAdded(newComment);
      setContent('');
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-3"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-200">
          Add Comment
        </p>

        {error && (
          <span className="text-xs text-rose-400">{error}</span>
        )}
      </div>

      {/* TEXTAREA */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment..."
        rows={3}
        disabled={loading}
        className="w-full px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50
                   text-slate-100 placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40
                   transition resize-none"
      />

      {/* ACTIONS */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-500
                     text-white text-sm font-semibold transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
}