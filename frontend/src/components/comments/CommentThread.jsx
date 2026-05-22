import { useState, useEffect } from 'react';
import { commentsAPI } from '../../services/api';
import CommentForm from './CommentForm';

export default function CommentThread({ taskId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await commentsAPI.getByTaskId(taskId);
      setComments(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    setComments((prev) => [...prev, newComment]);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-900/40 border border-slate-700/40 p-6">
        <p className="text-slate-400 text-sm">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          Comments
        </h3>

        <span className="text-xs text-slate-400 bg-slate-800/50 border border-slate-700/40 px-2 py-1 rounded-full">
          {comments.length}
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* COMMENT INPUT (PROMINENT) */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4 shadow-lg">
        <CommentForm
          taskId={taskId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* THREAD */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-700/50 p-8 text-center">
            <p className="text-slate-400 text-sm">
              No comments yet
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Be the first to start the discussion
            </p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div
              key={comment.commentId}
              className="group rounded-2xl bg-slate-900/40 border border-slate-700/40 p-4 hover:border-indigo-500/30 transition"
            >
              {/* TOP ROW */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* avatar fallback */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {comment.createdBy?.charAt(0)?.toUpperCase() || 'U'}
                  </div>

                  <div>
                    <p className="text-slate-100 text-sm font-semibold">
                      {comment.createdBy}
                    </p>
                    <p className="text-xs text-slate-500">
                      #{index + 1}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-400 opacity-70">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>

              {/* CONTENT */}
              <p className="text-slate-200 text-sm leading-relaxed pl-10">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}