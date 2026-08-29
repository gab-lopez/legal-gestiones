import { useState } from 'react';
import { UserPlus, Trash2, ChevronDown, ChevronUp, Upload, X, FileText } from 'lucide-react';

const parteVacia = () => ({
  id: Date.now(),
  rol: '',
  tipo: '',
  nombre: '',
  identificacion: '',
  documentos: {},
  expandida: true,
});

export default function PartesInvolucradas({ roles, docsIndividual, docsJuridica, partes, onChange }) {

  const agregarParte = () => onChange([...partes, parteVacia()]);

  const eliminarParte = (id) => onChange(partes.filter(p => p.id !== id));

  const actualizarParte = (id, campo, valor) => {
    onChange(partes.map(p => {
      if (p.id !== id) return p;
      const actualizada = { ...p, [campo]: valor };
      if (campo === 'tipo') actualizada.documentos = {};
      return actualizada;
    }));
  };

  const toggleExpandir = (id) => {
    onChange(partes.map(p => p.id === id ? { ...p, expandida: !p.expandida } : p));
  };

  const handleArchivo = (parteId, docNombre, archivo) => {
    onChange(partes.map(p => {
      if (p.id !== parteId) return p;
      return { ...p, documentos: { ...p.documentos, [docNombre]: archivo } };
    }));
  };

  const quitarArchivo = (parteId, docNombre) => {
    onChange(partes.map(p => {
      if (p.id !== parteId) return p;
      const docs = { ...p.documentos };
      delete docs[docNombre];
      return { ...p, documentos: docs };
    }));
  };

  const docsRequeridos = (tipo) => {
    if (tipo === 'Persona individual') return docsIndividual;
    if (tipo === 'Persona jurídica')  return docsJuridica;
    return [];
  };

  const resumenParte = (p) => {
    if (!p.rol && !p.nombre) return 'Nueva parte';
    return [p.rol, p.nombre].filter(Boolean).join(' — ');
  };

  return (
    <div>
      {partes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--gris-texto)', fontSize: '0.88rem', background: 'var(--gris-fondo)', borderRadius: 'var(--radio)', border: '1px dashed var(--gris-borde)' }}>
          No hay partes agregadas. Haz clic en "+ Agregar parte" para comenzar.
        </div>
      )}

      {partes.map((parte, idx) => (
        <div key={parte.id} style={{ border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio-lg)', marginBottom: '1rem', overflow: 'hidden' }}>

          {/* Header de la parte */}
          <div style={{ background: parte.expandida ? 'var(--azul)' : 'var(--gris-suave)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => toggleExpandir(parte.id)}>
            <div style={{ background: parte.expandida ? 'rgba(255,255,255,0.15)' : 'var(--azul)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{idx + 1}</span>
            </div>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: parte.expandida ? '#fff' : 'var(--azul)', fontFamily: "'Montserrat', sans-serif" }}>
              {resumenParte(parte)}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={e => { e.stopPropagation(); eliminarParte(parte.id); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex' }}>
                <Trash2 size={15} color={parte.expandida ? 'rgba(255,255,255,0.7)' : '#dc2626'} />
              </button>
              {parte.expandida
                ? <ChevronUp  size={16} color="rgba(255,255,255,0.8)" />
                : <ChevronDown size={16} color="var(--gris-texto)" />}
            </div>
          </div>

          {/* Cuerpo de la parte */}
          {parte.expandida && (
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

                {/* Rol */}
                <div>
                  <label style={labelStyle}>Rol <span style={{ color: 'var(--rojo)' }}>*</span></label>
                  <select style={inputStyle} value={parte.rol}
                    onChange={e => actualizarParte(parte.id, 'rol', e.target.value)}>
                    <option value="">Selecciona rol...</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label style={labelStyle}>Tipo <span style={{ color: 'var(--rojo)' }}>*</span></label>
                  <select style={inputStyle} value={parte.tipo}
                    onChange={e => actualizarParte(parte.id, 'tipo', e.target.value)}>
                    <option value="">Selecciona tipo...</option>
                    <option value="Persona individual">Persona individual</option>
                    <option value="Persona jurídica">Persona jurídica</option>
                  </select>
                </div>

                {/* Nombre */}
                <div>
                  <label style={labelStyle}>Nombre completo / Razón social <span style={{ color: 'var(--rojo)' }}>*</span></label>
                  <input type="text" style={inputStyle} value={parte.nombre}
                    placeholder="Nombre o razón social..."
                    onChange={e => actualizarParte(parte.id, 'nombre', e.target.value)} />
                </div>

                {/* Identificación */}
                <div>
                  <label style={labelStyle}>No. Identificación <span style={{ color: 'var(--rojo)' }}>*</span></label>
                  <input type="text" style={inputStyle} value={parte.identificacion}
                    placeholder="DPI, NIT o No. de registro..."
                    onChange={e => actualizarParte(parte.id, 'identificacion', e.target.value)} />
                </div>
              </div>

              {/* Documentos requeridos */}
              {parte.tipo && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gris-borde)' }}>
                    Documentos requeridos
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {docsRequeridos(parte.tipo).map(doc => (
                      <DocumentoUpload
                        key={doc}
                        nombre={doc}
                        archivo={parte.documentos[doc]}
                        onSubir={archivo => handleArchivo(parte.id, doc, archivo)}
                        onQuitar={() => quitarArchivo(parte.id, doc)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Botón agregar */}
      <button onClick={agregarParte}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '2px dashed var(--azul-claro)', color: 'var(--azul-claro)', borderRadius: 'var(--radio-lg)', padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <UserPlus size={16} />
        Agregar parte
      </button>
    </div>
  );
}

function DocumentoUpload({ nombre, archivo, onSubir, onQuitar }) {
  const handleChange = (e) => {
    if (e.target.files[0]) onSubir(e.target.files[0]);
  };

  return (
    <div style={{ border: `1px solid ${archivo ? '#86efac' : 'var(--gris-borde)'}`, borderRadius: 'var(--radio)', padding: '0.65rem 0.75rem', background: archivo ? '#f0fdf4' : '#fafbfc' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--azul)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <FileText size={12} />
        {nombre}
      </div>

      {archivo ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#15803d', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {archivo.name}
          </span>
          <button onClick={onQuitar} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
            <X size={13} color="#dc2626" />
          </button>
        </div>
      ) : (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--azul-claro)' }}>
          <Upload size={12} />
          <span>Subir archivo</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} style={{ display: 'none' }} />
        </label>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" };
const inputStyle  = { width: '100%', padding: '0.6rem 0.75rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.88rem', color: 'var(--azul)', background: '#fff', outline: 'none', boxSizing: 'border-box' };