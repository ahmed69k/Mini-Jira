import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  const handleLogout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/logout`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('idToken')}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('idToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-b border-indigo-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Brand */}
          <Link to="/tasks" className="text-3xl font-bold text-white hover:text-indigo-300 transition">
            Mini-Jira
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/tasks"
              className="text-slate-300 hover:text-white transition font-semibold text-base"
            >
              Tasks
            </Link>
            <Link
              to="/projects"
              className="text-slate-300 hover:text-white transition font-semibold text-base"
            >
              Projects
            </Link>
            {isManager && (
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white transition font-semibold text-base"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden sm:block text-right">
              <p className="text-white font-semibold text-sm">{user.name || 'User'}</p>
              <p className="text-slate-400 text-xs capitalize">{user.role || 'employee'}</p>
            </div>

            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden md:block px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3">
            <Link
              to="/tasks"
              className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              onClick={() => setIsOpen(false)}
            >
              Tasks
            </Link>
            <Link
              to="/projects"
              className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            {isManager && (
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-white/10 rounded-lg transition font-semibold"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
