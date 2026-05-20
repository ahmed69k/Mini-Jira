import { useState, useEffect } from 'react';
import { commentsAPI } from '../../services/api';
import CommentForm from './CommentForm';
import './CommentThread.css';

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

  if (loading) return <div className="comment-thread"><p>Loading comments...</p></div>;

  return (
    <div className="comment-thread">
      <h3>Comments</h3>

      {error && <div className="error-message">{error}</div>}

      <CommentForm taskId={taskId} onCommentAdded={handleCommentAdded} />

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="empty-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.commentId} className="comment-item">
              <div className="comment-header">
                <strong>{comment.createdBy}</strong>
                <small className="comment-date">
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
              </div>
              <p className="comment-content">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
