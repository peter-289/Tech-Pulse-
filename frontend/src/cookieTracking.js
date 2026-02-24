import api from './API_Wrapper';

const CONSENT_COOKIE = 'tp_cookie_consent';
const CLIENT_ID_COOKIE = 'tp_client_id';
const ACCEPTED = 'accepted';
const DECLINED = 'declined';
const COOKIE_DAYS = 180;

function getCookieValue(name) {
  const encoded = encodeURIComponent(name) + '=';
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(encoded)) {
      return decodeURIComponent(trimmed.slice(encoded.length));
    }
  }
  return null;
}

function setCookieValue(name, value, days = COOKIE_DAYS) {
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expiresAt}; path=/; SameSite=Lax`;
}

function createClientId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `cid_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`;
}

export function getCookieConsent() {
  return getCookieValue(CONSENT_COOKIE);
}

export function hasAcceptedCookieConsent() {
  return getCookieConsent() === ACCEPTED;
}

export function getOrCreateTrackingClientId() {
  const existing = getCookieValue(CLIENT_ID_COOKIE);
  if (existing) return existing;
  const generated = createClientId();
  setCookieValue(CLIENT_ID_COOKIE, generated);
  return generated;
}

export function setCookieConsent(status) {
  if (status !== ACCEPTED && status !== DECLINED) return;
  setCookieValue(CONSENT_COOKIE, status);
  if (status === ACCEPTED) {
    getOrCreateTrackingClientId();
  }
}

export async function trackConsentDecision(action, page = '') {
  if (action !== ACCEPTED && action !== DECLINED) return;
  const clientId = getOrCreateTrackingClientId();
  await api.post('/api/v1/analytics/events', {
    event_type: 'cookie_consent',
    action,
    page,
    client_id: clientId,
    metadata: {
      consent_status: action,
    },
  });
}

export async function trackUserActivity(action, page = '', metadata = {}) {
  if (!hasAcceptedCookieConsent()) return;
  const clientId = getOrCreateTrackingClientId();
  await api.post('/api/v1/analytics/events', {
    event_type: 'user_activity',
    action,
    page,
    client_id: clientId,
    metadata,
  });
}
