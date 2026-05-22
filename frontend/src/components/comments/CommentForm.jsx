// frontend/src/components/comments/CommentForm.jsx
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { addComment } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const CommentForm = ({ taskId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const { user } = useAuth();
  
  const MAX_CHARS = 500;
  
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARS) {
      setContent(newContent);
      setCharacterCount(newContent.length);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await addComment(taskId, content.trim());
      const newComment = response.data || response;
      
      // Clear form
      setContent('');
      setCharacterCount(0);
      
      // Notify parent
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
      
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment... (Press Ctrl+Enter to submit)"
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            disabled={isSubmitting}
          />
          
          {/* Character counter */}
          <div className="absolute bottom-2 right-3 text-xs text-slate-400">
            {characterCount}/{MAX_CHARS}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Comment
              </>
            )}
          </button>
        </div>
        
        {/* Keyboard shortcut hint */}
        <p className="text-xs text-slate-400 text-right">
          Tip: Press <kbd className="px-1 py-0.5 bg-white/10 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/10 rounded">Enter</kbd> to submit
        </p>
      </form>
    </div>
  );
};

export default CommentForm;