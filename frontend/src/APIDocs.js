import React from 'react';
import './Workspace.css';

const endpoints = [
  { method: 'POST', path: '/api/v1/support-chat/messages', desc: 'Send a support message to AI assistant.' },
  { method: 'GET', path: '/api/v1/support-chat/messages', desc: 'List support chat history for current user.' },
  { method: 'POST', path: '/api/v1/software-packages', desc: 'Upload a software package via streaming multipart request.' },
  { method: 'GET', path: '/api/v1/software-packages', desc: 'List public packages and your own private packages.' },
  { method: 'GET', path: '/api/v1/software-packages/{package_id}/versions', desc: 'List versions for a package.' },
  { method: 'GET', path: '/api/v1/software-packages/{package_id}/versions/{version_id}/download', desc: 'Download a specific version (supports Range).' }
];

export default function APIDocs() {
  return (
    <div className="tp-workspace">
      <div className="tp-shell">
      <h1 className="tp-page-title">API Documentation</h1>
      <p className="tp-page-subtitle">Authenticated endpoints available to signed-in users.</p>
      <div className="tp-list" style={{ marginTop: '1rem' }}>
        {endpoints.map((ep) => (
          <article key={ep.path} className="tp-list-item">
            <div className="tp-card-head"><span className="tp-badge">{ep.method}</span> <code>{ep.path}</code></div>
            <div className="tp-muted">{ep.desc}</div>
          </article>
        ))}
      </div>
    </div>
    </div>
  );
}
