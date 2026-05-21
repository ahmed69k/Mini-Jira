import { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';
import './ProjectForm.css';

export default function ProjectForm({ onSuccess, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        teamId: initialData.teamId,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.teamId.trim()) {
      setError('Title and Team ID are required');
      return;
    }

    try {
      setLoading(true);
      if (initialData) {
        // Update existing project
        const updated = await projectsAPI.update(initialData.projectId, formData);
        onSuccess(updated);
      } else {
        // Create new project
        const created = await projectsAPI.create(formData);
        onSuccess(created);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h2>{initialData ? 'Edit Project' : 'Create New Project'}</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Project title"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Project description"
          rows="4"
        />
      </div>

      <div className="form-group">
        <label htmlFor="teamId">Team ID *</label>
        <input
          id="teamId"
          type="text"
          name="teamId"
          value={formData.teamId}
          onChange={handleChange}
          placeholder="e.g., backend"
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
