import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import KanbanBoard from './components/tasks/KanbanBoard';
import ManagerDashboard from './components/dashboard/ManagerDashboard';

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

  //Role based auth
  const AllowedRoles = ({ children, roles }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user?.role;

    if (!roles.includes(userRole)) {
      return <Navigate to="/tasks" />;
    }

    return children;
  };

  return (
    <div className="app">
      {!isAuthPage && isAuthenticated() && (
        <header className="app-header">
          <div className="container">
            <h1 className="app-title">Mini Jira</h1>
            <nav className="app-nav">
              <button
                className="btn-logout"
                onClick={() => {
                  localStorage.removeItem('idToken');
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
              >
                Logout
              </button>
            </nav>
          </div>
        </header>
      )}

      <main className="app-main">
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AllowedRoles roles={["manager"]}>
                  <ManagerDashboard></ManagerDashboard>
                </AllowedRoles>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
