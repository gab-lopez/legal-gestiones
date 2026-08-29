import { useEffect, useState } from 'react';
import { proyectosService, empresasService } from '../../services/api';

export default function AdminProyectos() {
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    proyectosService.getAll().then(r => setProyectos(r.data));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Proyectos</h2>
        <p style={{ color: 'var(--gris-texto)', fontSize: '0.88rem', marginTop: '2px' }}>Proyectos inmobiliarios registrados</p>
      </div>
      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--azul)' }}>
              {['Nombre', 'Código', 'Empresa', 'Estado'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proyectos.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--gris-borde)', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}><strong>{p.nombre}</strong></td>
                <td style={{ ...td, color: 'var(--gris-texto)' }}>{p.codigo || '—'}</td>
                <td style={td}>{p.empresa?.nombreLegal || '—'}</td>
                <td style={td}>
                  <span style={{ background: p.activo ? '#dcfce7' : '#fee2e2', color: p.activo ? '#15803d' : '#b91c1c', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
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