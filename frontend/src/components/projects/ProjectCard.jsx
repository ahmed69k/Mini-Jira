import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Users, CheckSquare, FolderKanban } from "lucide-react";

/**
 * ProjectCard
 *
 * Displays a single project in the grid. Clicking the card navigates to
 * /projects/:projectId. Edit/delete buttons are shown only for managers.
 *
 * Expected project shape:
 * {
 *   projectId: string,
 *   name: string,
 *   description?: string,
 *   teamId: string,
 *   teamName?: string,          // optional, enriched by parent if available
 *   taskCount?: number,         // total tasks (may be undefined)
 *   completedTaskCount?: number,
 *   createdAt: string,
 * }
 */
export default function ProjectCard({ project, isManager, onEdit, onDelete }) {
  const navigate = useNavigate();

  const total = project.taskCount ?? 0;
  const completed = project.completedTaskCount ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Progress bar colour
  const progressColor =
    progress === 100
      ? "bg-emerald-500"
      : progress >= 60
      ? "bg-sky-500"
      : progress >= 30
      ? "bg-amber-500"
      : "bg-slate-400";

  return (
    <article
      className="project-card group relative flex flex-col backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => navigate(`/projects/${project.projectId}`)}
      role="button"
      tabIndex={0}
      aria-label={`Open project: ${project.name}`}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/projects/${project.projectId}`)}
    >
      {/* Coloured top accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderKanban
              size={18}
              className="shrink-0 text-indigo-400"
            />
            <h3 className="font-semibold text-white text-base leading-snug line-clamp-1">
              {project.name}
            </h3>
          </div>

          {/* Manager action buttons — stop propagation so card click doesn't fire */}
          {isManager && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-400 hover:bg-white/10 transition-colors"
                aria-label="Edit project"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-white/10 transition-colors"
                aria-label="Delete project"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {project.description ? (
          <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">
            No description
          </p>
        )}

        {/* Team badge */}
        {(project.teamName || project.teamId) && (
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-slate-300" />
            <span className="text-xs font-medium text-slate-200 bg-white/20 px-2 py-0.5 rounded-full">
              {project.teamName || project.teamId}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-xs text-slate-300">
              <CheckSquare size={12} />
              <span>
                {completed}/{total} tasks
              </span>
            </div>
            <span
              className={`text-xs font-semibold ${
                progress === 100 ? "text-emerald-400" : "text-slate-300"
              }`}
            >
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Footer */}
        {createdDate && (
          <p className="text-xs text-slate-400 mt-1">
            Created {createdDate}
          </p>
        )}
      </div>
    </article>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    teamId: PropTypes.string,
    teamName: PropTypes.string,
    taskCount: PropTypes.number,
    completedTaskCount: PropTypes.number,
    createdAt: PropTypes.string,
  }).isRequired,
  isManager: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};