import { useEffect, useState } from 'react';
import { sociedadesService } from '../../services/api';
import { Edit2, Save, X, Plus } from 'lucide-react';

const camposSociedad = [
  { key: 'nombreSociedad',      label: 'Nombre de la sociedad',      requerido: true  },
  { key: 'nombreRepresentante', label: 'Representante legal',         requerido: true  },
  { key: 'cargo',               label: 'Cargo',                       requerido: true  },
  { key: 'profesion',           label: 'Profesión',                   requerido: true  },
  { key: 'estadoCivil',         label: 'Estado civil',                requerido: false },
  { key: 'dpi',                 label: 'DPI del representante',       requerido: true  },
  { key: 'nombreNotario',       label: 'Notario del contrato',        requerido: false },
  { key: 'actaFecha',           label: 'Fecha del acta (en letras)',  requerido: false },
  { key: 'actaNotario',         label: 'Notario del acta',            requerido: false },
  { key: 'registroNumero',      label: 'No. Registro Mercantil',      requerido: false },
  { key: 'registroFolio',       label: 'Folio (Registro Mercantil)',  requerido: false },
  { key: 'registroLibro',       label: 'Libro (Registro Mercantil)',  requerido: false },
  { key: 'banco',               label: 'Banco (razón social)',        requerido: false },
  { key: 'numeroCuenta',        label: 'Número de cuenta',            requerido: false },
];

const formVacio = () => Object.fromEntries(camposSociedad.map(c => [c.key, '']));

export default function AdminSociedades() {
  const [sociedades, setSociedades] = useState([]);
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = () => sociedadesService.getAll().then(r => setSociedades(r.data));

  const iniciarEdicion = (s) => { setCreando(false); setEditando(s.id); setForm({ ...s }); setError(''); };
  const iniciarCreacion = () => { setEditando(null); setCreando(true); setForm(formVacio()); setError(''); };
  const cancelar = () => { setEditando(null); setCreando(false); setForm({}); setError(''); };

  const validar = () => {
    for (const campo of camposSociedad.filter(c => c.requerido)) {
      if (!form[campo.key]) return `El campo "${campo.label}" es obligatorio.`;
    }
    return null;
  };

  const guardar = async () => {
    const err = validar();
    if (err) return setError(err);
    setGuardando(true);
    setError('');
    try {
      if (creando) {
        await sociedadesService.create(form);
        setCreando(false);
      } else {
        await sociedadesService.update(editando, { ...form, id: editando });
        setEditando(null);
      }
      cargar();
    } catch { setError('Error al guardar. Revisa los datos.'); }
    finally { setGuardando(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sociedades arrendantes</h2>
          <p style={{ color: 'var(--gris-texto)', fontSize: '0.88rem', marginTop: '2px' }}>
            Datos del representante legal y registro mercantil de cada sociedad
          </p>
        </div>
        <button onClick={iniciarCreacion}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
          <Plus size={15} /> Nueva sociedad
        </button>
      </div>

      {/* Formulario de nueva sociedad */}
      {creando && (
        <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-md)', overflow: 'hidden', marginBottom: '1rem', border: '2px solid var(--azul-claro)' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gris-borde)', background: '#eff6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" }}>
              Nueva sociedad
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={guardar} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <Save size={13} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={cancelar}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: 'var(--gris-texto)', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <X size={13} /> Cancelar
              </button>
            </div>
          </div>
          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {camposSociedad.map(({ key, label, requerido }) => (
              <div key={key}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: "'Montserrat', sans-serif" }}>
                  {label} {requerido && <span style={{ color: 'var(--rojo)' }}>*</span>}
                </div>
                <input type="text" value={form[key] || ''}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: 'var(--radio)', border: '1px solid var(--azul-claro)', fontSize: '0.85rem', color: 'var(--azul)', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          {error && (
            <div style={{ margin: '0 1.25rem 1rem', padding: '0.65rem 1rem', background: '#fee2e2', borderRadius: 'var(--radio)', color: 'var(--rojo)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Lista de sociedades */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sociedades.map(s => (
          <div key={s.id} style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gris-borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: editando === s.id ? '#eff6ff' : 'var(--gris-fondo)' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" }}>
                {s.nombreSociedad}
              </span>
              {editando === s.id ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={guardar} disabled={guardando}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <Save size={13} /> {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={cancelar}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: 'var(--gris-texto)', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <X size={13} /> Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => iniciarEdicion(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: 'var(--azul-claro)', border: '1px solid var(--azul-claro)', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <Edit2 size={13} /> Editar
                </button>
              )}
            </div>
            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {camposSociedad.filter(c => c.key !== 'nombreSociedad').map(({ key, label }) => (
                <div key={key}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: "'Montserrat', sans-serif" }}>
                    {label}
                  </div>
                  {editando === s.id ? (
                    <input type="text" value={form[key] || ''}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: 'var(--radio)', border: '1px solid var(--azul-claro)', fontSize: '0.85rem', color: 'var(--azul)', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  ) : (
                    <div style={{ fontSize: '0.88rem', color: s[key] ? 'var(--azul)' : 'var(--gris-texto)', fontStyle: s[key] ? 'normal' : 'italic' }}>
                      {s[key] || 'Sin datos'}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {editando === s.id && error && (
              <div style={{ margin: '0 1.25rem 1rem', padding: '0.65rem 1rem', background: '#fee2e2', borderRadius: 'var(--radio)', color: 'var(--rojo)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}