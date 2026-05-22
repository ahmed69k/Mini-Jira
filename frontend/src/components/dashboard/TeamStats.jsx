
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
      <div className="py-10 px-5 text-center text-slate-400 text-sm">
        <p>No tasks assigned to this team yet</p>
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
        <div className="backdrop-blur-md bg-slate-700/20 border border-slate-700/50 rounded-lg p-5 flex flex-col gap-2 transition-all hover:bg-slate-700/30 hover:border-slate-600/50 hover:shadow-lg">
          <span className="text-4xl font-bold text-slate-100">{total}</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
        </div>
        <div className="backdrop-blur-md bg-slate-700/20 border border-slate-700/50 rounded-lg p-5 flex flex-col gap-2 transition-all hover:bg-slate-700/30 hover:border-slate-600/50 hover:shadow-lg">
          <span className="text-4xl font-bold text-teal-400">{completionRate}%</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
        </div>
        <div className="backdrop-blur-md bg-slate-700/20 border border-slate-700/50 rounded-lg p-5 flex flex-col gap-2 transition-all hover:bg-slate-700/30 hover:border-slate-600/50 hover:shadow-lg">
          <span className={`text-4xl font-bold ${overdue > 0 ? 'text-rose-400' : 'text-teal-400'}`}>
            {overdue}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Status Distribution</h3>
        <div className="flex flex-col gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-20 flex-shrink-0 font-medium">{STATUS_LABELS[status]}</span>
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-700/30">
                <div
                  className="h-full rounded-full transition-all duration-400"
                  style={{
                    width: total > 0 ? `${(count / total) * 100}%` : '0%',
                    backgroundColor: STATUS_COLORS[status],
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-400 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Priority Breakdown</h3>
        <div className="flex gap-3">
          {Object.entries(priorityCounts).map(([priority, count]) => (
            <div
              key={priority}
              className="flex-1 px-4 py-3 rounded-lg border-2 text-center transition-all hover:shadow-lg"
              style={{ borderColor: PRIORITY_COLORS[priority] + '60', backgroundColor: PRIORITY_COLORS[priority] + '10'}}
            >
              <p className="text-xs uppercase font-semibold text-slate-400">{priority}</p>
              <p className="text-2xl font-bold" style={{ color: PRIORITY_COLORS[priority]}}>{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamStats;
