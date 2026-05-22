// projects/ProjectsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SkeletonCard = () => (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 animate-pulse">
    <div className="flex justify-between">
      <div className="h-5 bg-white/10 rounded-lg w-2/3" />
      <div className="h-5 bg-white/10 rounded-full w-16" />
    </div>

    <div className="h-4 bg-white/10 rounded-lg w-full" />
    <div className="h-4 bg-white/10 rounded-lg w-3/4" />

    <div className="flex gap-3">
      <div className="h-3 bg-white/10 rounded w-16" />
      <div className="h-3 bg-white/10 rounded w-24" />
    </div>

    <div className="border-t border-white/10" />

    <div className="flex gap-2">
      <div className="flex-1 h-9 bg-white/10 rounded-lg" />
      <div className="w-9 h-9 bg-white/10 rounded-lg" />
      <div className="w-9 h-9 bg-white/10 rounded-lg" />
    </div>
  </div>
);

const Modal = ({ show, onClose, children }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="w-full max-w-lg animate-fade-in">
        {children}
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({
  project,
  onConfirm,
  onCancel,
  loading,
}) => (
  <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 w-full max-w-md mx-auto">
    <div className="text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-red-400"
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
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        Delete Project
      </h3>

      <p className="text-slate-400 text-sm mb-1">
        Are you sure you want to delete
      </p>

      <p className="text-white font-semibold mb-4">
        "{project?.title}"
      </p>

      <p className="text-slate-500 text-xs mb-7">
        This action cannot be undone.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-500 transition disabled:opacity-60 shadow-lg"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [editingProject, setEditingProject] =
    useState(null);

  const [deletingProject, setDeletingProject] =
    useState(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token =
        localStorage.getItem('idToken');

      const response = await axios.get(
        `${API_BASE_URL}/api/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.projects || [];

      setProjects(data);
    } catch (err) {
      console.error(
        'Failed to fetch projects:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Failed to load projects.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async () => {
    if (!deletingProject) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const token =
        localStorage.getItem('idToken');

      const projectId =
        deletingProject.projectId;

      await axios.delete(
        `${API_BASE_URL}/api/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjects((prev) =>
        prev.filter(
          (p) => p.projectId !== projectId
        )
      );

      setDeletingProject(null);
    } catch (err) {
      console.error(
        'Delete project error:',
        err
      );

      setDeleteError(
        err.response?.data?.error ||
          'Failed to delete project.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setEditingProject(null);
    fetchProjects();
  };

  const filteredProjects = projects.filter(
    (project) => {
      return (
        !searchQuery ||
        project.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        project.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Projects
            </h1>

            <p className="text-slate-400 mt-1 text-sm">
              {loading
                ? 'Loading...'
                : `${projects.length} project${
                    projects.length !== 1
                      ? 's'
                      : ''
                  } total`}
            </p>
          </div>

          <button
            onClick={() =>
              setShowCreateModal(true)
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/30 shrink-0"
          >
            New Project
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map(
              (_, i) => (
                <SkeletonCard key={i} />
              )
            )}
          </div>
        )}

        {/* Projects */}
        {!loading &&
          filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map(
                (project) => (
                  <ProjectCard
                    key={project.projectId}
                    project={project}
                  />
                )
              )}
            </div>
          )}

        {/* Empty */}
        {!loading &&
          filteredProjects.length === 0 && (
            <div className="text-center py-24 text-slate-400">
              No projects found.
            </div>
          )}
      </div>

      {/* Create */}
      <Modal
        show={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
      >
        <ProjectForm
          onSuccess={handleFormSuccess}
          onCancel={() =>
            setShowCreateModal(false)
          }
        />
      </Modal>

      {/* Edit */}
      <Modal
        show={Boolean(editingProject)}
        onClose={() =>
          setEditingProject(null)
        }
      >
        <ProjectForm
          initialData={editingProject}
          onSuccess={handleFormSuccess}
          onCancel={() =>
            setEditingProject(null)
          }
        />
      </Modal>

      {/* Delete */}
      <Modal
        show={Boolean(deletingProject)}
        onClose={() => {
          setDeletingProject(null);
          setDeleteError(null);
        }}
      >
        <DeleteConfirmModal
          project={deletingProject}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeletingProject(null);
            setDeleteError(null);
          }}
          loading={deleteLoading}
        />

        {deleteError && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm text-center">
            {deleteError}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectsPage;