// projects/ProjectForm.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ProjectForm = ({ initialData = null, onSuccess, onCancel }) => {
  const isEditMode = Boolean(initialData?.projectId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: '',
    status: 'planning',
  });

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        teamId: initialData.teamId || '',
        status: initialData.status || 'planning',
      });
    }
  }, [initialData]);


  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Project title is required.';
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }

    if (formData.description.length > 500) {
      errors.description =
        'Description must be under 500 characters.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('idToken');

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Match backend EXACTLY
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        teamId: formData.status,
      };

      if (isEditMode) {
        await axios.put(
          `${API_BASE_URL}/api/projects/${initialData.projectId}`,
          payload,
          { headers }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/projects`,
          payload,
          { headers }
        );
      }

      onSuccess();
    } catch (err) {
      console.error('Project form error:', err);

      setError(
        err.response?.data?.error ||
          `Failed to ${
            isEditMode ? 'update' : 'create'
          } project. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm';

  const errorInputClass =
    'w-full px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm';

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          {isEditMode ? 'Edit Project' : 'Create Project'}
        </h2>

        <p className="text-slate-400 text-sm mt-1">
          {isEditMode
            ? 'Update your project details below.'
            : 'Fill in the details to create a new project.'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Project Title */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Project Title{' '}
            <span className="text-red-400">*</span>
          </label>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Website Redesign"
            className={
              fieldErrors.title
                ? errorInputClass
                : inputClass
            }
          />

          {fieldErrors.title && (
            <p className="mt-1 text-xs text-red-400">
              {fieldErrors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Description
            <span className="ml-2 text-slate-500 font-normal">
              ({formData.description.length}/500)
            </span>
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the project goals and scope..."
            rows={3}
            className={`${
              fieldErrors.description
                ? errorInputClass
                : inputClass
            } resize-none`}
          />

          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-400">
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-lg font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {loading
              ? isEditMode
                ? 'Saving...'
                : 'Creating...'
              : isEditMode
              ? 'Save Changes'
              : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;