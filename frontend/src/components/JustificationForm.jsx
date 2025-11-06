// frontend/src/components/JustificationForm.jsx
import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function JustificationForm() {
  const [asignaturas, setAsignaturas] = useState([]);
  const [form, setForm] = useState({
    asignatura: '',
    fecha_ausencia_inicio: '',
    fecha_ausencia_fin: '',
    motivo: '',
    descripcion_detallada: '',
  });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(()=> {
    async function load() {
      try {
        const res = await axios.get('/asignaturas/');
        setAsignaturas(res.data);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // si tu endpoint espera multipart con archivo, monta FormData
      const data = new FormData();
      data.append('asignatura', form.asignatura);
      data.append('fecha_ausencia_inicio', form.fecha_ausencia_inicio);
      data.append('fecha_ausencia_fin', form.fecha_ausencia_fin);
      data.append('motivo', form.motivo);
      data.append('descripcion_detallada', form.descripcion_detallada);
      if (file) data.append('archivo_principal', file);
      const res = await axios.post('/justificaciones/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg('Justificación creada correctamente');
      setForm({asignatura:'',fecha_ausencia_inicio:'',fecha_ausencia_fin:'',motivo:'',descripcion_detallada:''});
      setFile(null);
    } catch (err) {
      console.error(err);
      setMsg('Error al crear justificación');
    }
  };

  return (
    <div style={{maxWidth:720, margin:'1rem auto'}}>
      <h3>Registrar Justificación</h3>
      {msg && <div>{msg}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div>
          <label>Asignatura</label><br/>
          <select name="asignatura" value={form.asignatura} onChange={handleChange} required>
            <option value="">-- Seleccione --</option>
            {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label>Fecha inicio</label><br/>
          <input type="date" name="fecha_ausencia_inicio" value={form.fecha_ausencia_inicio} onChange={handleChange} required />
        </div>
        <div>
          <label>Fecha fin</label><br/>
          <input type="date" name="fecha_ausencia_fin" value={form.fecha_ausencia_fin} onChange={handleChange} required />
        </div>
        <div>
          <label>Motivo</label><br/>
          <select name="motivo" value={form.motivo} onChange={handleChange} required>
            <option value="">-- Seleccione --</option>
            <option value="1">Médica</option>
            <option value="2">Deportiva</option>
            <option value="3">Otro</option>
          </select>
        </div>
        <div>
          <label>Descripción</label><br/>
          <textarea name="descripcion_detallada" value={form.descripcion_detallada} onChange={handleChange} rows={3} />
        </div>
        <div>
          <label>Documento (pdf/jpg/png) <small>(opcional)</small></label><br/>
          <input type="file" onChange={e => setFile(e.target.files[0])} />
        </div>
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}
