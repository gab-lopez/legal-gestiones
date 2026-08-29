import { useEffect, useState } from 'react';
import { empresasService, proyectosService, sociedadesService } from '../services/api';

export default function FormularioDinamico({ esquema, valores, onChange }) {
  const [empresas,  setEmpresas]  = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [sociedades, setSociedades] = useState([]);

  useEffect(() => {
    const necesitaEmpresas   = esquema.some(c => c.fuente === 'empresas');
    const necesitaProyectos  = esquema.some(c => c.fuente === 'proyectos');
    const necesitaSociedades = esquema.some(c => c.fuente === 'sociedades');
    if (necesitaEmpresas)   empresasService.getAll().then(r => setEmpresas(r.data));
    if (necesitaProyectos)  proyectosService.getAll().then(r => setProyectos(r.data));
    if (necesitaSociedades) sociedadesService.getAll().then(r => setSociedades(r.data));
  }, [esquema]);

  const handleChange = (nombre, valor) => onChange({ ...valores, [nombre]: valor });

  const opcionesFuente = (fuente) => {
    if (fuente === 'empresas')   return empresas.map(e  => ({ value: e.id,  label: e.nombreLegal }));
    if (fuente === 'proyectos')  return proyectos.map(p => ({ value: p.id,  label: p.nombre }));
    if (fuente === 'sociedades') return sociedades.map(s => ({ value: s.id, label: s.nombreSociedad }));
    return [];
  };

  // Determina si un campo debe mostrarse según su condición
  const debeMostrar = (campo) => {
    if (!campo.condicional) return true;
    return valores[campo.condicional] === campo.valor;
  };

  return (
    <div>
      {esquema.map(campo => {

        // SECCIÓN
        if (campo.tipo === 'seccion') return (
          <div key={campo.nombre} style={{ borderTop: '1px solid var(--gris-borde)', margin: '1.75rem 0 1.25rem', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-11px', left: '0', background: '#fff', paddingRight: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gris-texto)', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {campo.etiqueta}
            </span>
          </div>
        );

        // Campo condicional — no mostrar si no aplica
        if (!debeMostrar(campo)) return null;

        return (
          <div key={`${campo.nombre}_${campo.condicional || ''}`} style={grupo}>
            <label style={labelStyle}>
              {campo.etiqueta}
              {campo.requerido && <span style={{ color: 'var(--rojo)', marginLeft: '3px' }}>*</span>}
            </label>

            {campo.tipo === 'text' && (
              <input type="text" value={valores[campo.nombre] || ''} style={inputStyle}
                placeholder={`Ingresa ${campo.etiqueta.toLowerCase()}...`}
                onChange={e => handleChange(campo.nombre, e.target.value)} />
            )}

            {campo.tipo === 'number' && (
              <input type="number" value={valores[campo.nombre] || ''} style={inputStyle}
                placeholder="0" min="0"
                onChange={e => handleChange(campo.nombre, e.target.value)} />
            )}

            {campo.tipo === 'date' && (
              <input type="date" value={valores[campo.nombre] || ''} style={inputStyle}
                onChange={e => handleChange(campo.nombre, e.target.value)} />
            )}

            {campo.tipo === 'textarea' && (
              <textarea value={valores[campo.nombre] || ''} style={{ ...inputStyle, height: '90px', resize: 'vertical' }}
                placeholder={`Ingresa ${campo.etiqueta.toLowerCase()}...`}
                onChange={e => handleChange(campo.nombre, e.target.value)} />
            )}

            {campo.tipo === 'boolean' && (
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                {['Sí', 'No'].map(op => (
                  <label key={op} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--azul)' }}>
                    <input type="radio" name={campo.nombre} value={op}
                      checked={valores[campo.nombre] === op}
                      onChange={() => handleChange(campo.nombre, op)}
                      style={{ accentColor: 'var(--azul)' }} />
                    {op}
                  </label>
                ))}
              </div>
            )}

            {campo.tipo === 'select' && campo.opciones && (
              <select value={valores[campo.nombre] || ''} style={inputStyle}
                onChange={e => handleChange(campo.nombre, e.target.value)}>
                <option value="">Selecciona...</option>
                {campo.opciones.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            )}

            {campo.tipo === 'select' && campo.fuente && (
              <select value={valores[campo.nombre] || ''} style={inputStyle}
                onChange={e => handleChange(campo.nombre, e.target.value)}>
                <option value="">Selecciona...</option>
                {opcionesFuente(campo.fuente).map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            )}

            {campo.tipo === 'adjuntos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {campo.docs?.map(doc => {
                  const key    = `${campo.nombre}_${doc}`;
                  const archivo = valores[key];
                  return (
                    <div key={doc} style={{ border: `1px solid ${archivo ? '#86efac' : 'var(--gris-borde)'}`, borderRadius: 'var(--radio)', padding: '0.65rem 0.75rem', background: archivo ? '#f0fdf4' : '#fafbfc' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--azul)', marginBottom: '0.4rem' }}>{doc}</div>
                      {archivo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#15803d', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{archivo.name}</span>
                          <button onClick={() => handleChange(key, null)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--rojo)', fontSize: '0.8rem' }}>✕</button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--azul-claro)' }}>
                          ↑ Subir archivo
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => { if (e.target.files[0]) handleChange(key, e.target.files[0]); }}
                            style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const grupo      = { marginBottom: '1.1rem' };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" };
const inputStyle = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.9rem', color: 'var(--azul)', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' };