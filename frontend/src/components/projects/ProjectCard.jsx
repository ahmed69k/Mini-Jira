import { useEffect, useState } from 'react';

export default function ProjectCard({ project, onEdit, onDelete }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  return (
    <div className="group backdrop-blur-md bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 shadow-lg rounded-xl p-5 transition-all duration-200">
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            {project.title}
          </h3>

          {/* 👇 team.name instead of teamId */}
          <p className="text-xs text-slate-400">
            Team: {project.teamName || project.teamId}
          </p>
        </div>

        {/* 👇 only managers see actions */}
        {isManager && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-2 rounded-xl text-sm font-semibold border-2 border-indigo-500/50 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20 transition"
            >
              Edit
            </button>

            <button
              onClick={onDelete}
              className="px-3 py-2 rounded-xl text-sm font-semibold border-2 border-rose-500/50 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-slate-300 mb-4">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Created: {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <span className="opacity-80">
          ID: {project.projectId}
        </span>
      </div>
    </div>
  );
}