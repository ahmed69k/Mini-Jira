import { useState, useEffect } from 'react';
import { projectsAPI } from '../../services/api';
import api from '../../services/api';

const inputClass =
  'w-full px-3 py-2 rounded-md bg-slate-700/30 border border-slate-600/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function ProjectForm({
  onSuccess,
  onCancel,
  initialData,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: '',
  });

  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] =
    useState(true);

  const [error, setError] = useState(null);

  // ---------------- LOAD INITIAL DATA ----------------
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description:
          initialData.description || '',
        teamId: initialData.teamId || '',
      });
    }
  }, [initialData]);

  // ---------------- FETCH TEAMS ----------------
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true);

      const res = await api.get(
        '/api/teams'
      );

      setTeams(res.data);
    } catch (e) {
      console.error(
        'Error fetching teams:',
        e
      );
    } finally {
      setLoadingTeams(false);
    }
  };

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);

    if (
      !formData.title.trim() ||
      !formData.teamId.trim()
    ) {
      setError(
        'Title and Team are required'
      );

      return;
    }

    try {
      setLoading(true);

      if (initialData) {
        const updated =
          await projectsAPI.update(
            initialData.projectId,
            formData
          );

        onSuccess(updated);
      } else {
        const created =
          await projectsAPI.create(
            formData
          );

        onSuccess(created);
      }
    } catch (err) {
      setError(
        err.message ||
          'Failed to save project'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl p-6"
    >
      {/* HEADER */}
      <h2 className="text-lg font-semibold text-slate-100 mb-4">
        {initialData
          ? 'Edit Project'
          : 'Create New Project'}
      </h2>

      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-400/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* TITLE */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm text-slate-300 mb-1"
          >
            Title *
          </label>

          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Project title"
            required
            className={inputClass}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm text-slate-300 mb-1"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Project description"
            rows="4"
            className={inputClass}
          />
        </div>

        {/* TEAM */}
        <div>
          <label
            htmlFor="teamId"
            className="block text-sm text-slate-300 mb-1"
          >
            Team *
          </label>

          {loadingTeams ? (
            <div
              className={`${inputClass} text-slate-500`}
            >
              Loading teams...
            </div>
          ) : (
            <select
              id="teamId"
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {/* PLACEHOLDER */}
              <option value="">
                Select a team
              </option>

              {teams.map((team) => (
                <option
                  key={
                    team.id ||
                    team.teamId
                  }
                  value={team.name}
                >
                  {team.name}
                </option>
              ))}
            </select>
          )}

          <p className="text-xs text-slate-500 mt-1">
            Projects are assigned using
            the team name
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {loading
              ? 'Saving...'
              : initialData
              ? 'Update'
              : 'Create'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}