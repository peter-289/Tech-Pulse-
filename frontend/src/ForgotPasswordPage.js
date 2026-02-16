import React, { useState } from 'react';
import api from './API_Wrapper';
import qs from 'qs';

export default function ForgotPasswordPage({ onBack, onCheckEmail }){
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      const res = await api.post('/api/v1/auth/password-reset/requests', qs.stringify({ email }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      setMessage(res.data.detail || 'If the e-mail is registered, you will receive a reset link.');
      onCheckEmail?.();
    }catch(err){
      setMessage(err.response?.data?.detail || 'Failed to submit.');
    }finally{ setLoading(false); }
  }

  return (
    <div style={{maxWidth:560,margin:'2rem auto'}}>
      <h2>Forgot your password?</h2>
      <p>Enter the email address for your account and we'll send a password reset link.</p>
      <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:8}}>
        <input name="email" type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button type="button" className="tp-btn tp-btn-secondary" onClick={onBack}>Back</button>
          <button className="tp-btn tp-btn-primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
        </div>
      </form>
      {message && (<div style={{marginTop:12}} className="tp-msg">{message}</div>)}
    </div>
  )
}
