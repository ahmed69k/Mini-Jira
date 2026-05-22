import { useState, useEffect } from 'react';
import api from '../../services/api';

const inputClass =
  'w-full px-3 py-2 rounded-md bg-slate-700/30 border border-slate-600/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';

const TaskForm = ({ onSuccess, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    title:       initialData?.title       || '',
    description: initialData?.description || '',
    priority:    initialData?.priority    || 'MEDIUM',
    deadline:    initialData?.deadline    || '',
    assigneeId:  initialData?.assigneeId  || '',
    teamId:      initialData?.teamId      || 'frontend',
    projectId:   initialData?.projectId   || 'project-1',
  });
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch {
      try {
        const alt = await api.get('/');
        setUsers(alt.data);
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-100">
        {initialData ? 'Edit Task' : 'Create New Task'}
      </h2>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-400/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Title *</label>
          <input name="title" type="text" value={formData.title} onChange={handleChange} required placeholder="Enter task title" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Description *</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required placeholder="Enter task description" rows={4} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Priority *</label>
            <select name="priority" value={formData.priority} onChange={handleChange} required className={inputClass}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Deadline *</label>
            <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} required className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Team *</label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={(e) => { handleChange(e); setFormData((p) => ({ ...p, assigneeId: '' })); }}
              required
              className={inputClass}
            >
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="qa">QA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Project *</label>
            <input name="projectId" type="text" value={formData.projectId} onChange={handleChange} required placeholder="e.g., project-1" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Assign To *</label>
          {loadingUsers ? (
            <div className={`${inputClass} text-slate-500`}>Loading users…</div>
          ) : (
            <select name="assigneeId" value={formData.assigneeId} onChange={handleChange} required className={inputClass}>
              <option value="">Select a user</option>
              {users
                .filter((u) => u.teamId === formData.teamId)
                .map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} ({u.email}) — {u.role}
                  </option>
                ))}
            </select>
          )}
          <p className="text-xs text-slate-500 mt-1">Only showing users from the selected team</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-200 text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {loading ? 'Saving…' : initialData ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </div>
  );
};

export default TaskForm;