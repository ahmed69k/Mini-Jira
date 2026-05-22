
import './TeamStats.css';

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const STATUS_COLORS = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#f59e0b',
  DONE: '#10b981',
};

const PRIORITY_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const TeamStats = ({ tasks, teamId }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="team-stats-empty">
        <p>No tasks found{teamId !== 'all' ? ` for this team` : ''}.</p>
      </div>
    );
  }

  // Count by status
  const statusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  tasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
  });

  // Count by priority
  const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  tasks.forEach((t) => {
    if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
  });

  // Overdue tasks (deadline < today and not done)
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(
    (t) => t.deadline && t.deadline < today && t.status !== 'DONE'
  ).length;

  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((statusCounts.DONE / total) * 100) : 0;

  return (
    <div className="team-stats">
      {/* Summary cards */}
      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-number">{total}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-number" style={{ color: '#10b981' }}>{completionRate}%</span>
          <span className="stat-label">Completion</span>
        </div>
        <div className="stat-card">
          <span className="stat-number" style={{ color: overdue > 0 ? '#ef4444' : '#10b981' }}>
            {overdue}
          </span>
          <span className="stat-label">Overdue</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="stats-section">
        <h3 className="stats-section-title">By Status</h3>
        <div className="stats-bars">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="stat-bar-row">
              <span className="stat-bar-label">{STATUS_LABELS[status]}</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: total > 0 ? `${(count / total) * 100}%` : '0%',
                    backgroundColor: STATUS_COLORS[status],
                  }}
                />
              </div>
              <span className="stat-bar-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="stats-section">
        <h3 className="stats-section-title">By Priority</h3>
        <div className="stats-pills">
          {Object.entries(priorityCounts).map(([priority, count]) => (
            <div
              key={priority}
              className="priority-pill"
              style={{ borderColor: PRIORITY_COLORS[priority], color: PRIORITY_COLORS[priority] }}
            >
              <span className="priority-pill-label">{priority}</span>
              <span className="priority-pill-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamStats;
