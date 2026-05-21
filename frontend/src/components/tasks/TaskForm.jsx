import { useState, useEffect } from 'react';
import api from '../../services/api';
import './TaskForm.css';

const TaskForm = ({ onSuccess, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'MEDIUM',
    deadline: initialData?.deadline || '',
    assigneeId: initialData?.assigneeId || '',
    teamId: initialData?.teamId || 'frontend',
    projectId: initialData?.projectId || 'project-1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialData) {
        // Update existing task
        await api.put(`/api/tasks/${initialData.taskId}`, formData);
      } else {
        // Create new task
        await api.post('/api/tasks', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
      console.error('Error saving task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2 className="form-title">
        {initialData ? 'Edit Task' : 'Create New Task'}
      </h2>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="form-input"
          placeholder="Enter task title"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="form-textarea"
          placeholder="Enter task description"
          rows="4"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priority" className="form-label">
            Priority *
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="deadline" className="form-label">
            Deadline *
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="teamId" className="form-label">
            Team *
          </label>
          <select
            id="teamId"
            name="teamId"
            value={formData.teamId}
            onChange={(e) => {
              handleChange(e);
              // Reset assigneeId when team changes
              setFormData((prev) => ({ ...prev, assigneeId: '' }));
            }}
            required
            className="form-select"
          >
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="qa">QA</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="projectId" className="form-label">
            Project *
          </label>
          <input
            type="text"
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="e.g., project-1"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="assigneeId" className="form-label">
          Assign To *
        </label>
        {loadingUsers ? (
          <div className="form-input" style={{ color: '#9ca3af' }}>
            Loading users...
          </div>
        ) : (
          <select
            id="assigneeId"
            name="assigneeId"
            value={formData.assigneeId}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Select a user</option>
            {users
              .filter((user) => user.teamId === formData.teamId)
              .map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
          </select>
        )}
        <p className="form-hint">
          Only showing users from the selected team
        </p>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
