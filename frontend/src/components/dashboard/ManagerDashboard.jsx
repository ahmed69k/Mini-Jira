import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../services/api';
import TeamFilter from './TeamFilter';
import TeamStats from './TeamStats';

const ManagerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');

  const [newTeamName, setNewTeamName] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch teams once
  useEffect(() => {
    fetchTeams();
  }, []);

  // Fetch tasks when filter changes
  useEffect(() => {
    fetchTasks();
  }, [selectedTeam]);

  // ---------------- TASKS ----------------
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
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- TEAMS ----------------
  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams');
      setTeams(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load teams');
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      return toast.error('Team name required');
    }

    try {
      await api.post('/api/teams', { name: newTeamName });
      toast.success('Team created');
      setNewTeamName('');
      fetchTeams();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create team');
    }
  };

  const updateTeam = async (team) => {
    const newName = prompt('Enter new team name:', team.name);
    if (!newName) return;

    try {
      await api.put(`/api/teams/${team.id || team.teamId}`, {
        name: newName,
      });

      toast.success('Team updated');
      fetchTeams();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update team');
    }
  };

  const deleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team?')) return;

    try {
      await api.delete(`/api/teams/${teamId}`);
      toast.success('Team deleted');
      fetchTeams();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete team');
    }
  };

  // ---------------- TASK GROUPING ----------------
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

        {/* HEADER */}
        <div className="border-b border-slate-700/50 px-6 pt-8 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-100">
                Manager Dashboard
              </h1>
              <p className="text-slate-400">
                Welcome back,{' '}
                <span className="text-slate-300 font-semibold">
                  {user.name || 'Manager'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ---------------- TEAM CRUD ---------------- */}
        <div className="border-b border-slate-700/50 px-6 py-6">
          <p className="text-slate-300 font-semibold text-sm mb-4">
            Team Management
          </p>

          {/* Create Team */}
          <div className="flex gap-3 mb-6">
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter new team name..."
              className="flex-1 px-4 py-2 rounded-lg bg-slate-800/60 text-slate-100
                         border border-slate-700/50 focus:outline-none
                         focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            />

            <button
              onClick={createTeam}
              className="px-5 py-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-500
                         text-white font-medium transition-all duration-200
                         shadow-md hover:shadow-indigo-500/20"
            >
              Create
            </button>
          </div>

          {/* Team Pills */}
          <div className="flex flex-wrap gap-3">
            {teams.map((team) => (
              <div
                key={team.id || team.teamId}
                className="group flex items-center gap-3 px-4 py-2 rounded-xl
                           bg-slate-800/40 border border-slate-700/50
                           hover:border-indigo-500/30 hover:bg-slate-800/60
                           transition-all duration-200"
              >
                <span className="text-slate-200 font-medium">
                  {team.name}
                </span>

                <button
                  onClick={() => updateTeam(team)}
                  className="text-xs text-indigo-300 hover:text-indigo-200 transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteTeam(team.id || team.teamId)}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FILTER */}
        <div className="border-b border-slate-700/50 px-6 py-6">
          <p className="text-slate-400 text-sm font-semibold mb-4">
            Filter by Team
          </p>

          <div className="flex flex-wrap gap-3">
            {/* ALL */}
            <button
              onClick={() => setSelectedTeam('all')}
              className={`px-4 py-2 rounded-lg border transition
                ${
                  selectedTeam === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800/40 text-slate-300 border-slate-700 hover:border-indigo-500/40'
                }`}
            >
              All Teams
            </button>

            {/* Dynamic Teams */}
            {teams.map((team) => (
              <button
                key={team.id || team.teamId}
                onClick={() => setSelectedTeam(team.id || team.teamId)}
                className={`px-4 py-2 rounded-lg border transition
                  ${
                    selectedTeam === (team.id || team.teamId)
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800/40 text-slate-300 border-slate-700 hover:border-indigo-500/40'
                  }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading...
            </div>
          ) : selectedTeam === 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(getTasksByTeam()).map(([teamId, teamTasks]) => (
                <div
                  key={teamId}
                  className="bg-slate-800/40 p-6 rounded-xl border border-slate-700"
                >
                  <h2 className="text-slate-100 font-semibold">
                    {teamId}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {teamTasks.length} tasks
                  </p>
                  <TeamStats tasks={teamTasks} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/40 p-8 rounded-xl border border-slate-700">
              <TeamStats tasks={tasks} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ManagerDashboard;