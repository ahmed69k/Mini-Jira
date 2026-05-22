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
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Check if user is logged in
  const isAuthenticated = () => {
    return !!localStorage.getItem('idToken');
  };

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <div className="app min-h-screen bg-slate-950">
      {!isAuthPage && isAuthenticated() && <Navbar />}

      <main className={isAuthPage ? '' : ''}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated() ? <Navigate to="/tasks" /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated() ? <Navigate to="/tasks" /> : <Login />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated() ? <Navigate to="/tasks" /> : <Register />
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
                <ManagerDashboard />
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
