// frontend/src/components/comments/CommentThread.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  Trash2, 
  User, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import CommentForm from './CommentForm';
import { getComments, deleteComment } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Skeleton loader for comments
const CommentSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex space-x-3 mb-4">
      <div className="w-10 h-10 bg-white/10 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-1/4"></div>
        <div className="h-3 bg-white/10 rounded w-3/4"></div>
        <div className="h-3 bg-white/10 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// Individual comment component
const CommentItem = ({ comment, currentUser, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullDate, setShowFullDate] = useState(false);
  
  const canDelete = currentUser?.role === 'manager' || 
                    currentUser?.sub === comment.authorId;
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getRandomColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    return colors[Math.abs(hash) % colors.length];
  };
  
  const avatarColor = getRandomColor(comment.authorName || comment.authorId);
  
  return (
    <div className="group p-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl hover:shadow-xl transition-all">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.authorAvatar ? (
            <img 
              src={comment.authorAvatar} 
              alt={comment.authorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium`}>
              {getInitials(comment.authorName)}
            </div>
          )}
        </div>
        
        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {comment.authorName || 'Unknown User'}
              </span>
              <span className="text-xs text-slate-300">
                {comment.authorRole && `(${comment.authorRole})`}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Timestamp with hover tooltip */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowFullDate(true)}
                  onMouseLeave={() => setShowFullDate(false)}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                >
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </button>
                {showFullDate && (
                  <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                    {format(new Date(comment.createdAt), 'PPPpp')}
                  </div>
                )}
              </div>
              
              {/* Delete button */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-400 disabled:opacity-50"
                  aria-label="Delete comment"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-red-500 rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          <p className="mt-2 text-slate-200 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          
          {/* Edited indicator */}
          {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
            <p className="mt-1 text-xs text-slate-400">
              edited {formatDistanceToNow(new Date(comment.updatedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main CommentThread component
const CommentThread = ({ taskId, refreshTrigger = 0 }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const { user } = useAuth();
  
  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getComments(taskId);
      setComments(response.data || response || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load comments');
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);
  
  useEffect(() => {
    fetchComments();
  }, [fetchComments, refreshTrigger]);
  
  const handleCommentAdded = (newComment) => {
    setComments(prev => [newComment, ...prev]);
    toast.success('Comment added successfully');
  };
  
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete comment');
    }
  };
  
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  if (!taskId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-300">No task selected</p>
      </div>
    );
  }
  
  return (
    <div className="comment-thread backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/20">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">
            Comments
          </h3>
          {!loading && comments.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-white/20 text-slate-200 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        
        {/* Sort button */}
        {comments.length > 1 && (
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
          >
            {sortOrder === 'asc' ? (
              <>
                <ChevronDown className="w-4 h-4" />
                Oldest first
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4" />
                Newest first
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Comment Form */}
      <div className="mb-6">
        <CommentForm 
          taskId={taskId} 
          onCommentAdded={handleCommentAdded}
        />
      </div>
      
      {/* Comments List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          // Loading skeletons
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : error ? (
          // Error state
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchComments}
              className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-lg"
            >
              Try Again
            </button>
          </div>
        ) : sortedComments.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-300">No comments yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Be the first to leave a comment
            </p>
          </div>
        ) : (
          // Comments list
          sortedComments.map((comment, index) => (
            <CommentItem
              key={comment.id || index}
              comment={comment}
              currentUser={user}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </div>
      
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default CommentThread;