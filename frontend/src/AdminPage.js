import React, { useEffect, useMemo, useState } from 'react';
import './AdminPage.css';
import api from './API_Wrapper';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'User Management' },
  { id: 'projects', label: 'Project Moderation' },
  { id: 'security', label: 'Security Alerts' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'notifications', label: 'Notifications' },
];

const USER_PAGE = 10;
const PROJECT_PAGE = 8;

const toneFor = (label = '') => {
  const v = String(label).toLowerCase();
  if (v.includes('critical') || v.includes('blocked') || v.includes('suspend')) return 'danger';
  if (v.includes('warning') || v.includes('review') || v.includes('suspicious')) return 'warning';
  if (v.includes('healthy') || v.includes('safe') || v.includes('active')) return 'success';
  return 'info';
};

const dt = (v) => {
  const n = new Date(v || 0);
  return Number.isNaN(n.getTime()) ? null : n;
};

const fmt = (v) => (dt(v) ? dt(v).toLocaleString() : 'N/A');
const dayKey = (v) => new Date(v).toISOString().slice(0, 10);

function Badge({ children }) {
  return <span className={`adm-badge ${toneFor(children)}`}>{children}</span>;
}

function Spark({ points }) {
  const max = Math.max(...points, 1);
  const poly = points
    .map((v, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - ((v / max) * 100)}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="adm-spark" aria-hidden="true">
      <polyline points={poly} />
    </svg>
  );
}

function Metric({ icon, label, value, trend, points }) {
  return (
    <article className="adm-card adm-metric">
      <div className="adm-row">
        <span className="adm-icon">{icon}</span>
        <span className={`adm-trend ${trend >= 0 ? 'up' : 'down'}`}>{trend >= 0 ? '+' : ''}{trend}%</span>
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
      <Spark points={points} />
    </article>
  );
}

function LineChart({ title, series, tone }) {
  const max = Math.max(...series.map((i) => i.value), 1);
  const pts = series.map((i, idx) => ({
    x: (idx / Math.max(series.length - 1, 1)) * 100,
    y: 100 - ((i.value / max) * 100),
  }));
  return (
    <article className="adm-card adm-chart-card">
      <h3>{title}</h3>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`adm-chart ${tone}`} aria-hidden="true">
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} />
      </svg>
    </article>
  );
}

