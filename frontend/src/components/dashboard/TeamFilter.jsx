 const TEAMS = [
  { id: 'all',      label: 'All Teams' },
  { id: 'frontend', label: 'Frontend'  },
  { id: 'backend',  label: 'Backend'   },
  { id: 'qa',       label: 'QA'        },
  { id: 'devops',   label: 'DevOps'    },
];

const TeamFilter = ({ selectedTeam, onTeamChange }) => {
  return (
    <div className="flex items-center gap-2 p-1.5 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg w-full flex-wrap">
      {TEAMS.map((team) => (
        <button
          key={team.id}
          className={`px-5 py-2.5 rounded-lg text-base font-semibold whitespace-nowrap transition-all duration-200 text-center ${
            selectedTeam === team.id
              ? 'bg-indigo-900/60 text-indigo-100 border border-indigo-600/50 shadow-lg shadow-indigo-500/20'
              : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border border-transparent'
          }`}
          onClick={() => onTeamChange(team.id)}
        >
          {team.label}
        </button>
      ))}
    </div>
  );
};

export default TeamFilter;
