import { useEffect, useState } from 'react';
import { empresasService } from '../../services/api';
import { Edit2, Save, X } from 'lucide-react';

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, []);
  const cargar = () => empresasService.getAll().then(r => setEmpresas(r.data));

  const guardar = async () => {
    setGuardando(true);
    try {
      await empresasService.update(editando, form);
      setEditando(null);
      cargar();
    } catch { alert('Error al guardar.'); }
    finally { setGuardando(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Empresas</h2>
        <p style={{ color: 'var(--gris-texto)', fontSize: '0.88rem', marginTop: '2px' }}>Empresas internas y externas del sistema</p>
      </div>
      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--azul)' }}>
              {['Nombre legal', 'NIT', 'Tipo', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empresas.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--gris-borde)', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}>
                  {editando === e.id
                    ? <input value={form.nombreLegal || ''} onChange={ev => setForm({ ...form, nombreLegal: ev.target.value })} style={inputStyle} />
                    : <strong>{e.nombreLegal}</strong>}
                </td>
                <td style={td}>
                  {editando === e.id
                    ? <input value={form.nit || ''} onChange={ev => setForm({ ...form, nit: ev.target.value })} style={inputStyle} />
                    : e.nit || '—'}
                </td>
                <td style={td}>
                  <span style={{ background: e.esInterna ? '#dcfce7' : '#f3f4f6', color: e.esInterna ? '#15803d' : '#374151', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {e.esInterna ? 'Interna' : 'Externa'}
                  </span>
                </td>
                <td style={td}>
                  {editando === e.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={guardar} disabled={guardando} style={btnPrimario}><Save size={12} /> {guardando ? '...' : 'Guardar'}</button>
                      <button onClick={() => setEditando(null)} style={btnSecundario}><X size={12} /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditando(e.id); setForm({ ...e }); }} style={btnSecundario}><Edit2 size={12} /> Editar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const td = { padding: '0.75rem 1rem', fontSize: '0.88rem', color: 'var(--azul)', verticalAlign: 'middle' };
const inputStyle = { padding: '0.4rem 0.6rem', borderRadius: 'var(--radio)', border: '1px solid var(--azul-claro)', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const btnPrimario = { display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' };
const btnSecundario = { display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', color: 'var(--azul-claro)', border: '1px solid var(--azul-claro)', borderRadius: 'var(--radio)', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' };