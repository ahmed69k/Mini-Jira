import { useEffect } from 'react';
import TaskDetail from './TaskDetail';
import './TaskModal.css';

const TaskModal = ({ task, onClose, onUpdate }) => {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Debug: Log task data
  console.log('TaskModal - task data:', task);

  // Safety check
  if (!task) {
    console.error('TaskModal: No task data provided');
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <TaskDetail task={task} onUpdate={onUpdate} onClose={onClose} />
      </div>
    </div>
  );
};

export default TaskModal;
