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
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
        
        {/* Header Section */}
        <div className="border-b border-slate-700/50 px-6 pt-8 pb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-100 mb-2">Manager Dashboard</h1>
              <p className="text-slate-400">
                Welcome back, <span className="text-slate-300 font-semibold">{user.name || 'Manager'}</span>
              </p>
            </div>
            <span className="text-slate-400 text-sm bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Filter Section - Full Width */}
        <div className="border-b border-slate-700/50 px-6 py-6">
          <p className="text-slate-400 text-sm font-semibold mb-4">Filter by Team</p>
          <TeamFilter selectedTeam={selectedTeam} onTeamChange={setSelectedTeam} />
        </div>

        {/* Content Section */}
        <div className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-400 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading teams...</p>
            </div>
          ) : selectedTeam === 'all' ? (
            <>
              <div className="mb-6">
                <p className="text-slate-300 font-semibold">All Teams Overview</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.keys(getTasksByTeam()).length === 0 ? (
                  <div className="col-span-full flex items-center justify-center py-20">
                    <div className="text-center">
                      <p className="text-slate-400 text-lg">📭 No teams with tasks yet</p>
                      <p className="text-slate-500 text-sm mt-1">Create a task to get started</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(getTasksByTeam()).map(([teamId, teamTasks]) => (
                    <div
                      key={teamId}
                      className="group backdrop-blur-md bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 shadow-lg rounded-xl p-6 transition-all duration-300 hover:shadow-indigo-500/20 hover:shadow-2xl hover:bg-slate-800/60"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-100">
                            {teamId.charAt(0).toUpperCase() + teamId.slice(1)}
                          </h2>
                          <p className="text-xs text-slate-500">Team Overview</p>
                        </div>
                          <span className="bg-indigo-900/50 text-indigo-200 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-700/50">
                            {teamTasks.length} tasks
                          </span>
                        </div>
                        <div className="border-t border-slate-700/30 pt-6 mt-4">
                          <TeamStats tasks={teamTasks} />
                        </div>
                      </div>
                    ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-slate-300 font-semibold">
                  {selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)} Team Details
                </p>
              </div>
              <div className="max-w-3xl">
                <div className="backdrop-blur-md bg-slate-800/40 border border-slate-700/50 shadow-lg rounded-xl p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-slate-100">
                      {selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)} Team
                    </h2>
                    <p className="text-slate-400 text-sm mt-2">{tasks.length} total tasks</p>
                  </div>
                  <div className="border-t border-slate-700/30 pt-8">
                    <TeamStats tasks={tasks} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ManagerDashboard;