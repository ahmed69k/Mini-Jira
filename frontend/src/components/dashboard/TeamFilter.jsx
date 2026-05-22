 const TEAMS = [
  { id: 'all',      label: 'All Teams' },
  { id: 'frontend', label: 'Frontend'  },
  { id: 'backend',  label: 'Backend'   },
  { id: 'qa',       label: 'QA'        },
  { id: 'devops',   label: 'DevOps'    },
];

const TeamFilter = ({ selectedTeam, onTeamChange }) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit flex-wrap sm:flex-nowrap sm:w-fit">
      {TEAMS.map((team) => (
        <button
          key={team.id}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            selectedTeam === team.id
              ? 'bg-white text-gray-900 font-semibold shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm'
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
