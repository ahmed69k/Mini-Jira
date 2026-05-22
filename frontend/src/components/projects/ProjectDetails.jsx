// projects/ProjectDetails.jsx
import React from 'react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';

  return new Date(dateStr).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
};

const ProjectDetails = ({
  project,
  onClose,
}) => {
  if (!project) return null;

  return (
    <div className="backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-2xl p-8 w-full max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">
            {project.title}
          </h2>

          <p className="text-slate-400 mt-2">
            Project Details
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          ✕
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Team */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-slate-400 text-sm mb-1">
            Team
          </p>

          <p className="text-white font-medium">
            {project.teamName || 'No Team'}
          </p>
        </div>

        {/* Created */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-slate-400 text-sm mb-1">
            Created
          </p>

          <p className="text-white font-medium">
            {formatDate(project.createdAt)}
          </p>
        </div>

        {/* Project ID */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:col-span-2">
          <p className="text-slate-400 text-sm mb-1">
            Project ID
          </p>

          <p className="text-white font-mono text-sm break-all">
            {project.projectId}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          Description
        </h3>

        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {project.description ||
            'No description provided.'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ProjectDetails;