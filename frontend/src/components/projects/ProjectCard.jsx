// projects/ProjectCard.jsx
import { useState } from 'react';

const statusConfig = {
  active: {
    label: 'Active',
    classes:
      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  completed: {
    label: 'Completed',
    classes:
      'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  on_hold: {
    label: 'On Hold',
    classes:
      'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-400',
  },
  cancelled: {
    label: 'Cancelled',
    classes:
      'bg-red-500/20 text-red-300 border border-red-500/30',
    dot: 'bg-red-400',
  },
  planning: {
    label: 'Planning',
    classes:
      'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    dot: 'bg-sky-400',
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';

  const date = new Date(dateStr);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const [confirmDelete, setConfirmDelete] =
    useState(false);

  // Backend does NOT currently store status
  // so fallback to planning
  const status =
    statusConfig[project?.status] ||
    statusConfig['planning'];

  const taskCount =
    project?.taskCount ??
    project?.tasks?.length ??
    0;

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(project);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <div className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
            {/* FIXED: backend returns title */}
            {project?.title || 'Untitled Project'}
          </h3>

          {project?.teamName && (
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>

              {project.teamName}
            </p>
          )}
        </div>

        {/* Status */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${status.classes}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
          />

          {status.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 flex-1">
        {project?.description ||
          'No description provided.'}
      </p>

      {/* Meta Row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        {/* Tasks */}
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>

          <span className="text-slate-300 font-medium">
            {taskCount}
          </span>

          task{taskCount !== 1 ? 's' : ''}
        </span>

        {/* Date */}
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          {formatDate(project?.createdAt)}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View */}
        <button
          onClick={() => onViewDetails(project)}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-white bg-indigo-600/80 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
        >
          View Details
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(project)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Edit project"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors text-xs font-medium px-2.5"
              title="Confirm delete"
            >
              Confirm
            </button>

            <button
              onClick={handleCancelDelete}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium px-2.5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeleteClick}
            className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="Delete project"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;