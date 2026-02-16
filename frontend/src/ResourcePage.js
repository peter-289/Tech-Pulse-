import React, { useEffect, useState } from 'react';
import api from './API_Wrapper';

export default function ResourcePage({ slug, onBack }){
  const [resource, setResource] = useState(null);
  const [error, setError] = useState(null);

  useEffect(()=>{
    async function load(){
      try{
        const res = await api.get(`/api/v1/resources/${encodeURIComponent(slug)}`);
        setResource(res.data);
      }catch(err){
        setError(err.response?.data?.detail || 'Failed to load');
      }
    }
    if (slug) load();
  }, [slug]);

  if (!slug) return <div style={{padding:24}}>No resource selected.</div>;

  return (
    <div style={{maxWidth:1000,margin:'2rem auto',padding:'0 1rem'}}>
      <button className="tp-btn tp-btn-secondary" onClick={onBack}>Back</button>
      {error && <div style={{color:'red',marginTop:12}}>{error}</div>}
      {resource && (
        <div style={{marginTop:12}}>
          <h1>{resource.title}</h1>
          <div style={{background:'#0b1220',color:'#dbeafe', padding:12, borderRadius:8}}>
            <p style={{whiteSpace:'pre-wrap'}}>{resource.description}</p>
            {resource.url && <a className="tp-link" href={resource.url} target="_blank" rel="noopener noreferrer">Open External</a>}
          </div>
        </div>
      )}
    </div>
  );
}
