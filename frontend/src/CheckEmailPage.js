import React from 'react';

export default function CheckEmailPage({ onBack }){
  return (
    <div style={{maxWidth:560,margin:'2rem auto'}}>
      <h2>Check your inbox</h2>
      <p>We've sent an email with password reset instructions if an account with that email exists. It may take a few minutes to arrive.</p>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="tp-btn tp-btn-secondary" onClick={onBack}>Back to login</button>
      </div>
    </div>
  );
}
