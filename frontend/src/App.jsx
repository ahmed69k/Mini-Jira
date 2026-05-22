import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import KanbanBoard from './components/tasks/KanbanBoard';
import ManagerDashboard from './components/dashboard/ManagerDashboard';
import ProjectsPage from './components/projects/ProjectsPage';
import Navbar from './components/common/Navbar';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';

  const isAuthenticated = () => {
    return !!localStorage.getItem('idToken');
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
  };

  const AllowedRoles = ({ children, roles }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user?.role;

    if (!roles.includes(userRole)) {
      return <Navigate to="/tasks" replace />;
    }

    return children;
  };

  return (
    <div className="app min-h-screen bg-slate-950">
      {!isAuthPage && isAuthenticated() && <Navbar />}

      <main>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <Navigate to="/tasks" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/login"
            element={
              isAuthenticated() ? (
                <Navigate to="/tasks" replace />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/register"
            element={
              isAuthenticated() ? (
                <Navigate to="/tasks" replace />
              ) : (
                <Register />
              )
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <KanbanBoard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AllowedRoles roles={['manager']}>
                  <ManagerDashboard />
                </AllowedRoles>
              </ProtectedRoute>
            }
          />

          {/* fallback route */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;