import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { X, Loader2, AlertCircle } from "lucide-react";
import { getTeams } from "../../services/teamsApi";

/**
 * ProjectForm
 *
 * Modal dialog for creating or editing a project.
 * Opens when `isOpen` is true. Calls `onSubmit` with form data on save.
 *
 * Props:
 *   isOpen       — boolean
 *   onClose      — () => void
 *   onSubmit     — (data: { name, description, teamId }) => Promise<void>
 *   initialData  — project object (editing) | null (creating)
 *   isSubmitting — boolean (parent controls loading state)
 */
export default function ProjectForm({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
  const [form, setForm] = useState({ name: "", description: "", teamId: "" });
  const [errors, setErrors] = useState({});
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState(null);

  // Reset form when modal opens/closes or switches between create/edit
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        teamId: initialData?.teamId ?? "",
      });
      setErrors({});
      fetchTeams();
    }
  }, [isOpen, initialData]);

  // Trap focus / close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && !isSubmitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isSubmitting, onClose]);

  async function fetchTeams() {
    setTeamsLoading(true);
    setTeamsError(null);
    try {
      const res = await getTeams();
      setTeams(res.data || []);
    } catch {
      setTeamsError("Could not load teams. Enter a team ID manually.");
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Project name is required.";
    else if (form.name.trim().length > 80) errs.name = "Name must be 80 characters or fewer.";
    if (form.description.length > 500) errs.description = "Description must be 500 characters or fewer.";
    if (!form.teamId.trim()) errs.teamId = "Team is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      teamId: form.teamId.trim(),
    });
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  if (!isOpen) return null;

  const isEditing = Boolean(initialData?.projectId);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label={isEditing ? "Edit project" : "Create new project"}
    >
      {/* Dim overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Panel - Glassmorphism */}
      <div className="relative w-full max-w-lg backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Project name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="proj-name"
                className="text-sm font-medium text-slate-200"
              >
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                id="proj-name"
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Q3 Platform Redesign"
                maxLength={80}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-red-400 focus:ring-red-300"
                    : "border-white/20 focus:ring-indigo-400"
                }`}
                aria-describedby={errors.name ? "proj-name-error" : undefined}
                aria-invalid={Boolean(errors.name)}
              />
              <div className="flex items-center justify-between">
                {errors.name ? (
                  <p id="proj-name-error" className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                ) : <span />}
                <span className="text-xs text-slate-400">{form.name.length}/80</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="proj-desc"
                className="text-sm font-medium text-slate-200"
              >
                Description
              </label>
              <textarea
                id="proj-desc"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="What is this project about?"
                rows={3}
                maxLength={500}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 resize-none transition-all ${
                  errors.description
                    ? "border-red-400 focus:ring-red-300"
                    : "border-white/20 focus:ring-indigo-400"
                }`}
                aria-describedby={errors.description ? "proj-desc-error" : undefined}
                aria-invalid={Boolean(errors.description)}
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p id="proj-desc-error" className="flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle size={12} /> {errors.description}
                  </p>
                ) : <span />}
                <span className="text-xs text-slate-400">{form.description.length}/500</span>
              </div>
            </div>

            {/* Team */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="proj-team"
                className="text-sm font-medium text-slate-200"
              >
                Team <span className="text-red-400">*</span>
              </label>

              {teamsError && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {teamsError}
                </p>
              )}

              {/* If teams loaded, show a select; otherwise show a text input as fallback */}
              {teams.length > 0 ? (
                <select
                  id="proj-team"
                  value={form.teamId}
                  onChange={(e) => handleChange("teamId", e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white/10 text-white focus:outline-none focus:ring-2 transition-all appearance-none ${
                    errors.teamId
                      ? "border-red-400 focus:ring-red-300"
                      : "border-white/20 focus:ring-indigo-400"
                  }`}
                  aria-describedby={errors.teamId ? "proj-team-error" : undefined}
                  aria-invalid={Boolean(errors.teamId)}
                >
                  <option value="" className="bg-slate-800">Select a team…</option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId} className="bg-slate-800">
                      {t.name || t.teamId}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="proj-team"
                  type="text"
                  value={form.teamId}
                  onChange={(e) => handleChange("teamId", e.target.value)}
                  placeholder={teamsLoading ? "Loading teams…" : "Enter team ID"}
                  disabled={teamsLoading}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                    errors.teamId
                      ? "border-red-400 focus:ring-red-300"
                      : "border-white/20 focus:ring-indigo-400"
                  }`}
                />
              )}

              {errors.teamId && (
                <p id="proj-team-error" className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle size={12} /> {errors.teamId}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/20 bg-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ProjectForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isSubmitting: PropTypes.bool,
};

ProjectForm.defaultProps = {
  initialData: null,
  isSubmitting: false,
};