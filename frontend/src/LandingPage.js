import React from 'react';
import { FaCloud, FaCode, FaLock, FaRobot } from 'react-icons/fa';
import './LandingPage.css';

const capabilities = [
  {
    icon: <FaCode />,
    title: 'Product Engineering',
    description: 'Build and ship software faster with a structured, API-first workflow.'
  },
  {
    icon: <FaCloud />,
    title: 'Cloud Native Delivery',
    description: 'Deploy scalable services with observability and operational controls built in.'
  },
  {
    icon: <FaLock />,
    title: 'Security by Default',
    description: 'Protect user data with robust authentication, policy controls, and auditability.'
  },
  {
    icon: <FaRobot />,
    title: 'AI-Assisted Operations',
    description: 'Reduce support load and accelerate issue resolution with intelligent assistants.'
  }
];

const workflowSteps = [
  {
    title: 'Onboard',
    description: 'Create an account, set up your workspace, and define your delivery goals.'
  },
  {
    title: 'Build',
    description: 'Upload and manage software packages, documents, and team-facing resources.'
  },
  {
    title: 'Operate',
    description: 'Use support tools and analytics to maintain quality and response speed.'
  }
];

export default function LandingPage({ onRegister, onLogin }) {
  return (
    <main className="lp-root">
      <section className="lp-hero">
        <div className="lp-hero-content">
          <span className="lp-badge">Tech Pulse Platform</span>
          <h1>Modern software operations with clarity, speed, and control.</h1>
          <p>
            A clean workspace to manage software packages, support workflows, and team resources
            from one professional interface.
          </p>
          <div className="lp-actions">
            <button className="lp-btn lp-btn-primary" type="button" onClick={onRegister}>
              Create Account
            </button>
            <button className="lp-btn lp-btn-secondary" type="button" onClick={onLogin}>
              Sign In
            </button>
          </div>
        </div>
        <div className="lp-metrics">
          <article className="lp-metric-card">
            <span>Unified Workspace</span>
            <strong>All Core Tools</strong>
          </article>
          <article className="lp-metric-card">
            <span>Secure Access</span>
            <strong>Role Aware</strong>
          </article>
          <article className="lp-metric-card">
            <span>Operational Focus</span>
            <strong>Production Ready</strong>
          </article>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2>Core Capabilities</h2>
          <p>Designed for teams that need a reliable, maintainable platform.</p>
        </div>
        <div className="lp-capability-grid">
          {capabilities.map((capability) => (
            <article key={capability.title} className="lp-capability-card">
              <div className="lp-capability-icon">{capability.icon}</div>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2>How It Works</h2>
          <p>Simple flow with clear ownership at each stage.</p>
        </div>
        <div className="lp-steps">
          {workflowSteps.map((step, index) => (
            <article key={step.title} className="lp-step-card">
              <span className="lp-step-index">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-cta">
        <h2>Start with a cleaner software workflow.</h2>
        <p>Sign up now and move your team onto a more professional operating model.</p>
        <div className="lp-actions">
          <button className="lp-btn lp-btn-primary" type="button" onClick={onRegister}>
            Get Started
          </button>
          <button className="lp-btn lp-btn-secondary" type="button" onClick={onLogin}>
            I Already Have an Account
          </button>
        </div>
      </section>

      <footer className="lp-footer">
        <span>Tech Pulse</span>
        <span>{new Date().getFullYear()} All rights reserved.</span>
      </footer>
    </main>
  );
}
