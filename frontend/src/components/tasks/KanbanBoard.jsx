import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Toaster, toast } from 'react-hot-toast';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskForm from './TaskForm';
import api from '../../services/api';

const COLUMNS = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'IN_REVIEW', title: 'In Review' },
  { id: 'DONE', title: 'Done' },
];

const PRIORITY_ORDER = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [teamFilter, setTeamFilter] = useState('all');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [teamFilter]);

  const fetchTeams = async () => {
    const res = await api.get('/api/teams');
    setTeams(res.data);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);

      let url = '/api/tasks';
      if (isManager && teamFilter !== 'all') {
        url += `?teamId=${teamFilter}`;
      }

      const res = await api.get(url);
      setTasks(res.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DRAG ----------------
  const handleDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const newStatus = destination.droppableId;

    const task = tasks.find((t) => t.taskId === draggableId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === draggableId
          ? { ...t, status: newStatus }
          : t
      )
    );

    try {
      await api.put(`/api/tasks/${draggableId}/status`, {
        status: newStatus,
      });
    } catch {
      toast.error('Failed to update task');
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === draggableId
            ? { ...t, status: task.status }
            : t
        )
      );
    }
  };

  // ---------------- SORTED TASKS ----------------
  const getTasksByStatus = (status) =>
    tasks
      .filter((t) => t.status === status)
      .sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 3) -
          (PRIORITY_ORDER[b.priority] ?? 3)
      );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center text-slate-400">
        Loading tasks...
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-8">

        <div className="mx-auto max-w-7xl space-y-8">

          {/* HEADER (MATCH PROJECTS STYLE) */}
          <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h1 className="text-4xl font-bold text-slate-100">
                  Tasks Board
                </h1>
                <p className="text-slate-400 mt-2">
                  Drag tasks across columns and click to view details
                </p>
              </div>

              {isManager && (
                <div className="flex gap-3">
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100"
                  >
                    <option value="all">All Teams</option>
                    {teams.map((t) => (
                      <option key={t.id || t.teamId} value={t.id || t.teamId}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Create Task
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* BOARD */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl overflow-x-auto">

              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-5">

                  {COLUMNS.map((col) => (
                    <div
                      key={col.id}
                      className="w-72 flex-shrink-0 bg-slate-900/60 border border-slate-700/50 rounded-3xl p-4"
                    >
                      <h2 className="text-slate-100 font-semibold mb-4">
                        {col.title}
                      </h2>

                      <Droppable droppableId={col.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-3 min-h-[200px]"
                          >
                            {getTasksByStatus(col.id).map((task, index) => (
                              <Draggable
                                key={task.taskId}
                                draggableId={task.taskId}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <div
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setIsModalOpen(true);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <TaskCard
                                        task={task}
                                        showTeam={isManager}
                                      />
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}

                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}

                </div>
              </DragDropContext>

            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={fetchTasks}
        />
      )}

      {/* CREATE FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <TaskForm
              teams={teams}
              onSuccess={() => {
                setIsFormOpen(false);
                fetchTasks();
                toast.success('Task created');
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}