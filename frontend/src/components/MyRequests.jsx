// frontend/src/components/MyRequests.jsx
import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function MyRequests() {
  const [items, setItems] = useState([]);

  useEffect(()=> {
    async function load() {
      try {
        const res = await axios.get('/justificaciones/mine/');
        setItems(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div style={{maxWidth:900, margin:'1rem auto'}}>
      <h3>Mis Justificaciones</h3>
      <ul>
        {items.map(j => (
          <li key={j.id}>
            {j.id} - {j.asignatura ? j.asignatura : 'General'} - {j.estado} - {new Date(j.fecha_solicitud).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
