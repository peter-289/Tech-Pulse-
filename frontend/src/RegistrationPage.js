import React, { useEffect, useState } from 'react';
import './RegistrationPage.css';
import api from './API_Wrapper';

function RegistrationPage({ onBack }) {
  const [form, setForm] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [show, setShow] = useState(false);
  const [type, setType] = useState('success');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const validatePassword = (password) => {
    const reasons = [];
    if (!password || password.length < 8) reasons.push('At least 8 characters');
    if (!/[0-9]/.test(password)) reasons.push('At least one number');
    if (!/[a-z]/.test(password)) reasons.push('At least one lowercase letter');
    if (!/[A-Z]/.test(password)) reasons.push('At least one uppercase letter');
    return { valid: reasons.length === 0, reasons };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (form.password !== form.confirm_password) {
      setType('error');
      setShow(true);
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    const pwCheck = validatePassword(form.password);
    if (!pwCheck.valid) {
      setType('error');
      setShow(true);
      setMessage(`Password must meet requirements: ${pwCheck.reasons.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        full_name: form.fullname,
        username: form.username,
        email: form.email,
        password: form.password,
      };

      const response = await api.post('/api/v1/users', payload);
      const detail = response.data?.detail || 'Registration successful.';
      setType('success');
      setShow(true);
      setMessage(detail);
      setForm({ fullname: '', username: '', email: '', password: '', confirm_password: '' });
    } catch (err) {
      const detail = err.response?.data?.detail || 'Network error. Please try again.';
      setType('error');
      setShow(true);
      setMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!show) return undefined;
    const timer = setTimeout(() => setShow(false), 5500);
    return () => clearTimeout(timer);
  }, [show]);

  const passwordChecks = [
    { ok: form.password.length >= 8, text: 'At least 8 characters' },
    { ok: /[0-9]/.test(form.password), text: 'At least one number' },
    { ok: /[a-z]/.test(form.password), text: 'At least one lowercase letter' },
    { ok: /[A-Z]/.test(form.password), text: 'At least one uppercase letter' },
  ];

  return (
    <div className="tp-auth-page">
      {message && (
        <div className={`tp-auth-message ${show ? 'show' : ''} ${type}`} role="status" aria-live="polite">
          {message}
        </div>
      )}

      <div className="tp-auth-shell">
        <aside className="tp-auth-panel">
          <span className="tp-auth-badge">Create Account</span>
          <h1>Set up your Tech Pulse workspace</h1>
          <p>Register once to access projects, resources, and integrated support workflows.</p>
          <ul>
            <li>Fast onboarding flow</li>
            <li>Secure account verification</li>
            <li>Role-based platform access</li>
          </ul>
        </aside>

        <form className="tp-auth-form" onSubmit={handleSubmit}>
          <h2>Register</h2>

          <label>
            Full Name
            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              required
              autoComplete="name"
              placeholder="Enter your full name"
            />
          </label>

          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="Choose a username"
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="Enter your email"
            />
          </label>

          <label>
            Password
            <div className="tp-input-with-toggle">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Create a password"
              />
              <button
                type="button"
                className="tp-toggle-password"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <ul className="tp-password-rules" aria-live="polite">
            {passwordChecks.map((check) => (
              <li key={check.text} className={check.ok ? 'ok' : ''}>
                {check.ok ? 'OK' : '--'} {check.text}
              </li>
            ))}
          </ul>

          <label>
            Confirm Password
            <div className="tp-input-with-toggle">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="tp-toggle-password"
                onClick={() => setShowConfirm((value) => !value)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button className="tp-btn tp-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          <button type="button" className="tp-btn tp-btn-secondary" onClick={onBack}>
            Back
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegistrationPage;
