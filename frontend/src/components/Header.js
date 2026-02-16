import React from 'react';
import './Header.css';
import { FEATURES } from '../config';

const navItems = [
  { id: 'resources', label: 'Workspace' },
  { id: 'support_ai', label: 'Support AI' },
  { id: 'projects', label: 'Project Hub' },
  { id: 'api_docs', label: 'API Docs' },
  { id: 'kb', label: 'Knowledge Base' },
  { id: 'support', label: 'Support' },
  { id: 'updates', label: 'Updates' }
];

export default function Header({ onNavigate, user, onLogout, activePage }) {
  return (
    <header className="tp-header">
      <div className="tp-header-left">
        <button className="tp-logo" onClick={() => onNavigate(user ? 'resources' : 'landing')} type="button">
          Tech Pulse
        </button>
        <nav className="tp-nav">
          {FEATURES.resources && user && navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="tp-header-right">
        {!user && (
          <>
            <button className="tp-btn tp-btn-secondary" onClick={() => onNavigate('login')}>Login</button>
            <button className="tp-btn tp-btn-secondary" onClick={() => onNavigate('register')}>Register</button>
          </>
        )}
        {user && (
          <>
            <span className="tp-user">{user.full_name || user.user_name}</span>
            {FEATURES.admin_tools && String(user.role).toLowerCase() === 'admin' && (
              <button className="tp-btn tp-btn-secondary" onClick={() => onNavigate('admin')}>Admin</button>
            )}
            <button className="tp-btn tp-btn-secondary" onClick={onLogout}>Logout</button>
          </>
        )}
      </div>
    </header>
  );
}
