 import './TeamFilter.css';

const TEAMS = [
  { id: 'all',      label: 'All Teams' },
  { id: 'frontend', label: 'Frontend'  },
  { id: 'backend',  label: 'Backend'   },
  { id: 'qa',       label: 'QA'        },
  { id: 'devops',   label: 'DevOps'    },
];

const TeamFilter = ({ selectedTeam, onTeamChange }) => {
  return (
    <div className="team-filter-bar">
      {TEAMS.map((team) => (
        <button
          key={team.id}
          className={`team-filter-btn ${selectedTeam === team.id ? 'active' : ''}`}
          onClick={() => onTeamChange(team.id)}
        >
          {team.label}
        </button>
      ))}
    </div>
  );
};

export default TeamFilter;
