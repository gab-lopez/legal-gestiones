import { useEffect, useState } from 'react';
import { unidadesService, unidadesNegocioService, areasAdminService, usuariosMoverService } from '../../services/api';
import { ChevronDown, ChevronRight, Users, Building2, Plus, Edit2, Save, X, Trash2, ArrowRightLeft } from 'lucide-react';

export default function AdminUnidades() {
  const [unidades, setUnidades]           = useState([]);
  const [expandidas, setExpandidas]       = useState({});
  const [expandidasArea, setExpandidasArea] = useState({});

  // Estados para CRUD unidades
  const [editandoUnidad, setEditandoUnidad] = useState(null);
  const [creandoUnidad, setCreandoUnidad]   = useState(false);
  const [formUnidad, setFormUnidad]         = useState({ nombre: '' });

  // Estados para CRUD áreas
  const [editandoArea, setEditandoArea]     = useState(null);
  const [creandoArea, setCreandoArea]       = useState(null); // unidadId
  const [formArea, setFormArea]             = useState({ nombre: '' });

  // Estado para mover usuario
  const [moviendoUsuario, setMoviendoUsuario] = useState(null); // { usuario, areaActualId }
  const [areaDestino, setAreaDestino]         = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = () => unidadesService.getConAreas().then(r => {
    setUnidades(r.data);
    const exp = {};
    r.data.forEach(u => exp[u.id] = true);
    setExpandidas(exp);
  });

  const toggleUnidad = (id) => setExpandidas(p => ({ ...p, [id]: !p[id] }));
  const toggleArea   = (id) => setExpandidasArea(p => ({ ...p, [id]: !p[id] }));
  const totalUsuarios = (u) => u.areas.reduce((s, a) => s + a.usuarios.length, 0);

  // Todas las áreas para el selector de mover
  const todasLasAreas = unidades.flatMap(u => u.areas.map(a => ({ ...a, unidad: u.nombre })));

  // CRUD Unidades
  const guardarUnidad = async () => {
    if (!formUnidad.nombre.trim()) return setError('El nombre es obligatorio.');
    setGuardando(true); setError('');
    try {
      if (creandoUnidad) {
        await unidadesNegocioService.create(formUnidad);
        setCreandoUnidad(false);
      } else {
        await unidadesNegocioService.update(editandoUnidad, { id: editandoUnidad, ...formUnidad });
        setEditandoUnidad(null);
      }
      setFormUnidad({ nombre: '' });
      cargar();
    } catch { setError('Error al guardar.'); }
    finally { setGuardando(false); }
  };

  const desactivarUnidad = async (id) => {
    if (!confirm('¿Desactivar esta unidad?')) return;
    await unidadesNegocioService.desactivar(id);
    cargar();
  };

  // CRUD Áreas
  const guardarArea = async () => {
    if (!formArea.nombre.trim()) return setError('El nombre del departamento es obligatorio.');
    setGuardando(true); setError('');
    try {
      if (creandoArea) {
        await areasAdminService.create({ nombre: formArea.nombre, unidadNegocioId: creandoArea, activo: true });
        setCreandoArea(null);
      } else {
        const area = todasLasAreas.find(a => a.id === editandoArea);
        await areasAdminService.update(editandoArea, { id: editandoArea, nombre: formArea.nombre, unidadNegocioId: area.unidadNegocioId ?? editandoArea, activo: true });
        setEditandoArea(null);
      }
      setFormArea({ nombre: '' });
      cargar();
    } catch { setError('Error al guardar.'); }
    finally { setGuardando(false); }
  };

  const desactivarArea = async (id) => {
    if (!confirm('¿Desactivar este departamento?')) return;
    await areasAdminService.desactivar(id);
    cargar();
  };

  // Mover usuario
  const moverUsuario = async () => {
    if (!areaDestino) return setError('Selecciona un departamento destino.');
    setGuardando(true); setError('');
    try {
      await usuariosMoverService.moverArea(moviendoUsuario.usuario.id, parseInt(areaDestino));
      setMoviendoUsuario(null);
      setAreaDestino('');
      cargar();
    } catch { setError('Error al mover usuario.'); }
    finally { setGuardando(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Unidades de negocio</h2>
          <p style={{ color: 'var(--gris-texto)', fontSize: '0.88rem', marginTop: '2px' }}>Estructura organizacional — unidades, departamentos y usuarios</p>
        </div>
        <button onClick={() => { setCreandoUnidad(true); setFormUnidad({ nombre: '' }); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
          <Plus size={15} /> Nueva unidad
        </button>
      </div>

      {/* Modal mover usuario */}
      {moviendoUsuario && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radio-lg)', padding: '1.5rem', width: '400px', boxShadow: 'var(--sombra-lg)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--azul)' }}>
              Mover usuario
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--gris-texto)', marginBottom: '1rem' }}>
              <strong>{moviendoUsuario.usuario.nombres} {moviendoUsuario.usuario.apellidos}</strong> será movido a:
            </p>
            <select value={areaDestino} onChange={e => setAreaDestino(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' }}>
              <option value="">Selecciona departamento...</option>
              {unidades.map(u => (
                <optgroup key={u.id} label={u.nombre}>
                  {u.areas.map(a => (
                    <option key={a.id} value={a.id} disabled={a.id === moviendoUsuario.areaActualId}>
                      {a.nombre} {a.id === moviendoUsuario.areaActualId ? '(actual)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {error && <p style={{ color: 'var(--rojo)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setMoviendoUsuario(null); setAreaDestino(''); setError(''); }}
                style={{ background: 'transparent', border: '1px solid var(--gris-borde)', color: 'var(--gris-texto)', borderRadius: 'var(--radio)', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={moverUsuario} disabled={guardando}
                style={{ background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                {guardando ? 'Moviendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario nueva unidad */}
      {creandoUnidad && (
        <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-md)', padding: '1.25rem', marginBottom: '1rem', border: '2px solid var(--azul-claro)', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nombre de la unidad <span style={{ color: 'var(--rojo)' }}>*</span></label>
            <input type="text" value={formUnidad.nombre} onChange={e => setFormUnidad({ nombre: e.target.value })}
              placeholder="Ej: Marketing" style={inputStyle} autoFocus />
          </div>
          <button onClick={guardarUnidad} disabled={guardando} style={btnPrimario}><Save size={13} /> {guardando ? '...' : 'Guardar'}</button>
          <button onClick={() => { setCreandoUnidad(false); setError(''); }} style={btnSecundario}><X size={13} /></button>
        </div>
      )}

      {error && !moviendoUsuario && (
        <div style={{ padding: '0.65rem 1rem', background: '#fee2e2', borderRadius: 'var(--radio)', color: 'var(--rojo)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
      )}

      {/* Lista de unidades */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {unidades.map(u => (
          <div key={u.id} style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>

            {/* Header unidad */}
            <div style={{ padding: '1rem 1.25rem', background: 'var(--azul)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div onClick={() => toggleUnidad(u.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, cursor: 'pointer' }}>
                {expandidas[u.id] ? <ChevronDown size={16} color="rgba(255,255,255,0.7)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.7)" />}
                <Building2 size={16} color="rgba(255,255,255,0.8)" />
                {editandoUnidad === u.id ? (
                  <input value={formUnidad.nombre} onChange={e => setFormUnidad({ nombre: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    style={{ ...inputStyle, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', flex: 1 }} autoFocus />
                ) : (
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem', color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>{u.nombre}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>{u.areas.length} depts.</span>
                <span style={{ color: '#efcc0b', fontWeight: 600, fontSize: '0.78rem' }}>{totalUsuarios(u)} usuarios</span>
                {editandoUnidad === u.id ? (
                  <>
                    <button onClick={guardarUnidad} disabled={guardando} style={{ ...btnPrimario, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>
                      <Save size={12} /> {guardando ? '...' : 'Guardar'}
                    </button>
                    <button onClick={() => { setEditandoUnidad(null); setError(''); }} style={{ ...btnSecundario, border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}>
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditandoUnidad(u.id); setFormUnidad({ nombre: u.nombre }); setError(''); }}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', borderRadius: 'var(--radio)', padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Edit2 size={11} /> Editar
                    </button>
                    <button onClick={() => desactivarUnidad(u.id)}
                      style={{ background: 'transparent', border: '1px solid rgba(255,100,100,0.4)', color: 'rgba(255,150,150,0.9)', borderRadius: 'var(--radio)', padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Trash2 size={11} /> Desactivar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Áreas */}
            {expandidas[u.id] && (
              <div style={{ padding: '0.75rem 1rem' }}>

                {/* Botón agregar departamento */}
                {creandoArea === u.id ? (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem', padding: '0.75rem', background: '#eff6ff', borderRadius: 'var(--radio)', border: '1px solid var(--azul-claro)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Nombre del departamento <span style={{ color: 'var(--rojo)' }}>*</span></label>
                      <input type="text" value={formArea.nombre} onChange={e => setFormArea({ nombre: e.target.value })}
                        placeholder="Ej: Legal" style={inputStyle} autoFocus />
                    </div>
                    <button onClick={guardarArea} disabled={guardando} style={btnPrimario}><Save size={13} /> {guardando ? '...' : 'Guardar'}</button>
                    <button onClick={() => { setCreandoArea(null); setError(''); }} style={btnSecundario}><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setCreandoArea(u.id); setFormArea({ nombre: '' }); setError(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px dashed var(--azul-claro)', color: 'var(--azul-claro)', borderRadius: 'var(--radio)', padding: '0.4rem 0.85rem', fontSize: '0.82rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <Plus size={13} /> Agregar departamento
                  </button>
                )}

                {u.areas.length === 0 ? (
                  <p style={{ color: 'var(--gris-texto)', fontSize: '0.85rem', padding: '0.5rem', fontStyle: 'italic' }}>Sin departamentos registrados.</p>
                ) : (
                  u.areas.map(a => (
                    <div key={a.id} style={{ marginBottom: '0.5rem', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', overflow: 'hidden' }}>

                      {/* Header área */}
                      <div style={{ padding: '0.65rem 1rem', background: expandidasArea[a.id] ? 'var(--gris-suave)' : '#fafbfc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div onClick={() => toggleArea(a.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, cursor: 'pointer' }}>
                          {expandidasArea[a.id] ? <ChevronDown size={13} color="var(--gris-texto)" /> : <ChevronRight size={13} color="var(--gris-texto)" />}
                          {editandoArea === a.id ? (
                            <input value={formArea.nombre} onChange={e => setFormArea({ nombre: e.target.value })}
                              onClick={e => e.stopPropagation()}
                              style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }} autoFocus />
                          ) : (
                            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.85rem', color: 'var(--azul)' }}>{a.nombre}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--gris-texto)' }}>
                            <Users size={12} /> {a.usuarios.length}
                          </span>
                          {editandoArea === a.id ? (
                            <>
                              <button onClick={guardarArea} disabled={guardando} style={btnPrimario}><Save size={11} /> {guardando ? '...' : 'Guardar'}</button>
                              <button onClick={() => { setEditandoArea(null); setError(''); }} style={btnSecundario}><X size={11} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditandoArea(a.id); setFormArea({ nombre: a.nombre }); setError(''); }} style={btnSecundario}><Edit2 size={11} /></button>
                              <button onClick={() => desactivarArea(a.id)} style={{ ...btnSecundario, color: 'var(--rojo)', borderColor: 'var(--rojo)' }}><Trash2 size={11} /></button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Usuarios */}
                      {expandidasArea[a.id] && (
                        <div style={{ padding: '0.5rem 1rem 0.75rem' }}>
                          {a.usuarios.length === 0 ? (
                            <p style={{ color: 'var(--gris-texto)', fontSize: '0.82rem', fontStyle: 'italic' }}>Sin usuarios en este departamento.</p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
                              {a.usuarios.map(us => (
                                <div key={us.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', background: '#fff', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)' }}>
                                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--azul)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
                                      {us.nombres[0]}{us.apellidos[0]}
                                    </span>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--azul)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {us.nombres} {us.apellidos}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--gris-texto)' }}>{us.rol}</div>
                                  </div>
                                  <button onClick={() => { setMoviendoUsuario({ usuario: us, areaActualId: a.id }); setAreaDestino(''); setError(''); }}
                                    title="Mover a otro departamento"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px', display: 'flex', borderRadius: '4px', flexShrink: 0 }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gris-suave)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <ArrowRightLeft size={13} color="var(--azul-claro)" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" };
const inputStyle  = { width: '100%', padding: '0.5rem 0.65rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.85rem', color: 'var(--azul)', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPrimario  = { display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' };
const btnSecundario = { display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', color: 'var(--azul-claro)', border: '1px solid var(--azul-claro)', borderRadius: 'var(--radio)', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' };