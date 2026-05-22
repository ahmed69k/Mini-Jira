import { useState, useEffect } from 'react';
import api from '../../services/api';

const inputClass =
  'w-full px-3 py-2 rounded-md bg-slate-700/30 border border-slate-600/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';

const TaskForm = ({
  onSuccess,
  onCancel,
  initialData = null,
  teams = [],
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'MEDIUM',
    deadline: initialData?.deadline || '',
    assigneeId: initialData?.assigneeId || '',
    teamId: initialData?.teamId || '',
    projectId: initialData?.projectId || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // ---------------- FETCH USERS ----------------
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ---------------- FETCH PROJECTS ----------------
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await api.get('/api/projects');
      setProjects(res.data || []);
    } catch (e) {
      console.error('Error fetching projects:', e);
    } finally {
      setLoadingProjects(false);
    }
  };

  // ---------------- FILTER USERS BY TEAM ----------------
  useEffect(() => {
    if (!formData.teamId) {
      setFilteredUsers([]);
      return;
    }

    const teamUsers = users.filter(
      (u) => String(u.teamId) === String(formData.teamId)
    );

    setFilteredUsers(teamUsers);
  }, [formData.teamId, users]);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeamChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      teamId: value,
      assigneeId: '',
    }));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      if (initialData) {
        await api.put(`/api/tasks/${initialData.taskId}`, formData);
      } else {
        await api.post('/api/tasks', formData);
      }

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <h2 className="text-lg font-semibold text-slate-100">
        {initialData ? 'Edit Task' : 'Create New Task'}
      </h2>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-400/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="space-y-4">

        {/* TITLE */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Title *</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={inputClass}
            rows={4}
            required
          />
        </div>

        {/* PRIORITY + DEADLINE */}
        <div className="grid grid-cols-2 gap-4">
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* TEAM */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Team *</label>

          <select
            name="teamId"
            value={formData.teamId}
            onChange={handleTeamChange}
            className={inputClass}
            required
          >
            <option value="">Select a team</option>

            {teams.map((team) => (
              <option key={team.id || team.teamId} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* PROJECT (NEW DROPDOWN) */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Project *</label>

          {loadingProjects ? (
            <div className={inputClass}>Loading projects...</div>
          ) : (
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">Select a project</option>

              {projects.map((p) => (
                <option key={p.projectId} value={p.title}>
                  {p.title} ({p.teamName || p.teamId})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ASSIGNEE */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Assign To *</label>

          {loadingUsers ? (
            <div className={inputClass}>Loading users...</div>
          ) : (
            <select
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              className={inputClass}
              disabled={!formData.teamId}
              required
            >
              <option value="">
                {!formData.teamId
                  ? 'Select a team first'
                  : filteredUsers.length === 0
                  ? 'No users in this team'
                  : 'Select a user'}
              </option>

              {filteredUsers.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          )}
        </div>

      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-3 border-t border-slate-700/50">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-700 text-white rounded">
          Cancel
        </button>

        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;