import { useState } from 'react';
import api from '../../services/api';
import ImageUpload from '../uploads/ImageUpload';
import './TaskDetail.css';

const TaskDetail = ({ task, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(task.imageUrl);
  const [currentImageKey, setCurrentImageKey] = useState(task.imageKey);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '#ef4444';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO':
        return '#94a3b8';
      case 'IN_PROGRESS':
        return '#3b82f6';
      case 'IN_REVIEW':
        return '#f59e0b';
      case 'DONE':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

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

  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
  const isManager = userRole === 'manager';

  const handleImageUpdate = (newImageUrl, newImageKey) => {
    setCurrentImageUrl(newImageUrl);
    setCurrentImageKey(newImageKey);
    // Refresh task data
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleImageDelete = () => {
    setCurrentImageUrl(null);
    setCurrentImageKey(null);
    // Refresh task data
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="task-detail">
      <div className="task-detail-header">
        <div>
          <h1 className="task-detail-title">{task.title}</h1>
          <div className="task-meta">
            <span className="task-id">#{task.taskId.slice(0, 8)}</span>
          </div>
        </div>
        <div className="task-badges">
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(task.status) }}
          >
            {formatStatus(task.status)}
          </span>
          <span
            className="priority-badge"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </span>
        </div>
      </div>

      <div className="task-detail-content">
        <section className="detail-section">
          <h3 className="section-title">Description</h3>
          <p className="task-description-full">{task.description}</p>
        </section>

        <div className="detail-grid">
          <div className="detail-item">
            <label className="detail-label">Deadline</label>
            <div className="detail-value">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(task.deadline)}
            </div>
          </div>

          <div className="detail-item">
            <label className="detail-label">Team</label>
            <div className="detail-value">{task.teamId}</div>
          </div>

          <div className="detail-item">
            <label className="detail-label">Project</label>
            <div className="detail-value">{task.projectId}</div>
          </div>

          <div className="detail-item">
            <label className="detail-label">Assignee</label>
            <div className="detail-value">{task.assigneeName || task.assigneeId}</div>
          </div>
        </div>

        {task.auditLogs && task.auditLogs.length > 0 && (
          <section className="detail-section">
            <h3 className="section-title">Activity History</h3>
            <div className="audit-logs">
              {task.auditLogs.map((log, index) => (
                <div key={index} className="audit-log-item">
                  <div className="audit-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <div className="audit-content">
                    <p className="audit-text">
                      Status changed from{' '}
                      <strong>{formatStatus(log.oldStatus)}</strong> to{' '}
                      <strong>{formatStatus(log.newStatus)}</strong>
                    </p>
                    <p className="audit-time">{formatDate(log.changedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="task-timestamps">
          <span>Created: {formatDate(task.createdAt)}</span>
          <span>Updated: {formatDate(task.updatedAt)}</span>
        </div>

        {/* Image Upload Component */}
        <ImageUpload
          taskId={task.taskId}
          imageUrl={currentImageUrl}
          imageKey={currentImageKey}
          onImageUpdate={handleImageUpdate}
          onImageDelete={handleImageDelete}
        />
      </div>

      {isManager && (
        <div className="task-detail-actions">
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            Edit Task
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
