import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'manager';

  // ---------------- CLOSE ON OUTSIDE CLICK ----------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
      localStorage.removeItem('idToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login');
  };

  return (
    <nav className="sticky top-4 z-50 mx-4 mb-4 backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 shadow-xl rounded-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/tasks"
            className="text-3xl font-bold text-white hover:text-indigo-300 transition"
          >
            Mini-Jira
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/tasks"
              className="text-slate-300 hover:text-white font-semibold"
            >
              Tasks
            </Link>

            <Link
              to="/projects"
              className="text-slate-300 hover:text-white font-semibold"
            >
              Projects
            </Link>

            {isManager && (
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white font-semibold"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4 relative">

            {/* PROFILE DROPDOWN */}
            <div ref={profileRef} className="relative">

              {/* CLICKABLE PROFILE */}
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-3 hover:bg-white/5 px-3 py-2 rounded-xl transition"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                {/* Name + Role */}
                <div className="hidden sm:block text-left">
                  <p className="text-white font-semibold text-sm">
                    {user.name || 'User'}
                  </p>
                  <p className="text-slate-400 text-xs capitalize">
                    {user.role || 'employee'}
                  </p>
                </div>
              </button>

              {/* DROPDOWN MENU */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl overflow-hidden">

                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-white/5 transition"
                  >
                    Logout
                  </button>

                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
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
          </div>
        </div>

        {/* MOBILE MENU */}
        {isOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3">

            <Link
              to="/tasks"
              className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              Tasks
            </Link>

            <Link
              to="/projects"
              className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>

            {isManager && (
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;