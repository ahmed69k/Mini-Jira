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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-rose-400">{error}</div>}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows="3"
        disabled={loading}
        className="w-full px-3 py-2 rounded-md bg-slate-700/30 border border-slate-600/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
}
