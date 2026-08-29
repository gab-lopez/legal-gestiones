import { useEffect, useState } from 'react';
import { usuariosAdminService, rolesService, areasAdminService } from '../../services/api';
import { unidadesService } from '../../services/api';
import { Plus, Edit2, Save, X, Trash2 } from 'lucide-react';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios]   = useState([]);
  const [roles, setRoles]         = useState([]);
  const [unidades, setUnidades]   = useState([]);
  const [creando, setCreando]     = useState(false);
  const [editando, setEditando]   = useState(null);
  const [form, setForm]           = useState({ correo: '', rolId: '', areaId: '' });
  const [formEdit, setFormEdit]   = useState({ rolId: '', areaId: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');
  const [filtro, setFiltro]       = useState('');

  useEffect(() => {
    cargar();
    rolesService.getAll().then(r => setRoles(r.data));
    unidadesService.getConAreas().then(r => setUnidades(r.data));
  }, []);

  const cargar = () => usuariosAdminService.getAll().then(r => setUsuarios(r.data));

  const todasLasAreas = unidades.flatMap(u =>
    u.areas.map(a => ({ id: a.id, nombre: a.nombre, unidad: u.nombre }))
  );

  const usuariosFiltrados = usuarios.filter(u =>
    filtro === '' ||
    `${u.nombres} ${u.apellidos} ${u.correo}`.toLowerCase().includes(filtro.toLowerCase())
  );

  const crear = async () => {
    if (!form.correo || !form.rolId || !form.areaId)
      return setError('Correo, rol y departamento son obligatorios.');
    if (!form.correo.endsWith('@rvcuatro.com'))
      return setError('El correo debe ser @rvcuatro.com.');
    setGuardando(true); setError('');
    try {
      await usuariosAdminService.create({
        correo:   form.correo,
        rolId:    parseInt(form.rolId),
        areaId:   parseInt(form.areaId),
        password: '',
      });
      setCreando(false);
      setForm({ correo: '', rolId: '', areaId: '' });
      cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al crear usuario.');
    } finally { setGuardando(false); }
  };

  const actualizarRolArea = async (id) => {
    if (!formEdit.rolId || !formEdit.areaId)
      return setError('Rol y departamento son obligatorios.');
    setGuardando(true); setError('');
    try {
      await usuariosAdminService.actualizarRolArea(id, {
        rolId:  parseInt(formEdit.rolId),
        areaId: parseInt(formEdit.areaId),
      });
      setEditando(null);
      cargar();
    } catch { setError('Error al actualizar.'); }
    finally { setGuardando(false); }
  };

  const desactivar = async (id, nombre) => {
    if (!confirm(`¿Desactivar a ${nombre}?`)) return;
    await usuariosAdminService.desactivar(id);
    cargar();
  };

  const iniciarEdicion = (u) => {
    setEditando(u.id);
    const area = todasLasAreas.find(a => a.nombre === u.area);
    const rol  = roles.find(r => r.nombre === u.rol);
    setFormEdit({ rolId: rol?.id || '', areaId: area?.id || '' });
    setError('');
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Usuarios</h2>
          <p style={{ color: 'var(--gris-texto)', fontSize: '0.88rem', marginTop: '2px' }}>
            Gestión de accesos al sistema — login con Microsoft corporativo
          </p>
        </div>
        <button onClick={() => { setCreando(true); setForm({ correo: '', rolId: '', areaId: '' }); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      {/* Formulario nuevo usuario */}
      {creando && (
        <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-md)', padding: '1.25rem', marginBottom: '1rem', border: '2px solid var(--azul-claro)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--azul)', marginBottom: '1rem', fontFamily: "'Montserrat', sans-serif" }}>
            Nuevo usuario
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Correo corporativo <span style={{ color: 'var(--rojo)' }}>*</span></label>
              <input type="email" value={form.correo}
                onChange={e => setForm({ ...form, correo: e.target.value })}
                placeholder="usuario@rvcuatro.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rol <span style={{ color: 'var(--rojo)' }}>*</span></label>
              <select value={form.rolId} onChange={e => setForm({ ...form, rolId: e.target.value })} style={inputStyle}>
                <option value="">Selecciona...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Departamento <span style={{ color: 'var(--rojo)' }}>*</span></label>
              <select value={form.areaId} onChange={e => setForm({ ...form, areaId: e.target.value })} style={inputStyle}>
                <option value="">Selecciona...</option>
                {unidades.map(u => (
                  <optgroup key={u.id} label={u.nombre}>
                    {u.areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          {error && <div style={estiloError}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => { setCreando(false); setError(''); }} style={btnSecundario}><X size={13} /> Cancelar</button>
            <button onClick={crear} disabled={guardando} style={btnPrimario}><Save size={13} /> {guardando ? 'Guardando...' : 'Crear usuario'}</button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" value={filtro} onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          style={{ ...inputStyle, maxWidth: '360px' }} />
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--azul)' }}>
              {['Nombre', 'Correo', 'Rol', 'Departamento', 'Unidad', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--gris-borde)', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{u.nombres} {u.apellidos}</div>
                  {(!u.nombres && !u.apellidos) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gris-texto)', fontStyle: 'italic' }}>Pendiente primer login</div>
                  )}
                </td>
                <td style={{ ...td, color: 'var(--gris-texto)', fontSize: '0.82rem' }}>{u.correo}</td>
                <td style={td}>
                  {editando === u.id ? (
                    <select value={formEdit.rolId} onChange={e => setFormEdit({ ...formEdit, rolId: e.target.value })}
                      style={{ ...inputStyle, padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}>
                      <option value="">Rol...</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  ) : (
                    <span style={{ background: u.rol === 'Administrador' ? '#fef9c3' : u.rol === 'Gestor Legal' ? '#dcfce7' : '#eff6ff', color: u.rol === 'Administrador' ? '#a16207' : u.rol === 'Gestor Legal' ? '#15803d' : '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {u.rol}
                    </span>
                  )}
                </td>
                <td style={td}>
                  {editando === u.id ? (
                    <select value={formEdit.areaId} onChange={e => setFormEdit({ ...formEdit, areaId: e.target.value })}
                      style={{ ...inputStyle, padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}>
                      <option value="">Departamento...</option>
                      {unidades.map(un => (
                        <optgroup key={un.id} label={un.nombre}>
                          {un.areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <span>{u.area}</span>
                  )}
                </td>
                <td style={{ ...td, color: 'var(--gris-texto)', fontSize: '0.82rem' }}>{u.unidadNegocio}</td>
                <td style={td}>
                  {editando === u.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => actualizarRolArea(u.id)} disabled={guardando} style={btnPrimario}>
                        <Save size={12} /> {guardando ? '...' : 'Guardar'}
                      </button>
                      <button onClick={() => { setEditando(null); setError(''); }} style={btnSecundario}><X size={12} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => iniciarEdicion(u)} style={btnSecundario} title="Editar rol y departamento">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => desactivar(u.id, `${u.nombres} ${u.apellidos}`)}
                        style={{ ...btnSecundario, color: 'var(--rojo)', borderColor: 'var(--rojo)' }} title="Desactivar usuario">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--gris-texto)', fontStyle: 'italic' }}>
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {error && !creando && <div style={{ ...estiloError, marginTop: '0.75rem' }}>{error}</div>}
    </div>
  );
}

const labelStyle   = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" };
const inputStyle   = { width: '100%', padding: '0.5rem 0.65rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.85rem', color: 'var(--azul)', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnPrimario  = { display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' };
const btnSecundario = { display: 'flex', alignItems: 'center', gap: '3px', background: 'transparent', color: 'var(--azul-claro)', border: '1px solid var(--azul-claro)', borderRadius: 'var(--radio)', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' };
const td           = { padding: '0.75rem 1rem', fontSize: '0.88rem', color: 'var(--azul)', verticalAlign: 'middle' };
const estiloError  = { padding: '0.65rem 1rem', background: '#fee2e2', borderRadius: 'var(--radio)', color: 'var(--rojo)', fontSize: '0.85rem' };