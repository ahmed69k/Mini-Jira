import React, { useCallback, useEffect, useState } from "react";
import { Plus, Search, RefreshCw, FolderOpen, LayoutGrid, List } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../hooks/useAuth";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/projectsApi";
import ProjectCard from "./ProjectCard";
import ProjectForm from "./ProjectForm";

/* ─── Loading skeleton ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 overflow-hidden animate-pulse">
      <div className="h-1.5 bg-white/20" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-5/6" />
        <div className="h-3 bg-white/10 rounded w-1/3 mt-2" />
        <div className="h-1.5 bg-white/10 rounded-full mt-4" />
      </div>
    </div>
  );
}

/* ─── Delete confirm dialog ─────────────────────────────────────── */
function DeleteDialog({ project, onConfirm, onCancel, isDeleting }) {
  if (!project) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="alertdialog">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isDeleting ? onCancel : undefined} />
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white">Delete Project?</h3>
        <p className="text-sm text-slate-300">
          Are you sure you want to delete{" "}
          <strong className="text-white">{project.name}</strong>? This
          action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60 shadow-lg"
          >
            {isDeleting && <RefreshCw size={13} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const { user } = useAuth();
  const isManager = user?.isManager ?? false;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState(""); // manager only
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, project = edit
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch ── */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjects(isManager && teamFilter ? teamFilter : undefined);
      setProjects(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load projects.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isManager, teamFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* ── Search filter (client-side) ── */
  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.teamId?.toLowerCase().includes(q)
    );
  });

  /* ── Create / Edit submit ── */
  async function handleFormSubmit(data) {
    setSubmitting(true);
    try {
      if (editTarget) {
        await updateProject(editTarget.projectId, data);
        toast.success("Project updated.");
      } else {
        await createProject(data);
        toast.success("Project created.");
      }
      setFormOpen(false);
      setEditTarget(null);
      fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Delete ── */
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.projectId);
      toast.success("Project deleted.");
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete project.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Projects
            </h1>
            <p className="text-sm text-slate-300 mt-0.5">
              {isManager
                ? "All projects across your organisation"
                : "Projects assigned to your team"}
            </p>
          </div>

          {isManager && (
            <button
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg"
            >
              <Plus size={16} />
              New Project
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              aria-label="Search projects"
            />
          </div>

          {/* Manager: team filter */}
          {isManager && (
            <input
              type="text"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              placeholder="Filter by team ID…"
              className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all w-48"
              aria-label="Filter by team"
            />
          )}

          {/* View toggle */}
          <div className="flex rounded-xl border border-white/20 overflow-hidden bg-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2.5 transition-all ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2.5 transition-all ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List size={15} />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="px-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-slate-300 hover:bg-white/20 transition-all disabled:opacity-50"
            aria-label="Refresh projects"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Count badge */}
        {!loading && (
          <p className="text-xs text-slate-400 mb-4">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <FolderOpen size={48} strokeWidth={1} className="text-slate-400" />
            <div className="text-center">
              <p className="font-medium text-slate-300">
                {search ? "No projects match your search" : "No projects yet"}
              </p>
              {!search && isManager && (
                <p className="text-sm text-slate-400 mt-1">
                  Create your first project to get started.
                </p>
              )}
            </div>
            {!search && isManager && (
              <button
                onClick={() => { setEditTarget(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg"
              >
                <Plus size={15} />
                New Project
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                isManager={isManager}
                onEdit={(p) => { setEditTarget(p); setFormOpen(true); }}
                onDelete={(p) => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <ProjectForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={handleFormSubmit}
        initialData={editTarget}
        isSubmitting={submitting}
      />

      {/* Delete confirm */}
      <DeleteDialog
        project={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={deleting}
      />
    </div>
  );
}