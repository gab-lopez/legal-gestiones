import { useEffect, useState } from 'react';
import { tiposSolicitudService } from '../../services/api';

export default function AdminTipos() {
  const [tipos, setTipos] = useState([]);

  useEffect(() => {
    tiposSolicitudService.getAll().then(r => setTipos(r.data));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tipos de solicitud y SLAs</h2>
        <p style={{ color: 'var(--gris-texto)', fontSize: '0.88rem', marginTop: '2px' }}>Tiempos de resolución y alertas por tipo de documento</p>
      </div>
      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--azul)' }}>
              {['Documento', 'Categoría', 'Resolución', 'Alerta previa'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tipos.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--gris-borde)', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}><strong>{t.nombre}</strong></td>
                <td style={{ ...td, color: 'var(--gris-texto)' }}>{t.categoria || '—'}</td>
                <td style={td}>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
                    {t.horasResolucion}h
                  </span>
                </td>
                <td style={td}>
                  <span style={{ background: '#fef9c3', color: '#a16207', padding: '2px 8px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
                    {t.horasAlertaPrevia}h antes
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