import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../services/api';
import TeamFilter from './TeamFilter';
import TeamStats from './TeamStats';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTasks();
  }, [selectedTeam]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = '/api/tasks';
      if (selectedTeam !== 'all') {
        url += `?teamId=${selectedTeam}`;
      }
      const response = await api.get(url);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getTasksByTeam = () => {
    const grouped = {};
    tasks.forEach((task) => {
      const tid = task.teamId || 'unassigned';
      if (!grouped[tid]) grouped[tid] = [];
      grouped[tid].push(task);
    });
    return grouped;
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="dashboard-container">

        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Manager Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, {user.name || 'Manager'}
            </p>
          </div>
          <span className="dashboard-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <TeamFilter selectedTeam={selectedTeam} onTeamChange={setSelectedTeam} />

        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            <p>Loading dashboard...</p>
          </div>
        ) : selectedTeam === 'all' ? (
          <div className="dashboard-grid">
            {Object.keys(getTasksByTeam()).length === 0 ? (
              <div className="dashboard-empty">
                <p>No tasks found across any team.</p>
              </div>
            ) : (
              Object.entries(getTasksByTeam()).map(([teamId, teamTasks]) => (
                <div key={teamId} className="dashboard-card">
                  <div className="dashboard-card-header">
                    <h2 className="dashboard-card-title">
                      {teamId.charAt(0).toUpperCase() + teamId.slice(1)} Team
                    </h2>
                    <span className="dashboard-card-count">
                      {teamTasks.length} tasks
                    </span>
                  </div>
                  <TeamStats tasks={teamTasks} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="dashboard-single">
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">
                  {selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)} Team
                </h2>
                <span className="dashboard-card-count">{tasks.length} tasks</span>
              </div>
              <TeamStats tasks={tasks} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManagerDashboard;