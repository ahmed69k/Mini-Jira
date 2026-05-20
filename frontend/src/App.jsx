import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/auth/Login';
import ProjectsPage from './components/projects/ProjectsPage';
import { authAPI } from './services/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authAPI.isAuthenticated());
  const [user, setUser] = useState(authAPI.getCurrentUser());

  useEffect(() => {
    const authenticated = authAPI.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      setUser(authAPI.getCurrentUser());
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUser(authAPI.getCurrentUser());
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Mini-Jira</h1>
        </div>
        <ul className="nav-links">
          <li><span className="user-info">{user?.email}</span></li>
          <li><button onClick={handleLogout}>Logout</button></li>
        </ul>
      </nav>

      <main className="main-content">
        <ProjectsPage user={user} />
      </main>
    </div>
  );
}

export default App;