function AdminPage({ onBack }) {
  const [section, setSection] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [archived, setArchived] = useState({});
  const [unread, setUnread] = useState({});
  const [suspendedUsers, setSuspendedUsers] = useState({});
  const [suspendedProjects, setSuspendedProjects] = useState({});
  const [confirmUser, setConfirmUser] = useState(null);
  const [userQuery, setUserQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [projectQuery, setProjectQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projectPage, setProjectPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, p, s, a, ev] = await Promise.all([
        api.get('/api/v1/users', { params: { limit: 200 } }),
        api.get('/api/v1/software-packages/admin/packages', { params: { limit: 300 } }),
        api.get('/api/v1/software-packages/admin/summary'),
        api.get('/api/v1/admin/alerts', { params: { only_unacknowledged: false, limit: 200 } }),
        api.get('/api/v1/admin/audit-events', { params: { limit: 400 } }),
      ]);
      const nextAlerts = a.data?.items || [];
      setUsers(u.data || []);
      setPackages(p.data || []);
      setSummary(s.data || null);
      setAlerts(nextAlerts);
      setAudit(ev.data?.items || []);
      setUnread((prev) => {
        const next = { ...prev };
        nextAlerts.forEach((item) => {
          if (!item.acknowledged && !Object.prototype.hasOwnProperty.call(next, item.id)) next[item.id] = true;
        });
        return next;
      });
    } catch {
      setError('Unable to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const id = setInterval(reload, 30000);
    return () => clearInterval(id);
  }, []);

  const activeSection = useMemo(
    () => SECTIONS.find((item) => item.id === section) || SECTIONS[0],
    [section],
  );

  const critical = useMemo(
    () => alerts.find((a) => !a.acknowledged && String(a.severity).toLowerCase() === 'critical'),
    [alerts],
  );

  const health = useMemo(() => {
    const c = alerts.filter((a) => !a.acknowledged && String(a.severity).toLowerCase() === 'critical').length;
    if (c > 0) return 'Critical';
    const w = alerts.filter((a) => !a.acknowledged).length;
    return w > 0 ? 'Warning' : 'Healthy';
  }, [alerts]);

  const unreadCount = useMemo(
    () => alerts.filter((a) => unread[a.id] && !archived[a.id]).length,
    [alerts, unread, archived],
  );

  const series = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return dayKey(d);
    });
    const map = (rows, pick) => days.map((day) => rows.filter((r) => pick(r) === day).length);
    const usersDaily = map(users, (u) => (u.created_at ? dayKey(u.created_at) : ''));
    const uploadsDaily = map(audit, (e) => (String(e.path || '').includes('/software-packages') ? dayKey(e.occurred_at) : ''));
    const downloadsDaily = map(audit, (e) => (String(e.path || '').includes('/download') ? dayKey(e.occurred_at) : ''));
    const alertDaily = map(alerts, (a) => (a.created_at ? dayKey(a.created_at) : ''));
    const first = (arr) => arr.slice(0, 7).reduce((s, n) => s + n, 0);
    const trend = (arr) => {
      const a = first(arr);
      const b = arr.slice(7).reduce((s, n) => s + n, 0);
      if (!a) return b ? 100 : 0;
      return Math.round(((b - a) / a) * 100);
    };
    return { usersDaily, uploadsDaily, downloadsDaily, alertDaily, trend };
  }, [users, audit, alerts]);

  const metrics = [
    { icon: 'U', label: 'Total Users', value: users.length, trend: series.trend(series.usersDaily), points: series.usersDaily },
    {
      icon: 'A',
      label: 'Active Users Today',
      value: new Set(audit.filter((e) => dayKey(e.occurred_at) === dayKey(new Date()) && e.actor_user_id).map((e) => e.actor_user_id)).size,
      trend: series.trend(series.usersDaily),
      points: series.usersDaily.slice(-7),
    },
    { icon: 'P', label: 'Total Uploaded Projects', value: summary?.total_packages ?? packages.length, trend: series.trend(series.uploadsDaily), points: series.uploadsDaily },
    { icon: 'S', label: 'Suspended Projects', value: Object.values(suspendedProjects).filter(Boolean).length, trend: 0, points: series.alertDaily },
    { icon: '!', label: 'Security Alerts', value: alerts.filter((a) => !a.acknowledged).length, trend: series.trend(series.alertDaily), points: series.alertDaily },
    {
      icon: 'T',
      label: 'Upload Activity Today',
      value: audit.filter((e) => dayKey(e.occurred_at) === dayKey(new Date()) && String(e.path || '').includes('/software-packages')).length,
      trend: series.trend(series.uploadsDaily),
      points: series.uploadsDaily.slice(-7),
    },
  ];

  const usersFiltered = users.filter((u) => {
    const text = `${u.username || ''} ${u.email || ''} ${u.full_name || ''}`.toLowerCase();
    if (userQuery && !text.includes(userQuery.toLowerCase())) return false;
    if (userFilter === 'active') return !suspendedUsers[u.id];
    if (userFilter === 'suspended') return !!suspendedUsers[u.id];
    if (userFilter === 'recent') return dt(u.created_at) && (Date.now() - dt(u.created_at).getTime()) < (7 * 86400000);
    return true;
  });
  const userCount = Math.max(1, Math.ceil(usersFiltered.length / USER_PAGE));
  const usersPage = usersFiltered.slice((userPage - 1) * USER_PAGE, userPage * USER_PAGE);

  const projectStatus = (p) => {
    if (suspendedProjects[p.package_id]) return 'Blocked';
    const has = alerts.some((a) => Number(a.actor_user_id) === Number(p.owner_id) && !a.acknowledged);
    if (!has) return 'Safe';
    const criticalAlert = alerts.some((a) => Number(a.actor_user_id) === Number(p.owner_id) && ['critical', 'high'].includes(String(a.severity).toLowerCase()));
    return criticalAlert ? 'Suspicious' : 'Under Review';
  };

  const projectsFiltered = packages.filter((p) => {
    const text = `${p.name} ${p.owner_username} ${p.owner_email}`.toLowerCase();
    if (projectQuery && !text.includes(projectQuery.toLowerCase())) return false;
    if (projectFilter === 'all') return true;
    return projectStatus(p).toLowerCase().replace(' ', '_') === projectFilter;
  });
  const projectCount = Math.max(1, Math.ceil(projectsFiltered.length / PROJECT_PAGE));
  const projectsPage = projectsFiltered.slice((projectPage - 1) * PROJECT_PAGE, projectPage * PROJECT_PAGE);
  const selectedLogs = selectedUser ? audit.filter((e) => Number(e.actor_user_id) === Number(selectedUser.id)).slice(0, 8) : [];

  const chooseSection = (target) => {
    setSection(target);
    setMenuOpen(false);
    setNotifyOpen(false);
  };

  return (
    <div className="tp-workspace adm-wrap">
      <div className="tp-shell adm-shell">
        <main className="adm-main">
          <header className="adm-topbar">
            <div className="adm-title-wrap">
              <button
                className="adm-menu-btn"
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <span />
                <span />
                <span />
              </button>
              <div>
                <h1>Admin Dashboard</h1>
                <p>{activeSection.label} view</p>
              </div>
            </div>
            <div className="adm-top-actions">
              <div className={`adm-health ${toneFor(health)}`}>{health}</div>
              <div className="adm-notify">
                <button className="adm-bell" type="button" onClick={() => setNotifyOpen((v) => !v)}>
                  Alerts
                  {unreadCount > 0 && <em>{unreadCount}</em>}
                </button>
                {notifyOpen && (
                  <div className="adm-drop">
                    {alerts.filter((a) => !archived[a.id]).slice(0, 6).map((a) => (
                      <button key={a.id} type="button" onClick={() => chooseSection('notifications')}>
                        <span>{a.title}</span>
                        <small>{fmt(a.created_at)}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="adm-profile">
                <span>AD</span>
                <div><strong>Administrator</strong><small>Superuser</small></div>
              </div>
              <button className="tp-btn tp-btn-secondary" onClick={onBack} type="button">Back</button>
            </div>
          </header>

          {critical && (
            <section className="adm-critical">
              <div><strong>Critical alert</strong><p>{critical.title}</p></div>
              <button className="tp-btn tp-btn-primary" onClick={() => chooseSection('projects')} type="button">Suspend Download</button>
            </section>
          )}

          {loading && <div className="adm-state">Loading...</div>}
          {!!error && <div className="adm-state error">{error}</div>}

          {!loading && !error && section === 'overview' && (
            <section className="adm-grid-metrics">
              {metrics.map((m) => <Metric key={m.label} {...m} />)}
            </section>
          )}

          {!loading && !error && section === 'users' && (
            <section className="adm-card">
              <div className="adm-row adm-head">
                <h2>User Management</h2>
                <div className="adm-row">
                  <input className="tp-field" placeholder="Search" value={userQuery} onChange={(e) => { setUserQuery(e.target.value); setUserPage(1); }} />
                  <select className="tp-select" value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setUserPage(1); }}>
                    <option value="all">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="recent">Recently Registered</option>
                  </select>
                </div>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>User</th><th>Email</th><th>Status</th><th>Role</th><th>Registered</th><th>Actions</th></tr></thead>
                  <tbody>
                    {usersPage.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.username}</strong><div className="adm-sub">{u.full_name || 'N/A'}</div></td>
                        <td>{u.email}</td>
                        <td><Badge>{suspendedUsers[u.id] ? 'Suspended' : 'Active'}</Badge></td>
                        <td>{u.role}</td>
                        <td>{fmt(u.created_at)}</td>
                        <td>
                          <div className="adm-row">
                            <button className="tp-btn tp-btn-secondary" onClick={() => setSelectedUser(u)} type="button">View</button>
                            <button className="tp-btn tp-btn-secondary" onClick={() => (suspendedUsers[u.id] ? setSuspendedUsers((p) => { const n = { ...p }; delete n[u.id]; return n; }) : setConfirmUser(u))} type="button">{suspendedUsers[u.id] ? 'Reactivate' : 'Suspend'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="adm-page">{Array.from({ length: userCount }).map((_, i) => <button key={i} className={userPage === i + 1 ? 'active' : ''} onClick={() => setUserPage(i + 1)} type="button">{i + 1}</button>)}</div>
              {selectedUser && (
                <div className="adm-profile-box">
                  <div className="adm-row adm-head"><h3>User Profile</h3><button className="tp-btn tp-btn-secondary" onClick={() => setSelectedUser(null)} type="button">Close</button></div>
                  <p><strong>ID:</strong> {selectedUser.id} | <strong>Username:</strong> {selectedUser.username} | <strong>Email:</strong> {selectedUser.email}</p>
                  <h4>Activity logs</h4>
                  <ul>{selectedLogs.map((l) => <li key={l.id}><strong>{l.event_type}</strong> <span>{fmt(l.occurred_at)}</span></li>)}{!selectedLogs.length && <li>No logs.</li>}</ul>
                </div>
              )}
            </section>
          )}

          {!loading && !error && section === 'projects' && (
            <section className="adm-card">
              <div className="adm-row adm-head">
                <h2>Project Moderation</h2>
                <div className="adm-row">
                  <input className="tp-field" placeholder="Search project/uploader" value={projectQuery} onChange={(e) => { setProjectQuery(e.target.value); setProjectPage(1); }} />
                  <select className="tp-select" value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setProjectPage(1); }}>
                    <option value="all">All</option><option value="safe">Safe</option><option value="under_review">Under Review</option><option value="suspicious">Suspicious</option><option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Project</th><th>Uploader</th><th>Visibility</th><th>Scan Status</th><th>Updated</th><th>Actions</th></tr></thead>
                  <tbody>
                    {projectsPage.map((p) => (
                      <tr key={p.package_id}>
                        <td><strong>{p.name}</strong><div className="adm-sub">v{p.latest_version || 'N/A'}</div></td>
                        <td><strong>{p.owner_username}</strong><div className="adm-sub">{p.owner_email}</div></td>
                        <td>{p.is_public ? 'Public' : 'Private'}</td>
                        <td><Badge>{projectStatus(p)}</Badge></td>
                        <td>{fmt(p.updated_at)}</td>
                        <td>
                          <div className="adm-row">
                            <button className="tp-btn tp-btn-secondary" onClick={() => setSuspendedProjects((s) => ({ ...s, [p.package_id]: true }))} type="button">Halt Download</button>
                            <button className="tp-btn tp-btn-secondary" onClick={() => setSuspendedProjects((s) => ({ ...s, [p.package_id]: true }))} type="button">Suspend</button>
                            <button className="tp-btn tp-btn-secondary" onClick={() => setSuspendedProjects((s) => ({ ...s, [p.package_id]: false }))} type="button">Restore</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="adm-page">{Array.from({ length: projectCount }).map((_, i) => <button key={i} className={projectPage === i + 1 ? 'active' : ''} onClick={() => setProjectPage(i + 1)} type="button">{i + 1}</button>)}</div>
            </section>
          )}

          {!loading && !error && section === 'security' && (
            <section className="adm-card">
              <div className="adm-row adm-head"><h2>Security & System Alert Center</h2><button className="tp-btn tp-btn-secondary" onClick={reload} type="button">Refresh</button></div>
              <ul className="adm-alerts">
                {alerts.filter((a) => !archived[a.id]).map((a) => (
                  <li key={a.id} className={unread[a.id] ? 'unread' : ''}>
                    <div className="adm-row"><Badge>{String(a.severity || 'info').toUpperCase()}</Badge><div><strong>{a.title}</strong><p>{a.description}</p></div></div>
                    <div className="adm-row">
                      <small>{fmt(a.created_at)}</small>
                      <small>User: {a.actor_user_id || 'N/A'}</small>
                      <button className="tp-btn tp-btn-secondary" onClick={async () => {
                        try {
                          await api.patch(`/api/v1/admin/alerts/${a.id}/ack`);
                          setAlerts((prev) => prev.map((item) => (item.id === a.id ? { ...item, acknowledged: true } : item)));
                        } catch {
                          setError('Unable to acknowledge alert.');
                        }
                      }} type="button">Acknowledge</button>
                      <button className="tp-btn tp-btn-secondary" onClick={() => setUnread((u) => { const n = { ...u }; delete n[a.id]; return n; })} type="button">Mark Read</button>
                      <button className="tp-btn tp-btn-secondary" onClick={() => setArchived((v) => ({ ...v, [a.id]: true }))} type="button">Archive</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading && !error && section === 'analytics' && (
            <section className="adm-chart-grid">
              <LineChart title="User growth over time" tone="blue" series={series.usersDaily.map((v, i) => ({ label: i, value: v }))} />
              <LineChart title="Upload activity trends" tone="green" series={series.uploadsDaily.map((v, i) => ({ label: i, value: v }))} />
              <LineChart title="Download activity trends" tone="teal" series={series.downloadsDaily.map((v, i) => ({ label: i, value: v }))} />
              <LineChart title="Suspended content statistics" tone="amber" series={series.alertDaily.map((v, i) => ({ label: i, value: v }))} />
            </section>
          )}

          {!loading && !error && section === 'notifications' && (
            <section className="adm-card">
              <div className="adm-row adm-head"><h2>Notifications</h2><small>{unreadCount} unread</small></div>
              <ul className="adm-notification-list">
                {alerts.filter((a) => !archived[a.id]).map((a) => (
                  <li key={a.id} className={unread[a.id] ? 'unread' : ''}>
                    <div><div className="adm-row"><Badge>{String(a.severity || 'info').toUpperCase()}</Badge><strong>{a.title}</strong></div><p>{a.description}</p><small>{fmt(a.created_at)}</small></div>
                    <div className="adm-row">
                      <button className="tp-btn tp-btn-secondary" onClick={() => setUnread((u) => { const n = { ...u }; delete n[a.id]; return n; })} type="button">Mark Read</button>
                      <button className="tp-btn tp-btn-secondary" onClick={() => setArchived((v) => ({ ...v, [a.id]: true }))} type="button">Archive</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>

      {menuOpen && (
        <div className="adm-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <aside className="adm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-head">
              <strong>Navigate</strong>
              <button className="tp-btn tp-btn-secondary" type="button" onClick={() => setMenuOpen(false)}>Close</button>
            </div>
            <nav className="adm-drawer-nav">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  className={`adm-nav ${section === item.id ? 'active' : ''}`}
                  onClick={() => chooseSection(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {confirmUser && (
        <div className="adm-modal">
          <div className="adm-modal-card">
            <h3>Suspend account</h3>
            <p>Suspend {confirmUser.username}? This action can be reverted.</p>
            <div className="adm-row">
              <button className="tp-btn tp-btn-secondary" onClick={() => setConfirmUser(null)} type="button">Cancel</button>
              <button className="tp-btn tp-btn-primary" onClick={() => { setSuspendedUsers((prev) => ({ ...prev, [confirmUser.id]: true })); setConfirmUser(null); }} type="button">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
