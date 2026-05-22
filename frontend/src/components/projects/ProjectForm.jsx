import { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';

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
    <form onSubmit={handleSubmit} className="backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-3">{initialData ? 'Edit Project' : 'Create New Project'}</h2>

      {error && <div className="mb-3 text-rose-400">{error}</div>}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm text-slate-300 mb-1">Title *</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Project title"
            required
            className="w-full px-3 py-2 rounded-md bg-slate-700/30 border border-slate-600/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm text-slate-300 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Project description"
            rows="4"
            className="w-full px-3 py-2 rounded-md bg-slate-700/30 border border-slate-600/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="teamId" className="block text-sm text-slate-300 mb-1">Team ID *</label>
          <input
            id="teamId"
            type="text"
            name="teamId"
            value={formData.teamId}
            onChange={handleChange}
            placeholder="e.g., backend"
            required
            className="w-full px-3 py-2 rounded-md bg-slate-700/30 border border-slate-600/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500">
            {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
