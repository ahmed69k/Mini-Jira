import { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Fetch projects on mount
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
    setProjects(projects.map(p => p.projectId === updatedProject.projectId ? updatedProject : p));
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

  if (loading) return <div className="projects-page"><p>Loading projects...</p></div>;

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Projects</h1>
        <button className="btn-primary" onClick={() => {
          setEditingProject(null);
          setShowForm(!showForm);
        }}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <ProjectForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowForm(false)}
          initialData={editingProject}
        />
      )}

      {editingProject && !showForm && (
        <ProjectForm
          onSuccess={handleUpdateSuccess}
          onCancel={() => setEditingProject(null)}
          initialData={editingProject}
        />
      )}

      <div className="projects-grid">
        {projects.length === 0 ? (
          <p className="empty-state">No projects yet. Create one to get started!</p>
        ) : (
          projects.map(project => (
            <ProjectCard
              key={project.projectId}
              project={project}
              onEdit={() => setEditingProject(project)}
              onDelete={() => handleDelete(project.projectId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
