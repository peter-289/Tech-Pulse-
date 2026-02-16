import React, { useEffect, useState } from 'react';
import api from './API_Wrapper';

export default function KnowledgeBase({ onOpenResource }){
  const [entries, setEntries] = useState([]);
  useEffect(()=>{
    async function load(){
      try{
        const res = await api.get('/api/v1/resources', { params: { type: 'knowledge' } });
        setEntries(res.data);
      }catch(err){
        setEntries([]);
      }
    }
    load();
  },[])

  return (
    <div style={{maxWidth:1000,margin:'2rem auto',padding:'0 1rem'}}>
      <h1>Knowledge Base</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {entries.map(e => (
         <div key={e.id} style={{background:'#0b1220',color:'#dbeafe',borderRadius:8,padding:12}}>
           <h3>{e.title}</h3>
           <p style={{whiteSpace:'pre-wrap',fontSize:14}}>{e.description}</p>
           {e.url && <a className="tp-link" href={e.url} target="_blank" rel="noopener noreferrer">Open</a>}
                <div style={{marginTop:8}}>
                  <button className="tp-btn tp-btn-secondary" onClick={() => onOpenResource && onOpenResource(e.slug)}>Open</button>
                </div>
         </div>
       ))}
      </div>
    </div>
  )
}
