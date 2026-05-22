import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Toaster, toast } from 'react-hot-toast';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskForm from './TaskForm';
import api from '../../services/api';

const COLUMNS = [
  { id: 'TODO',        title: 'To Do',       color: 'border-slate-400' },
  { id: 'IN_PROGRESS', title: 'In Progress',  color: 'border-blue-500'  },
  { id: 'IN_REVIEW',   title: 'In Review',    color: 'border-amber-500' },
  { id: 'DONE',        title: 'Done',         color: 'border-emerald-500'},
];

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };


const KanbanBoard = () => {
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen]   = useState(false);
  const [teamFilter, setTeamFilter]   = useState('all');

  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  useEffect(() => { fetchTasks(); }, [teamFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = '/api/tasks';
      if (isManager && teamFilter !== 'all') url += `?teamId=${teamFilter}`;
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
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const task      = tasks.find((t) => t.taskId === draggableId);
    if (!task) return;

    if (!isManager && task.assigneeId !== user.userId) {
      toast.error('You can only move tasks assigned to you');
      return;
    }

    setTasks((prev) => prev.map((t) => t.taskId === draggableId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/api/tasks/${draggableId}/status`, { status: newStatus });
      toast.success('Task moved successfully');
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Failed to move task');
      setTasks((prev) => prev.map((t) => t.taskId === draggableId ? { ...t, status: task.status } : t));
    }
  };

  const handleTaskClick    = (task) => { setSelectedTask(task); setIsModalOpen(true); };
  const handleCloseModal   = ()     => { setIsModalOpen(false); setSelectedTask(null); };
  const handleTaskUpdate   = ()     => { fetchTasks(); handleCloseModal(); };
  const handleTaskCreated  = ()     => { fetchTasks(); setIsFormOpen(false); toast.success('Task created successfully! Email notification sent.'); };
  const getTasksByStatus = (status) =>
  tasks
    .filter((t) => t.status === status)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));

  if (loading)
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading tasks...</p>
      </div>
    );

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">

        {/* Header */}
        <div className="border-b border-slate-700/50 px-6 pt-8 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-100">Tasks Board</h1>
              <p className="text-slate-400 mt-1">Drag and drop tasks across columns to update their status.</p>
            </div>
            {isManager && (
              <div className="flex items-center gap-3">
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-700/30 border border-slate-600/40 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="all">All Teams</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="qa">QA</option>
                </select>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600/80 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 px-6 py-8 overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-5 min-w-max">
              {COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                return (
                  <div key={column.id} className="w-72 flex flex-col">
                    {/* Column header */}
                    <div className={`backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-3 border-t-2 ${column.color}`}>
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-100">{column.title}</h2>
                        <span className="bg-slate-700/60 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-600/50">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Droppable area */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 flex flex-col gap-3 min-h-[200px] rounded-xl p-2 transition-colors duration-200 ${
                            snapshot.isDraggingOver ? 'bg-indigo-500/5 border border-indigo-500/20' : 'border border-transparent'
                          }`}
                        >
                          {columnTasks.map((task, index) => {
                            const isDraggable = isManager || task.assigneeId === user.userId;
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
                                    style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.6 : 1 }}
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
                            <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-slate-700/50">
                              <p className="text-slate-500 text-xs">No tasks</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {/* Task detail modal */}
        {isModalOpen && selectedTask && (
          <TaskModal task={selectedTask} onClose={handleCloseModal} onUpdate={handleTaskUpdate} />
        )}

        {/* Create task modal */}
        {isFormOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setIsFormOpen(false)}
          >
            <div
              className="relative w-full max-w-xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="p-6">
                <TaskForm onSuccess={handleTaskCreated} onCancel={() => setIsFormOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default KanbanBoard;