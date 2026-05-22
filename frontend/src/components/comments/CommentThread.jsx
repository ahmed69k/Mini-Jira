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
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    setComments([...comments, newComment]);
  };

  if (loading)
    return (
      <div className="py-4">
        <p className="text-slate-400">Loading comments...</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-100">Comments</h3>

      {error && <div className="text-rose-400">{error}</div>}

      <CommentForm taskId={taskId} onCommentAdded={handleCommentAdded} />

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-slate-400">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.commentId} className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/40 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <strong className="text-slate-100">{comment.createdBy}</strong>
                <small className="text-xs text-slate-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
              </div>
              <p className="text-slate-200 text-sm">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
