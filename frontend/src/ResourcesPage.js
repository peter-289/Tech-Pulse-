import React, { useEffect, useMemo, useState } from 'react';
import api from './API_Wrapper';
import './Workspace.css';
import './ResourcesPage.css';

const defaultOrder = ['api', 'knowledge', 'support', 'updates'];
const sectionLabels = {
  api: 'API',
  knowledge: 'Knowledge Base',
  support: 'Support',
  updates: 'Updates'
};

export default function ResourcesPage({ onLogout, user, onAdmin, onNavigate, onOpenResource }) {
  const [search, setSearch] = useState('');
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState({
    projects: 0,
    chats: 0
  });

  const userName = user?.full_name || user?.user_name || 'User';
  const [workspaceLoadedAt, setWorkspaceLoadedAt] = useState('');

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const [resourceRes, projRes, chatRes] = await Promise.all([
          api.get('/api/v1/resources'),
          api.get('/api/v1/software-packages', { params: { limit: 3 } }),
          api.get('/api/v1/support-chat/messages', { params: { limit: 3 } })
        ]);

        const map = {};
        (resourceRes.data || []).forEach((r) => {
          if (!map[r.type]) map[r.type] = [];
          map[r.type].push(r);
        });
        setResources(defaultOrder.map((type) => ({ type, items: map[type] || [] })));
        setStats({
          projects: (projRes.data || []).length,
          chats: (chatRes.data || []).length
        });
        setWorkspaceLoadedAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch {
        setResources(defaultOrder.map((type) => ({ type, items: [] })));
      }
    }

    loadWorkspace();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!query) return true;
          const title = String(item.title || '').toLowerCase();
          const description = String(item.description || '').toLowerCase();
          return title.includes(query) || description.includes(query);
        })
      }))
      .filter((section) => section.items.length > 0 || !query);
  }, [resources, search]);

  const totalResources = resources.reduce((acc, section) => acc + section.items.length, 0);

  return (
    <div className="tp-workspace">
      <div className="tp-shell">
        <header className="tp-hero">
          <div className="tp-hero-content">
            <span className="tp-hero-eyebrow">Operations Dashboard</span>
            <h1 className="tp-page-title">Workspace</h1>
            <p className="tp-page-subtitle">
              Welcome back, {userName}. Manage packages, support, and internal resources from one place.
            </p>
            <div className="tp-hero-meta">
              <span>Resources: {totalResources}</span>
              <span>Last sync: {workspaceLoadedAt || 'just now'}</span>
            </div>
          </div>
          <div className="tp-actions">
            {user && String(user.role).toLowerCase() === 'admin' && (
              <button className="tp-btn tp-btn-secondary" onClick={onAdmin}>Admin</button>
            )}
            <button className="tp-btn tp-btn-primary" onClick={() => onNavigate('support_ai')}>Open AI Assistant</button>
            <button className="tp-btn tp-btn-secondary" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <section className="tp-grid tp-dashboard-kpis">
          <div className="tp-col-4 tp-kpi">
            <span className="tp-kpi-label">Recent project uploads</span>
            <span className="tp-kpi-value">{stats.projects}</span>
            <span className="tp-kpi-foot">Latest package activity</span>
          </div>
          <div className="tp-col-4 tp-kpi">
            <span className="tp-kpi-label">Support chat messages</span>
            <span className="tp-kpi-value">{stats.chats}</span>
            <span className="tp-kpi-foot">Recent assistant interactions</span>
          </div>
          <div className="tp-col-4 tp-kpi">
            <span className="tp-kpi-label">Documentation entries</span>
            <span className="tp-kpi-value">{totalResources}</span>
            <span className="tp-kpi-foot">Indexed in resource hub</span>
          </div>
        </section>

        <section className="tp-grid">
          <div className="tp-col-12 tp-card tp-quick-tools">
            <div className="tp-card-head">
              <h2>Quick Actions</h2>
              <span className="tp-card-note">Jump straight into active workflows</span>
            </div>
            <div className="tp-quick-grid">
              <button className="tp-quick-card" onClick={() => onNavigate('projects')}>
                <span className="tp-quick-title">Project Hub</span>
                <span className="tp-quick-desc">Upload and distribute software packages</span>
              </button>
              <button className="tp-quick-card" onClick={() => onNavigate('support_ai')}>
                <span className="tp-quick-title">AI Assistant</span>
                <span className="tp-quick-desc">Resolve issues and ask technical questions</span>
              </button>
              <button className="tp-quick-card" onClick={() => onNavigate('api_docs')}>
                <span className="tp-quick-title">API Documentation</span>
                <span className="tp-quick-desc">Review available endpoints and payloads</span>
              </button>
            </div>
          </div>
        </section>

        <section className="tp-grid">
          <div className="tp-col-12 tp-card">
            <div className="tp-card-head tp-resource-head">
              <h2>Knowledge Resources</h2>
              <input
                className="tp-field tp-resource-search"
                type="text"
                placeholder="Search resources by title or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="tp-resource-sections">
              {filtered.map((section) => (
                <div key={section.type} className="tp-resource-section">
                  <div className="tp-resource-section-head">
                    <h3>{sectionLabels[section.type] || section.type.replace('_', ' ')}</h3>
                    <span className="tp-resource-count">{section.items.length}</span>
                  </div>
                  {section.items.length === 0 && <p className="tp-muted">No entries.</p>}
                  <div className="tp-list">
                    {section.items.map((item) => (
                      <article key={item.id} className="tp-list-item">
                        <div className="tp-card-head">
                          <strong>{item.title}</strong>
                          <span className="tp-badge">{section.type}</span>
                        </div>
                        <p className="tp-muted">{item.description}</p>
                        <div className="tp-actions">
                          {item.url && (
                            <a className="tp-btn tp-btn-secondary" href={item.url} target="_blank" rel="noopener noreferrer">
                              Open Link
                            </a>
                          )}
                          {item.slug && (
                            <button className="tp-btn tp-btn-primary" onClick={() => onOpenResource(item.slug)}>
                              Details
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
