import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../services/api';
import TeamStats from './TeamStats';

const ManagerDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [newTeamName, setNewTeamName] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTeams();
  }, []);

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

      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams');
      setTeams(res.data);
    } catch (err) {
      toast.error('Failed to load teams');
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return toast.error('Team name required');

    try {
      await api.post('/api/teams', { name: newTeamName });
      setNewTeamName('');
      fetchTeams();
      toast.success('Team created');
    } catch {
      toast.error('Failed to create team');
    }
  };

  const updateTeam = async (team) => {
    const name = prompt('New team name:', team.name);
    if (!name) return;

    try {
      await api.put(`/api/teams/${team.id || team.teamId}`, { name });
      fetchTeams();
      toast.success('Team updated');
    } catch {
      toast.error('Failed to update team');
    }
  };

  const deleteTeam = async (teamId) => {
    if (!confirm('Delete this team?')) return;

    try {
      await api.delete(`/api/teams/${teamId}`);
      fetchTeams();
      toast.success('Team deleted');
    } catch {
      toast.error('Failed to delete team');
    }
  };

  const getTasksByTeam = () => {
    const grouped = {};
    tasks.forEach((t) => {
      const key = t.teamId || 'unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
    return grouped;
  };

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* HEADER */}
          <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-slate-100">
              Manager Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Welcome back, {user.name || 'Manager'}
            </p>
          </div>

          {/* TEAM MANAGEMENT */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-slate-200 font-semibold mb-4">
              Team Management
            </h2>

            <div className="flex gap-3 mb-6">
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="New team name..."
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100"
              />

              <button
                onClick={createTeam}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Create
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {teams.map((team) => (
                <div
                  key={team.id || team.teamId}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-700"
                >
                  <span className="text-slate-200">{team.name}</span>

                  <button
                    onClick={() => updateTeam(team)}
                    className="text-xs text-indigo-300"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteTeam(team.id || team.teamId)}
                    className="text-xs text-red-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FILTER */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-slate-200 font-semibold mb-4">
              Filter
            </h2>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedTeam('all')}
                className={`px-4 py-2 rounded-lg ${
                  selectedTeam === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/40 text-slate-300'
                }`}
              >
                All Teams
              </button>

              {teams.map((team) => (
                <button
                  key={team.id || team.teamId}
                  onClick={() =>
                    setSelectedTeam(team.id || team.teamId)
                  }
                  className={`px-4 py-2 rounded-lg ${
                    selectedTeam === (team.id || team.teamId)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/40 text-slate-300'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="text-slate-400">Loading...</div>
            ) : selectedTeam === 'all' ? (
              Object.entries(getTasksByTeam()).map(([id, t]) => (
                <div
                  key={id}
                  className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6"
                >
                  <h3 className="text-slate-100 font-semibold mb-2">
                    {id}
                  </h3>
                  <TeamStats tasks={t} />
                </div>
              ))
            ) : (
              <div className="col-span-full bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6">
                <TeamStats tasks={tasks} />
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default ManagerDashboard;