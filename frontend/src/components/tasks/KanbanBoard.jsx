import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Toaster, toast } from 'react-hot-toast';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskForm from './TaskForm';
import api from '../../services/api';
import './KanbanBoard.css';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
  { id: 'IN_REVIEW', title: 'In Review', color: '#f59e0b' },
  { id: 'DONE', title: 'Done', color: '#10b981' },
];

const KanbanBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  useEffect(() => {
    fetchTasks();
  }, [teamFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = '/api/tasks';

      // For manager with team filter
      if (isManager && teamFilter !== 'all') {
        url += `?teamId=${teamFilter}`;
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

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId;

    // Find the task
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    // Check if employee trying to move task not assigned to them
    if (!isManager && task.assigneeId !== user.userId) {
      toast.error('You can only move tasks assigned to you');
      return;
    }

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === taskId ? { ...t, status: newStatus } : t
      )
    );

    // Update on backend
    try {
      await api.put(`/api/tasks/${taskId}/status`, { status: newStatus });
      toast.success('Task moved successfully');
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Failed to move task');
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId ? { ...t, status: task.status } : t
        )
      );
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskUpdate = () => {
    fetchTasks();
    handleCloseModal();
  };

  const handleTaskCreated = () => {
    fetchTasks();
    setIsFormOpen(false);
    toast.success('Task created successfully! Email notification sent.');
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  if (loading) {
    return (
      <div className="kanban-loading">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="kanban-container">
        <div className="kanban-header">
          <h1 className="kanban-title">Tasks Board</h1>
          <div className="kanban-actions">
            {isManager && (
              <>
                <select
                  className="team-filter"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="all">All Teams</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="qa">QA</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsFormOpen(true)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Task
                </button>
              </>
            )}
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-columns">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div key={column.id} className="kanban-column">
                  <div
                    className="column-header"
                    style={{ borderTopColor: column.color }}
                  >
                    <h2 className="column-title">{column.title}</h2>
                    <span className="column-count">{columnTasks.length}</span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`column-content ${
                          snapshot.isDraggingOver ? 'dragging-over' : ''
                        }`}
                      >
                        {columnTasks.map((task, index) => {
                          // Check if task is draggable - only manager or task assignee
                          const isDraggable =
                            isManager || task.assigneeId === user.userId;

                          return (
                            <Draggable
                              key={task.taskId}
                              draggableId={task.taskId}
                              index={index}
                              isDragDisabled={!isDraggable}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.5 : 1,
                                  }}
                                >
                                  <TaskCard
                                    task={task}
                                    onClick={() => handleTaskClick(task)}
                                    showTeam={isManager}
                                    isDraggable={isDraggable}
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        {columnTasks.length === 0 && (
                          <div className="empty-column">No tasks</div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {isModalOpen && selectedTask && (
          <TaskModal
            task={selectedTask}
            onClose={handleCloseModal}
            onUpdate={handleTaskUpdate}
          />
        )}

        {isFormOpen && (
          <div className="modal-backdrop" onClick={() => setIsFormOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setIsFormOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <TaskForm
                onSuccess={handleTaskCreated}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default KanbanBoard;
