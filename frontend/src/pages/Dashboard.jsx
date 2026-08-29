import { useEffect, useState } from 'react';
import { solicitudesService, tiposSolicitudService } from '../services/api';
import { FileText, CheckCircle, AlertTriangle, XCircle, Clock, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const coloresSla = {
  ok:         { bg: '#dcfce7', color: '#15803d', label: 'En tiempo' },
  alerta:     { bg: '#fef9c3', color: '#a16207', label: 'Por vencer' },
  vencida:    { bg: '#fee2e2', color: '#b91c1c', label: 'Vencida' },
  completada: { bg: '#e0e7ff', color: '#3730a3', label: 'Completada' },
};

const coloresEstado = {
  'Recibida':           { bg: '#eff6ff', color: '#1d4ed8' },
  'En revisión':        { bg: '#fef9c3', color: '#a16207' },
  'Pendiente de info':  { bg: '#fee2e2', color: '#b91c1c' },
  'Documento generado': { bg: '#f0fdf4', color: '#15803d' },
  'Aprobada':           { bg: '#dcfce7', color: '#15803d' },
  'Rechazada':          { bg: '#fee2e2', color: '#b91c1c' },
};

const estados = ['Recibida', 'En revisión', 'Pendiente de info', 'Documento generado', 'Aprobada', 'Rechazada'];

export default function Dashboard() {
  const [solicitudes, setSolicitudes]   = useState([]);
  const [tipos, setTipos]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    solicitudesService.getAll()
      .then(res => setSolicitudes(res.data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
    tiposSolicitudService.getAll()
      .then(res => setTipos(res.data))
      .catch(() => {});
  }, []);

  const limpiarFiltros = () => { setBusqueda(''); setFiltroEstado(''); setFiltroTipo(''); };

  const hayFiltros = busqueda || filtroEstado || filtroTipo;

  const solicitudesFiltradas = solicitudes.filter(s => {
    const matchBusqueda = !busqueda ||
      s.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.solicitante?.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = !filtroEstado || s.estado === filtroEstado;
    const matchTipo   = !filtroTipo   || s.tipoSolicitud === filtroTipo;
    return matchBusqueda && matchEstado && matchTipo;
  });

  const conteo = {
    total:    solicitudes.length,
    ok:       solicitudes.filter(s => s.semaforoSla === 'ok').length,
    alerta:   solicitudes.filter(s => s.semaforoSla === 'alerta').length,
    vencidas: solicitudes.filter(s => s.semaforoSla === 'vencida').length,
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Panel de solicitudes</h1>
        <p style={{ color: 'var(--gris-texto)', fontSize: '0.9rem' }}>Seguimiento y control de gestiones legales</p>
      </div>

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Tarjeta titulo="Total"      valor={conteo.total}    color="var(--azul)"    Icono={FileText}      />
        <Tarjeta titulo="En tiempo"  valor={conteo.ok}       color="var(--verde)"   Icono={CheckCircle}   />
        <Tarjeta titulo="Por vencer" valor={conteo.alerta}   color="var(--naranja)" Icono={AlertTriangle} />
        <Tarjeta titulo="Vencidas"   valor={conteo.vencidas} color="var(--rojo)"    Icono={XCircle}       />
      </div>

      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-md)', overflow: 'hidden' }}>

        {/* Header con filtros */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gris-borde)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Solicitudes activas</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--gris-texto)' }}>
              {solicitudesFiltradas.length} {solicitudesFiltradas.length !== solicitudes.length ? `de ${solicitudes.length}` : ''} registros
            </span>
          </div>

          {/* Fila de filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Buscador */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={14} color="var(--gris-texto)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por código o solicitante..."
                style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.85rem', color: 'var(--azul)', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Filtro estado */}
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.85rem', color: 'var(--azul)', background: '#fafbfc', outline: 'none', minWidth: '160px' }}>
              <option value="">Todos los estados</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            {/* Filtro tipo */}
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.85rem', color: 'var(--azul)', background: '#fafbfc', outline: 'none', minWidth: '200px' }}>
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
            </select>

            {/* Limpiar filtros */}
            {hayFiltros && (
              <button onClick={limpiarFiltros}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--gris-borde)', color: 'var(--gris-texto)', borderRadius: 'var(--radio)', padding: '0.5rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <X size={13} /> Limpiar
              </button>
            )}
          </div>
        </div>

        {cargando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gris-texto)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Clock size={18} />
            <span>Cargando...</span>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={40} color="var(--gris-borde)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--gris-texto)', fontWeight: 500 }}>
              {hayFiltros ? 'No hay solicitudes que coincidan con los filtros' : 'No hay solicitudes aún'}
            </p>
            {hayFiltros && (
              <button onClick={limpiarFiltros}
                style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid var(--gris-borde)', color: 'var(--azul-claro)', borderRadius: 'var(--radio)', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--azul)' }}>
                  {['Código', 'Tipo de documento', 'Solicitante', 'Estado', 'Fecha límite', 'SLA'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.9)', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((s, i) => {
                  const sla    = coloresSla[s.semaforoSla]   || coloresSla.ok;
                  const estado = coloresEstado[s.estado]      || { bg: '#f3f4f6', color: '#374151' };
                  return (
                    <tr key={s.id}
                      style={{ borderBottom: '1px solid var(--gris-borde)', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.15s', cursor: 'pointer' }}
                      onClick={() => navigate(`/solicitudes/${s.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}>
                      <td style={td}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--azul-claro)' }}>{s.codigo}</span>
                      </td>
                      <td style={td}>{s.tipoSolicitud}</td>
                      <td style={td}>{s.solicitante}</td>
                      <td style={td}>
                        <span style={{ background: estado.bg, color: estado.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {s.estado}
                        </span>
                      </td>
                      <td style={{ ...td, fontSize: '0.82rem', color: 'var(--gris-texto)' }}>
                        {s.fechaLimiteSla ? new Date(s.fechaLimiteSla.endsWith('Z') ? s.fechaLimiteSla : s.fechaLimiteSla + 'Z').toLocaleString('es-GT', { timeZone: 'America/Guatemala' }) : '—'}
                      </td>
                      <td style={td}>
                        <span style={{ background: sla.bg, color: sla.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {sla.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Tarjeta({ titulo, valor, color, Icono }) {
  return (
    <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', padding: '1.25rem 1.5rem', boxShadow: 'var(--sombra-sm)', borderLeft: `4px solid ${color}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ background: color + '15', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icono size={22} color={color} strokeWidth={1.75} />
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color, fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{valor}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--gris-texto)', marginTop: '2px' }}>{titulo}</div>
      </div>
    </div>
  );
}

const td = { padding: '0.85rem 1rem', fontSize: '0.88rem', color: 'var(--azul)', verticalAlign: 'middle' };