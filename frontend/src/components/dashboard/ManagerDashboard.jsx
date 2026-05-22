import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../services/api';
import TeamFilter from './TeamFilter';
import TeamStats from './TeamStats';

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
      <div className="p-6 min-h-[calc(100vh-80px)] flex flex-col">

        <div className="flex justify-between items-start mb-6 md:flex-col md:gap-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Manager Dashboard</h1>
            <p className="text-sm text-gray-500">
              Welcome back, {user.name || 'Manager'}
            </p>
          </div>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="mb-6">
          <TeamFilter selectedTeam={selectedTeam} onTeamChange={setSelectedTeam} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading dashboard...</p>
          </div>
        ) : selectedTeam === 'all' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(getTasksByTeam()).length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-16 text-gray-400 text-sm">
                <p>No tasks found across any team.</p>
              </div>
            ) : (
              Object.entries(getTasksByTeam()).map(([teamId, teamTasks]) => (
                <div key={teamId} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-base font-semibold text-gray-900">
                      {teamId.charAt(0).toUpperCase() + teamId.slice(1)} Team
                    </h2>
                    <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                      {teamTasks.length} tasks
                    </span>
                  </div>
                  <TeamStats tasks={teamTasks} />
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-semibold text-gray-900">
                  {selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)} Team
                </h2>
                <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                  {tasks.length} tasks
                </span>
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