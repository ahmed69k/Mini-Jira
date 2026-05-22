import './TaskCard.css';

const TaskCard = ({ task, onClick, showTeam = false, isDraggable = true }) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`task-card ${!isDraggable ? 'not-draggable' : ''}`}
      onClick={onClick}
    >
      {!isDraggable && (
        <div className="not-draggable-indicator" title="Cannot move other team's tasks">
          🔒
        </div>
      )}
      <div className="task-card-header">
        <h3 className="task-title">{task.title}</h3>
        <span
          className="priority-badge"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        >
          {task.priority}
        </span>
      </div>

      <p className="task-description">{task.description}</p>

      {showTeam && (
        <div className="task-team">
          <span className="team-badge">{task.teamId}</span>
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-deadline">
          <svg
            width="14"
            height="14"
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
          <span>{formatDate(task.deadline)}</span>
        </div>

        {task.imageUrl && (
          <div className="task-has-image">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
