import './ProjectCard.css';

export default function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <div className="project-card">
      <div className="project-card-header">
        <h3>{project.title}</h3>
        <div className="project-card-actions">
          <button className="btn-small btn-edit" onClick={onEdit}>Edit</button>
          <button className="btn-small btn-delete" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {project.description && (
        <p className="project-description">{project.description}</p>
      )}

      <div className="project-card-footer">
        <small className="project-team">Team: {project.teamId}</small>
        <small className="project-date">
          Created: {new Date(project.createdAt).toLocaleDateString()}
        </small>
      </div>
    </div>
  );
}
