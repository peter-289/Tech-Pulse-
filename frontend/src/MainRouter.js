import React, { useEffect, useState } from 'react';
import LandingPage from './LandingPage';
import RegistrationPage from './RegistrationPage';
import ResourcesPage from './ResourcesPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';
import ResourcePage from './ResourcePage';
import ForgotPasswordPage from './ForgotPasswordPage';
import CheckEmailPage from './CheckEmailPage';
import APIDocs from './APIDocs';
import KnowledgeBase from './KnowledgeBase';
import SupportCenter from './SupportCenter';
import ProductUpdates from './ProductUpdates';
import SupportChatPage from './SupportChatPage';
import ProjectHubPage from './ProjectHubPage';
import Header from './components/Header';
import api from './API_Wrapper';
import { trackUserActivity } from './cookieTracking';

function MainRouter() {
  const resolveInitialPage = () => {
    const search = new URLSearchParams(window.location.search);
    const fromQuery = search.get('page');
    const allowed = new Set([
      'landing',
      'register',
      'forgot_password',
      'check_email',
      'login',
    ]);
    return allowed.has(fromQuery) ? fromQuery : 'landing';
  };

  const [page, setPage] = useState(resolveInitialPage);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedResourceSlug, setSelectedResourceSlug] = useState(null);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);

  // Navigation handler
  const goTo = (target) => () => setPage(target);
  const navigate = (target) => {
    if (isLoggedIn) {
      trackUserActivity('navigate', page, { target }).catch(() => {});
    }
    if (target === 'support_ai' && isLoggedIn) {
      setIsSupportChatOpen(true);
      return;
    }
    setPage(target);
  };

  // Simulate login success
  const handleLogin = async () => {
    setIsLoggedIn(true);
    // Fetch the profile (server sets cookies in the login response)
    let profile = null;
    try {
      const res = await api.get('/api/v1/users/me');
      profile = res.data;
      setUser(profile);
    } catch (err) {
      profile = null;
      setUser(null);
    }

    // Role based redirect: admin users go to admin dashboard
    if (profile && profile.role && String(profile.role).toLowerCase() === 'admin') {
      setPage('admin');
    } else {
      setPage('resources');
    }
  };
  // Simulate logout
  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // ignore network/server errors on logout
    }
    setIsLoggedIn(false);
    setUser(null);
    setIsSupportChatOpen(false);
    setPage('landing');
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    trackUserActivity('page_view', page).catch(() => {});
  }, [isLoggedIn, page]);

  const openResourceDetails = (slug, sourcePage) => {
    if (isLoggedIn) {
      trackUserActivity('open_resource_details', sourcePage, { slug }).catch(() => {});
    }
    setSelectedResourceSlug(slug);
    setPage('resource_details');
  };

  // Pass navigation as props to children
  return (
    <div className="app-root">
      <Header onNavigate={navigate} user={user} onLogout={handleLogout} activePage={page} />
      {page === 'landing' && (
        <LandingPage 
          onRegister={goTo('register')} 
          onLogin={goTo('login')} 
        />
      )}
      {page === 'register' && (
        <RegistrationPage onBack={goTo('landing')} />
      )}
      {page === 'forgot_password' && (
        <ForgotPasswordPage onBack={goTo('login')} onCheckEmail={goTo('check_email')} />
      )}
      {page === 'check_email' && (
        <CheckEmailPage onBack={goTo('login')} />
      )}
      {page === 'login' && (
        <LoginPage onBack={goTo('landing')} onLogin={handleLogin} onForgot={goTo('forgot_password')} />
      )}
      {page === 'resources' && isLoggedIn && (
        <ResourcesPage
          onLogout={handleLogout}
          user={user}
          onAdmin={goTo('admin')}
          onNavigate={navigate}
          onOpenResource={(slug) => openResourceDetails(slug, 'resources')}
        />
      )}
      {page === 'api_docs' && isLoggedIn && (
        <APIDocs user={user} onOpenResource={(slug) => openResourceDetails(slug, 'api_docs')} />
      )}
      {page === 'kb' && isLoggedIn && (
        <KnowledgeBase user={user} onOpenResource={(slug) => openResourceDetails(slug, 'kb')} />
      )}
      {page === 'support' && isLoggedIn && (
        <SupportCenter user={user} onOpenResource={(slug) => openResourceDetails(slug, 'support')} />
      )}
      {page === 'updates' && isLoggedIn && (
        <ProductUpdates user={user} onOpenResource={(slug) => openResourceDetails(slug, 'updates')} />
      )}
      {page === 'projects' && isLoggedIn && <ProjectHubPage user={user} />}
            {page === 'resource_details' && isLoggedIn && selectedResourceSlug && (
              <ResourcePage slug={selectedResourceSlug} onBack={goTo('resources')} />
            )}
      {page === 'admin' && isLoggedIn && user && String(user.role).toLowerCase() === 'admin' && (
        <AdminPage onBack={goTo('resources')} />
      )}
      {isLoggedIn && (
        <SupportChatPage
          user={user}
          isOpen={isSupportChatOpen}
          onOpen={() => {
            trackUserActivity('support_chat_open', page).catch(() => {});
            setIsSupportChatOpen(true);
          }}
          onClose={() => {
            trackUserActivity('support_chat_close', page).catch(() => {});
            setIsSupportChatOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default MainRouter;
