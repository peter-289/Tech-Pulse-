import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { API_BASE_URL } from './API_Wrapper';
import './Workspace.css';
import './ProjectHubPage.css';

const CATEGORY_ORDER = [
  'networking software',
  'cracked software',
  'student projects',
  'desktop applications',
  'mobile application',
];

const CATEGORY_LABELS = {
  'networking software': 'Networking Software',
  'cracked software': 'Cracked Software',
  'student projects': 'Student Projects',
  'desktop applications': 'Desktop Applications',
  'mobile application': 'Mobile Application',
};

function humanSize(bytes) {
  if (!bytes && bytes !== 0) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function ProjectHubPage({ user }) {
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ORDER[0]);
  const [languageSearch, setLanguageSearch] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    version: '',
    category: 'student projects',
    language: '',
    is_public: true,
    file: null,
  });

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const params = {};
      if (languageSearch.trim()) params.language = languageSearch.trim();
      const response = await api.get('/api/v1/software-packages', { params });
      const packages = response.data || [];

      const hydrated = await Promise.all(
        packages.map(async (pkg) => {
          try {
            const versionRes = await api.get(`/api/v1/software-packages/${pkg.id}/versions`, {
              params: { limit: 1 },
            });
            return { ...pkg, latestVersion: (versionRes.data || [])[0] || null };
          } catch {
            return { ...pkg, latestVersion: null };
          }
        })
      );

      setProjects(hydrated);
      setError('');
    } catch {
      setProjects([]);
      setError('Failed to load projects. Please refresh.');
    } finally {
      setLoadingProjects(false);
    }
  }, [languageSearch]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      items: projects.filter((project) => project.category === category),
    }));
  }, [projects]);

  const activeGroup = grouped.find((group) => group.category === activeCategory) || grouped[0];
  const totalItems = projects.length;
  const totalPrivate = projects.filter((item) => !item.is_public).length;
  const totalPublic = totalItems - totalPrivate;
  const fieldErrors = useMemo(() => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Project name is required.';
    } else if (form.name.trim().length < 3) {
      errors.name = 'Project name should be at least 3 characters.';
    }

    if (!form.description.trim()) {
      errors.description = 'Description is required.';
    } else if (form.description.trim().length < 15) {
      errors.description = 'Description should be at least 15 characters.';
    }

    if (!form.language.trim()) {
      errors.language = 'Primary language is required.';
    } else if (form.language.trim().length < 2) {
      errors.language = 'Enter a valid language name.';
    }

    if (!form.file) {
      errors.file = 'Package file is required.';
    }

    return errors;
  }, [form]);

  const hasValidationErrors = Object.keys(fieldErrors).length > 0;
  const canSubmitUpload = !hasValidationErrors && !loadingUpload;
  const shouldShowError = (field) => submitAttempted || touched[field];

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (hasValidationErrors) {
      setError('Please fix the highlighted fields and try again.');
      return;
    }

    setLoadingUpload(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('description', form.description);
      payload.append('version', form.version);
      payload.append('category', form.category);
      payload.append('language', form.language);
      payload.append('is_public', String(form.is_public));
      payload.append('file', form.file);

      await api.post('/api/v1/software-packages', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setForm({
        name: '',
        description: '',
        version: '',
        category: 'student projects',
        language: '',
        is_public: true,
        file: null,
      });
      setTouched({});
      setSubmitAttempted(false);
      await loadProjects();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Project upload failed.');
    } finally {
      setLoadingUpload(false);
    }
  };

  const onDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Delete project "${projectName}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/v1/software-packages/${projectId}`);
      await loadProjects();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to delete project.');
    }
  };

  return (
    <div className="tp-workspace">
      <div className="tp-shell">
        <header className="ph-hero">
          <div className="ph-hero-main">
            <span className="ph-eyebrow">Software Repository</span>
            <h1 className="tp-page-title">Project Hub</h1>
            <p className="tp-page-subtitle">
              Manage software packages in one place. Private projects remain view-only for users.
            </p>
            <div className="ph-hero-meta">
              <span className="ph-meta-chip">Total {totalItems}</span>
              <span className="ph-meta-chip">Public {totalPublic}</span>
              <span className="ph-meta-chip">Private {totalPrivate}</span>
            </div>
          </div>
          <div className="ph-search-card ph-hero-tools">
            <label htmlFor="project-language-search">Search by language</label>
            <input
              id="project-language-search"
              className="tp-field"
              placeholder="Python, Java, Dart, C#, Rust..."
              value={languageSearch}
              onChange={(event) => setLanguageSearch(event.target.value)}
            />
            <p className="ph-search-tip">Tip: search uses exact language names for better results.</p>
            <div className="ph-search-actions">
              <button className="tp-btn tp-btn-secondary" type="button" onClick={loadProjects}>Refresh</button>
              {languageSearch && (
                <button className="tp-btn tp-btn-secondary" type="button" onClick={() => setLanguageSearch('')}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="ph-stats">
          <article className="ph-stat-card ph-stat-card-total">
            <span>Repository Size</span>
            <strong>{totalItems}</strong>
          </article>
          <article className="ph-stat-card ph-stat-card-public">
            <span>Public Packages</span>
            <strong>{totalPublic}</strong>
          </article>
          <article className="ph-stat-card ph-stat-card-private">
            <span>Private Packages</span>
            <strong>{totalPrivate}</strong>
          </article>
        </section>

        <section className="ph-layout">
          <aside className="tp-card ph-upload-card">
            <div className="tp-card-head">
              <h2>Upload Project</h2>
              <span className="tp-card-note">zip, tar, gz, rar, 7z, exe, msi, deb, rpm, whl</span>
            </div>

            <form onSubmit={onSubmit} className="ph-upload-form">
              <div className="tp-list">
                <div className="ph-field-group">
                  <label htmlFor="upload-project-name" className="ph-field-label">Project Name</label>
                  <input
                    id="upload-project-name"
                    className={`tp-field ${shouldShowError('name') && fieldErrors.name ? 'ph-field-error' : ''}`}
                    placeholder="e.g. Net Pulse Monitor"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    required
                  />
                  {shouldShowError('name') && fieldErrors.name && <p className="ph-inline-error">{fieldErrors.name}</p>}
                </div>

                <div className="ph-field-group">
                  <label htmlFor="upload-project-description" className="ph-field-label">Description</label>
                  <textarea
                    id="upload-project-description"
                    className={`tp-textarea ${shouldShowError('description') && fieldErrors.description ? 'ph-field-error' : ''}`}
                    placeholder="What does this project do and who is it for?"
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                    required
                  />
                  {shouldShowError('description') && fieldErrors.description ? (
                    <p className="ph-inline-error">{fieldErrors.description}</p>
                  ) : (
                    <p className="ph-field-help">Keep it concise so users can quickly understand the package.</p>
                  )}
                </div>

                <div className="tp-pair">
                  <div className="ph-field-group">
                    <label htmlFor="upload-project-version" className="ph-field-label">Version</label>
                    <input
                      id="upload-project-version"
                      className="tp-field"
                      placeholder="e.g. 1.0.3"
                      value={form.version}
                      onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))}
                    />
                  </div>
                  <div className="ph-field-group">
                    <label htmlFor="upload-project-category" className="ph-field-label">Category</label>
                    <select
                      id="upload-project-category"
                      className="tp-select"
                      value={form.category}
                      onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                    >
                      {CATEGORY_ORDER.map((category) => (
                        <option key={category} value={category}>
                          {CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="tp-pair">
                  <div className="ph-field-group">
                    <label htmlFor="upload-project-language" className="ph-field-label">Primary Language</label>
                    <input
                      id="upload-project-language"
                      className={`tp-field ${shouldShowError('language') && fieldErrors.language ? 'ph-field-error' : ''}`}
                      placeholder="e.g. Python"
                      value={form.language}
                      onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
                      onBlur={() => setTouched((prev) => ({ ...prev, language: true }))}
                      required
                    />
                    {shouldShowError('language') && fieldErrors.language && (
                      <p className="ph-inline-error">{fieldErrors.language}</p>
                    )}
                  </div>
                  <div className="ph-field-group ph-visibility-group">
                    <label className="ph-field-label">Visibility</label>
                    <label className="tp-muted ph-checkbox ph-visibility-toggle">
                      <input
                        type="checkbox"
                        checked={form.is_public}
                        onChange={(event) => setForm((prev) => ({ ...prev, is_public: event.target.checked }))}
                      />
                      <span>{form.is_public ? 'Publicly visible' : 'Private (view-only to users)'}</span>
                    </label>
                  </div>
                </div>

                <div className="ph-field-group">
                  <label htmlFor="upload-project-file" className="ph-field-label">Package File</label>
                  <input
                    id="upload-project-file"
                    className={`tp-field ${shouldShowError('file') && fieldErrors.file ? 'ph-field-error' : ''}`}
                    type="file"
                    accept=".zip,.tar,.gz,.rar,.7z,.exe,.msi,.deb,.rpm,.whl"
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }));
                      setTouched((prev) => ({ ...prev, file: true }));
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, file: true }))}
                    required
                  />
                  {shouldShowError('file') && fieldErrors.file ? (
                    <p className="ph-inline-error">{fieldErrors.file}</p>
                  ) : (
                    <p className="ph-field-help">
                      {form.file ? `Selected: ${form.file.name}` : 'No file selected yet.'}
                    </p>
                  )}
                </div>

                <button className="tp-btn tp-btn-primary ph-upload-submit" disabled={!canSubmitUpload}>
                  {loadingUpload ? 'Uploading...' : 'Upload Project'}
                </button>
              </div>
            </form>
            {error && <div className="tp-error">{error}</div>}
          </aside>

          <div className="tp-card ph-library-card">
            <div className="tp-card-head">
              <h2>Projects Library</h2>
              <span className="tp-card-note">Select a category to view package details</span>
            </div>

            <div className="ph-library-layout">
              <nav className="ph-category-nav">
                {grouped.map((group) => (
                  <button
                    key={group.category}
                    type="button"
                    className={`ph-category-btn ${group.category === activeCategory ? 'active' : ''}`}
                    onClick={() => setActiveCategory(group.category)}
                  >
                    <span>{group.label}</span>
                    <strong>{group.items.length}</strong>
                  </button>
                ))}
              </nav>

              <section className="ph-items-panel">
                <header className="ph-items-head">
                  <div>
                    <h3>{activeGroup?.label || 'Projects'}</h3>
                    <p>{pluralize(activeGroup?.items.length || 0, 'project', 'projects')}</p>
                  </div>
                </header>

                {loadingProjects && <p className="tp-muted">Loading projects...</p>}
                {!loadingProjects && activeGroup?.items.length === 0 && (
                  <div className="ph-empty-state">
                    <h3>{activeGroup?.label || 'Category'}</h3>
                    <p>No projects found in this category for the current filter.</p>
                  </div>
                )}

                {!loadingProjects && activeGroup?.items.length > 0 && (
                  <div className="tp-list">
                    {activeGroup.items.map((item) => (
                      <article key={item.id} className="tp-list-item ph-item-card">
                        <div className="tp-card-head ph-item-head">
                          <strong>{item.name}</strong>
                          <span className={`tp-badge ${item.is_public ? 'tp-badge-public' : 'tp-badge-private'}`}>
                            {item.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>

                        <p className="tp-muted">{item.description}</p>
                        <p className="tp-muted ph-item-meta">
                          <span>Language {item.language || 'N/A'}</span>
                          <span>Version {item.latestVersion?.version || item.latest_version || 'N/A'}</span>
                          <span>{humanSize(item.latestVersion?.size_bytes)}</span>
                        </p>

                        {!item.is_public && <div className="ph-private-note">Private software is view-only. Download is disabled.</div>}

                        <div className="tp-actions ph-item-actions">
                          {item.latestVersion && item.is_public && (
                            <a
                              className="tp-btn tp-btn-primary"
                              href={`${API_BASE_URL || ''}/api/v1/software-packages/${item.id}/versions/${item.latestVersion.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download
                            </a>
                          )}
                          {user && Number(user.id) === Number(item.owner_id) && (
                            <button
                              className="tp-btn tp-btn-secondary"
                              type="button"
                              onClick={() => onDeleteProject(item.id, item.name)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
