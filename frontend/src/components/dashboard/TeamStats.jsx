
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
      <div className="py-10 px-5 text-center text-gray-400 text-sm">
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
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-1 transition-shadow hover:shadow-md">
          <span className="text-3xl font-bold text-gray-900">{total}</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tasks</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-1 transition-shadow hover:shadow-md">
          <span className="text-3xl font-bold text-emerald-500">{completionRate}%</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completion</span>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-1 transition-shadow hover:shadow-md">
          <span className={`text-3xl font-bold ${overdue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {overdue}
          </span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overdue</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-900">By Status</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs text-gray-700 w-20 flex-shrink-0">{STATUS_LABELS[status]}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-400"
                  style={{
                    width: total > 0 ? `${(count / total) * 100}%` : '0%',
                    backgroundColor: STATUS_COLORS[status],
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-900">By Priority</h3>
        <div className="flex gap-3">
          {Object.entries(priorityCounts).map(([priority, count]) => (
            <div
              key={priority}
              className="px-3 py-2 rounded-lg border-2 text-sm font-medium"
              style={{ borderColor: PRIORITY_COLORS[priority], color: PRIORITY_COLORS[priority] }}
            >
              <span className="block text-xs uppercase">{priority}</span>
              <span className="block text-lg font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamStats;
