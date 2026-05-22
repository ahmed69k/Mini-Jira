import { useState } from 'react';
import api from '../../services/api';
import ImageUpload from '../uploads/ImageUpload';
import CommentThread from '../comments/CommentThread';

const STATUS_STYLES = {
  TODO:        'bg-slate-500/20  text-slate-200  border border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/20   text-blue-200   border border-blue-500/30',
  IN_REVIEW:   'bg-amber-500/20  text-amber-200  border border-amber-500/30',
  DONE:        'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
};

const PRIORITY_STYLES = {
  HIGH:   'bg-rose-500/20   text-rose-200   border border-rose-500/30',
  MEDIUM: 'bg-amber-500/20  text-amber-200  border border-amber-500/30',
  LOW:    'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
};

const formatDate   = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const formatStatus = (s) => s.replace('_', ' ');

const DetailItem = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
    <p className="text-sm text-slate-200">{children}</p>
  </div>
);

const TaskDetail = ({ task, onUpdate, onClose }) => {
  const [isDeleting, setIsDeleting]         = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(task.imageUrl);
  const [currentImageKey, setCurrentImageKey] = useState(task.imageKey);

  const isManager = JSON.parse(localStorage.getItem('user') || '{}').role === 'manager';

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/tasks/${task.taskId}`);
      onUpdate();
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUpdate = (url, key) => {
    setCurrentImageUrl(url);
    setCurrentImageKey(key);
    onUpdate?.();
  };

  const handleImageDelete = () => {
    setCurrentImageUrl(null);
    setCurrentImageKey(null);
    onUpdate?.();
  };

  return (
    <div className="space-y-6">
      {/* Title + badges */}
      <div className="flex flex-col gap-3 pr-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
            {formatStatus(task.status)}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
          <span className="text-xs text-slate-500 ml-auto">#{task.taskId.slice(0, 8)}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{task.title}</h1>
      </div>

      {/* Description */}
      <div className="backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Description</p>
        <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <DetailItem label="Deadline">
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8"  y1="2" x2="8"  y2="6" />
              <line x1="3"  y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(task.deadline)}
          </span>
        </DetailItem>
        <DetailItem label="Team">{task.teamId}</DetailItem>
        <DetailItem label="Project">{task.projectId}</DetailItem>
        <DetailItem label="Assignee">{task.assigneeName || task.assigneeId}</DetailItem>
      </div>

      {/* Activity history */}
      {task.auditLogs?.length > 0 && (
        <div className="backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Activity History</p>
          {task.auditLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-300">
                  Status changed from{' '}
                  <span className="font-semibold text-slate-100">{formatStatus(log.oldStatus)}</span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-100">{formatStatus(log.newStatus)}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(log.changedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-3">
        <span>Created: {formatDate(task.createdAt)}</span>
        <span>Updated: {formatDate(task.updatedAt)}</span>
      </div>

      {/* Image upload */}
      <ImageUpload
        taskId={task.taskId}
        imageUrl={currentImageUrl}
        imageKey={currentImageKey}
        onImageUpdate={handleImageUpdate}
        onImageDelete={handleImageDelete}
      />

      {/* Comments */}
      <div className="backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <CommentThread taskId={task.taskId} />
      </div>

      {/* Manager actions */}
      {isManager && (
        <div className="flex items-center justify-end gap-3 border-t border-slate-700/50 pt-4">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-rose-500/50 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 transition disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete Task'}
          </button>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-indigo-500/50 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20 transition">
            Edit Task
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;