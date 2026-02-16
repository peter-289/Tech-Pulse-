import React, { useEffect, useState } from 'react';
import './AdminPage.css';
import api from './API_Wrapper';

function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [packageSummary, setPackageSummary] = useState(null);
  const [adminPackages, setAdminPackages] = useState([]);
  const [ownerQuery, setOwnerQuery] = useState('');
  const [onlyPrivate, setOnlyPrivate] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    slug: '',
    type: 'knowledge',
    description: '',
    url: ''
  });

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      await Promise.all([
        fetchUsers(),
        fetchResources(),
        fetchPackageSummary(),
        fetchAdminPackages(),
      ]);
    };
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/api/v1/users', { params: { limit: 200 } });
      setUsers(res.data || []);
    } catch (err) {
      console.error('failed to fetch users', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPackageSummary = async () => {
    try {
      const res = await api.get('/api/v1/software-packages/admin/summary');
      setPackageSummary(res.data || null);
    } catch (err) {
      console.error('failed to fetch package summary', err);
      setPackageSummary(null);
    }
  };

  const fetchAdminPackages = async () => {
    setLoadingPackages(true);
    try {
      const params = { limit: 200, only_private: onlyPrivate };
      if (ownerQuery.trim()) params.owner_query = ownerQuery.trim();
      const res = await api.get('/api/v1/software-packages/admin/packages', { params });
      setAdminPackages(res.data || []);
    } catch (err) {
      console.error('failed to fetch package list', err);
      setAdminPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await api.get('/api/v1/resources');
      setResources(res.data || []);
    } catch (err) {
      console.error('failed to fetch resources', err);
      setResources([]);
    }
  };

  const createResource = async () => {
    if (!newResource.title || !newResource.slug) {
      alert('Title and slug are required');
      return;
    }
    try {
      const res = await api.post('/api/v1/resources', newResource);
      setResources((prev) => [res.data, ...prev]);
      setNewResource({ title: '', slug: '', type: 'knowledge', description: '', url: '' });
      alert('Resource created');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const deleteResource = async (slug) => {
    if (!window.confirm(`Delete resource ${slug}?`)) return;
    try {
      await api.delete(`/api/v1/resources/${encodeURIComponent(slug)}`);
      setResources((prev) => prev.filter((resource) => resource.slug !== slug));
      alert('Deleted');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed');
    }
  };

  const monitoredUsers = users.slice().sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="tp-admin-container">
      <header className="admin-header">
        <button className="tp-btn tp-btn-secondary" onClick={onBack}>Back</button>
        <h1>Admin Dashboard</h1>
        <div />
      </header>

      <section className="admin-section">
        <h2>Platform Monitoring</h2>
        {packageSummary ? (
          <div className="admin-filters">
            <div><strong>Total Packages:</strong> {packageSummary.total_packages}</div>
            <div><strong>Public:</strong> {packageSummary.public_packages}</div>
            <div><strong>Private:</strong> {packageSummary.private_packages}</div>
            <div><strong>Total Versions:</strong> {packageSummary.total_versions}</div>
            <div><strong>Total Downloads:</strong> {packageSummary.total_downloads}</div>
          </div>
        ) : (
          <div>Loading monitoring data...</div>
        )}
      </section>

      <section className="admin-section">
        <h2>User Monitoring</h2>
        {loadingUsers ? (
          <div>Loading users...</div>
        ) : (
          <div className="admin-users">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {monitoredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.username}</td>
                    <td>{user.full_name}</td>
                    <td>{user.role}</td>
                    <td>{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>Uploaded Projects Monitoring</h2>
        <div className="admin-filters">
          <input
            placeholder="Owner username/email/full name"
            value={ownerQuery}
            onChange={(event) => setOwnerQuery(event.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={onlyPrivate}
              onChange={(event) => setOnlyPrivate(event.target.checked)}
            />
            {' '}Only private
          </label>
          <button className="tp-btn tp-btn-primary" onClick={fetchAdminPackages}>Filter</button>
          <button
            className="tp-btn tp-btn-secondary"
            onClick={() => {
              setOwnerQuery('');
              setOnlyPrivate(false);
              fetchAdminPackages();
            }}
          >
            Reset
          </button>
          <button className="tp-btn tp-btn-secondary" onClick={fetchPackageSummary}>Refresh Metrics</button>
        </div>

        {loadingPackages ? (
          <div>Loading package data...</div>
        ) : (
          <div className="logs-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Language</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Visibility</th>
                  <th>Latest Version</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {adminPackages.map((project) => (
                  <tr key={project.package_id}>
                    <td>{project.package_id}</td>
                    <td>{project.name}</td>
                    <td>{project.category}</td>
                    <td>{project.language}</td>
                    <td>{project.owner_username}</td>
                    <td>{project.owner_email}</td>
                    <td>{project.is_public ? 'Public' : 'Private'}</td>
                    <td>{project.latest_version || 'N/A'}</td>
                    <td>{project.updated_at ? new Date(project.updated_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>Resources Management</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <input placeholder="Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} />
          <input placeholder="Slug" value={newResource.slug} onChange={(e) => setNewResource({ ...newResource, slug: e.target.value })} />
          <select value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}>
            <option value="api">API</option>
            <option value="knowledge">Knowledge</option>
            <option value="support">Support</option>
            <option value="updates">Updates</option>
          </select>
          <input placeholder="URL" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} />
          <button className="tp-btn tp-btn-primary" onClick={createResource}>Create</button>
        </div>
        <div className="logs-table">
          <table>
            <thead>
              <tr><th>Slug</th><th>Title</th><th>Type</th><th>URL</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.slug}>
                  <td>{resource.slug}</td>
                  <td>{resource.title}</td>
                  <td>{resource.type}</td>
                  <td>{resource.url}</td>
                  <td><button className="tp-btn tp-btn-secondary" onClick={() => deleteResource(resource.slug)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
