import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from './API_Wrapper';
import './SupportChatPage.css';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SupportChatPage({ isOpen, onOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messageFeedRef = useRef(null);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/support-chat/messages');
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const feed = messageFeedRef.current;
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }, [history, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const transcriptRows = useMemo(
    () =>
      history.flatMap((entry) => [
        {
          key: `${entry.id}-user`,
          role: 'user',
          text: entry.user_message,
          timestamp: formatTime(entry.created_at),
        },
        {
          key: `${entry.id}-assistant`,
          role: 'assistant',
          text: entry.assistant_message,
          timestamp: formatTime(entry.created_at),
        },
      ]),
    [history]
  );

  const onSend = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      await api.post('/api/v1/support-chat/messages', { message });
      setMessage('');
      await loadHistory();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="tp-chat-launcher" onClick={onOpen} type="button" aria-label="Open AI assistant chat">
        <span className="tp-chat-launcher-icon">AI</span>
        <span className="tp-chat-launcher-text">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="tp-chat-overlay" onMouseDown={onClose} role="presentation">
      <section
        className="tp-chat-window"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant chat window"
      >
        <header className="tp-chat-header">
          <div>
            <h2>Tech Pulse Assistant</h2>
            <p>Online now</p>
          </div>
          <div className="tp-chat-header-actions">
            <button className="tp-chat-icon-btn" type="button" onClick={loadHistory} disabled={loading}>
              {loading ? '...' : 'Refresh'}
            </button>
            <button className="tp-chat-icon-btn" type="button" onClick={onClose} aria-label="Close chat">
              Close
            </button>
          </div>
        </header>

        <div className="tp-chat-feed" ref={messageFeedRef}>
          {transcriptRows.length === 0 && (
            <div className="tp-chat-empty">
              Start a conversation with the AI assistant. Ask about bugs, setup, or account issues.
            </div>
          )}
          {transcriptRows.map((row) => (
            <article
              key={row.key}
              className={`tp-chat-row ${row.role === 'user' ? 'tp-chat-row-user' : 'tp-chat-row-assistant'}`}
            >
              <div className={`tp-chat-bubble ${row.role === 'user' ? 'tp-chat-bubble-user' : 'tp-chat-bubble-assistant'}`}>
                <p>{row.text}</p>
                <time>{row.timestamp}</time>
              </div>
            </article>
          ))}
        </div>

        <form className="tp-chat-compose" onSubmit={onSend}>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="tp-chat-input"
          />
          <button className="tp-chat-send-btn" type="submit" disabled={sending || !message.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        {error && <div className="tp-chat-error">{error}</div>}
      </section>
    </div>
  );
}
