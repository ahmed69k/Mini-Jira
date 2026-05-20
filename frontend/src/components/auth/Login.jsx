import { useState } from 'react';
import { authAPI } from '../../services/auth';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [teamId, setTeamId] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      await authAPI.login(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password || !teamId) {
        setError('Email, password, and team ID are required');
        setLoading(false);
        return;
      }

      await authAPI.register(email, password, teamId);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Mini-Jira</h1>
          <p>Task Management System</p>
        </div>

        <form onSubmit={showRegister ? handleRegister : handleLogin} className="auth-form">
          <h2>{showRegister ? 'Create Account' : 'Sign In'}</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {showRegister && (
            <div className="form-group">
              <label htmlFor="teamId">Team ID</label>
              <input
                id="teamId"
                type="text"
                placeholder="e.g., team-123"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={loading}
                required
              />
              <small>The unique identifier for your team in the organization</small>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (showRegister ? 'Creating Account...' : 'Signing In...') : (showRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {showRegister ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setShowRegister(!showRegister);
                setError('');
                setEmail('');
                setPassword('');
                setTeamId('');
              }}
            >
              {showRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div className="auth-info">
          <h3>Demo Credentials:</h3>
          <p><strong>Email:</strong> manager@company.com</p>
          <p><strong>Password:</strong> TempPassword123!</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#666' }}>
            (Create an account or use credentials from your organization)
          </p>
        </div>
      </div>
    </div>
  );
}
