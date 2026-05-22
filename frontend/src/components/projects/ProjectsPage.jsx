import { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getAll();
      setProjects(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newProject) => {
    setProjects([...projects, newProject]);
    setShowForm(false);
    setEditingProject(null);
  };

  const handleUpdateSuccess = (updatedProject) => {
    setProjects(
      projects.map((p) =>
        p.projectId === updatedProject.projectId
          ? updatedProject
          : p
      )
    );
    setEditingProject(null);
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.delete(projectId);
      setProjects(projects.filter(p => p.projectId !== projectId));
    } catch (err) {
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  if (loading)
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
        <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900/60 border border-slate-700/60 shadow-2xl p-8">
          <p className="text-slate-400">Loading projects...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-100">Projects</h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Create and manage projects across teams, keep work aligned, and track ownership from a single dashboard.
              </p>
            </div>

            {/* ONLY MANAGERS CAN SEE THIS */}
            {isManager && (
              <button
                className="w-full max-w-[180px] rounded-2xl bg-indigo-600/80 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
                onClick={() => {
                  setEditingProject(null);
                  setShowForm(!showForm);
                }}
              >
                {showForm ? 'Cancel' : '+ New Project'}
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-700/50 p-5">
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">Total Projects</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">{projects.length}</p>
            </div>

            <div className="rounded-3xl bg-slate-900/70 border border-slate-700/50 p-5">
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">Managed By</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">Managers</p>
            </div>

            <div className="rounded-3xl bg-slate-900/70 border border-slate-700/50 p-5">
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">Team Visibility</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">Company-wide</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl bg-rose-500/10 border border-rose-400/20 p-4 text-rose-100">
            {error}
          </div>
        )}

        {/* CREATE FORM ONLY FOR MANAGERS */}
        {isManager && showForm && (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-700/50 p-6 shadow-2xl">
            <ProjectForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowForm(false)}
              initialData={editingProject}
            />
          </div>
        )}

        {isManager && editingProject && !showForm && (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-700/50 p-6 shadow-2xl">
            <ProjectForm
              onSuccess={handleUpdateSuccess}
              onCancel={() => setEditingProject(null)}
              initialData={editingProject}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {projects.length === 0 ? (
            <div className="col-span-full rounded-3xl bg-slate-900/60 border border-slate-700/50 p-10 text-center text-slate-400 shadow-2xl">
              <p className="text-lg">No projects yet.</p>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onEdit={isManager ? () => setEditingProject(project) : undefined}
                onDelete={isManager ? () => handleDelete(project.projectId) : undefined}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}