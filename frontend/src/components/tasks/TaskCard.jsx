const PRIORITY_STYLES = {
  HIGH:   'bg-rose-500/20   text-rose-200   border border-rose-500/30',
  MEDIUM: 'bg-amber-500/20  text-amber-200  border border-amber-500/30',
  LOW:    'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const TaskCard = ({ task, onClick, showTeam = false, isDraggable = true }) => (
  <div
    onClick={onClick}
    className={`group backdrop-blur-md bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 shadow-lg rounded-xl p-4 transition-all duration-200 hover:shadow-indigo-500/10 hover:shadow-xl hover:bg-slate-800/60 cursor-pointer ${
      !isDraggable ? 'opacity-75' : ''
    }`}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex items-center gap-1.5 min-w-0">
        {!isDraggable && (
          <span title="Cannot move other team's tasks" className="text-xs shrink-0">🔒</span>
        )}
        <h3 className="text-sm font-semibold text-slate-100 truncate">{task.title}</h3>
      </div>
      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority] || 'bg-slate-700 text-slate-300'}`}>
        {task.priority}
      </span>
    </div>

    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>

    {showTeam && (
      <div className="mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-200 border border-indigo-700/50">
          {task.teamId}
        </span>
      </div>
    )}

    <div className="flex items-center justify-between text-xs text-slate-500">
      <div className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8"  y1="2" x2="8"  y2="6" />
          <line x1="3"  y1="10" x2="21" y2="10" />
        </svg>
        <span>{formatDate(task.deadline)}</span>
      </div>
      {task.imageUrl && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )}
    </div>
  </div>
);

export default TaskCard;