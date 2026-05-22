import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee',
    teamName: '', // ✅ changed from teamId -> teamName
  });

  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ---------------- FETCH TEAMS ----------------
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await axios.get(`${API_URL}/api/teams`);
        setTeams(res.data || []);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };

    fetchTeams();
  }, []);

  // ---------------- HANDLE INPUT ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------- REGISTER ----------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      await axios.post(`${API_URL}/api/register`, {
        ...formData,
        teamId: formData.teamName, // ✅ ensure sending name
      });

      setSuccess('Registration successful! Check your email.');
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CONFIRM EMAIL ----------------
  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      await axios.post(`${API_URL}/api/auth/confirm`, {
        email: formData.email,
        code: confirmationCode,
      });

      setSuccess('Email confirmed! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Confirmation failed. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8">

          {/* HEADER */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white">
              {step === 1 ? 'Create Account' : 'Confirm Email'}
            </h1>
            <p className="text-slate-300 mt-2">
              {step === 1
                ? 'Sign up for Mini Jira'
                : 'Enter the confirmation code sent to your email'}
            </p>
          </div>

          {/* MESSAGES */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/40 text-green-200 text-sm">
              {success}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4">

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                minLength={8}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
              />

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>

              {/* ✅ NEW TEAM DROPDOWN */}
              <select
                name="teamName"
                value={formData.teamName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="">Select Team</option>

                {teams.map((team) => (
                  <option key={team.id || team.teamId} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            /* STEP 2 */
            <form onSubmit={handleConfirm} className="space-y-4">

              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="Confirmation code"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                {loading ? 'Confirming...' : 'Confirm Email'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                Back
              </button>
            </form>
          )}

          {/* FOOTER */}
          <div className="mt-6 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400">
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;