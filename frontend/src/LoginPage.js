import { useEffect, useState } from 'react';
import './LoginPage.css';
import api from './API_Wrapper';
import qs from 'qs';

const Toast = ({ message, type = 'error', onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 450);
    }, 5200);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`tp-toast tp-toast-${type} ${visible ? 'tp-toast-show' : ''}`} role="alert">
      {message}
    </div>
  );
};

export default function LoginPage({ onBack, onLogin, onForgot }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      await api.post(
        '/api/v1/auth/login',
        qs.stringify({
          username: form.username,
          password: form.password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      showToast('Welcome back!', 'success');
      onLogin?.();
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Login failed.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tp-auth-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="tp-auth-shell">
        <aside className="tp-auth-panel">
          <span className="tp-auth-badge">Secure Access</span>
          <h1>Sign in to your workspace</h1>
          <p>Manage software projects, resources, and support flows in one place.</p>
          <ul>
            <li>Role-aware dashboard access</li>
            <li>Session-protected authentication</li>
            <li>Integrated operational tooling</li>
          </ul>
        </aside>

        <form className="tp-auth-form" onSubmit={handleSubmit}>
          <h2>Sign In</h2>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <button
            className="tp-btn tp-btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="tp-auth-links">
            <button
              type="button"
              className="tp-auth-link"
              onClick={() => onForgot?.()}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="button"
            className="tp-btn tp-btn-secondary"
            onClick={onBack}
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
}
