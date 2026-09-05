import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { solicitudesService, archivosService } from '../services/api';
import FormularioDinamico from '../components/FormularioDinamico';
import { FileText, AlertTriangle, Clock, Send, ChevronDown, ChevronUp } from 'lucide-react';

const coloresEstado = {
  'Recibida':           { bg: '#eff6ff', color: '#1d4ed8' },
  'En revisión':        { bg: '#fef9c3', color: '#a16207' },
  'Pendiente de info':  { bg: '#fee2e2', color: '#b91c1c' },
  'Documento generado': { bg: '#f0fdf4', color: '#15803d' },
  'Aprobada':           { bg: '#dcfce7', color: '#15803d' },
  'Rechazada':          { bg: '#fee2e2', color: '#b91c1c' },
};

export default function MisSolicitudes() {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [abierta, setAbierta]         = useState(null); // id de la solicitud con el panel de corrección abierto

  useEffect(() => { cargar(); }, [usuario]);

  const cargar = () => {
    if (!usuario) return;
    setCargando(true);
    solicitudesService.getAll({ solicitanteId: usuario.id })
      .then(res => setSolicitudes(res.data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  };

  const toggle = (id) => setAbierta(abierta === id ? null : id);

  const pendientes = solicitudes.filter(s => s.bloqueadaPorInfo);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Mis solicitudes</h1>
        <p style={{ color: 'var(--gris-texto)', fontSize: '0.9rem' }}>Tus gestiones enviadas y su estado actual</p>
      </div>

      {pendientes.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radio)', padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertTriangle size={17} color="#b91c1c" />
          <span style={{ fontSize: '0.88rem', color: '#991b1b' }}>
            Tienes <strong>{pendientes.length}</strong> {pendientes.length === 1 ? 'solicitud que necesita' : 'solicitudes que necesitan'} corrección. Revísalas abajo.
          </span>
        </div>
      )}

      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-md)', overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--gris-borde)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Historial de solicitudes</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--gris-texto)' }}>{solicitudes.length} registros</span>
        </div>

        {cargando ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gris-texto)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Clock size={18} /><span>Cargando...</span>
          </div>
        ) : solicitudes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={40} color="var(--gris-borde)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--gris-texto)', fontWeight: 500 }}>Aún no has enviado ninguna solicitud.</p>
          </div>
        ) : (
          <div>
            {solicitudes.map(s => {
              const estado = coloresEstado[s.estado] || { bg: '#f3f4f6', color: '#374151' };
              return (
                <div key={s.id} style={{ borderBottom: '1px solid var(--gris-borde)' }}>
                  <div
                    onClick={() => s.bloqueadaPorInfo && toggle(s.id)}
                    style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: s.bloqueadaPorInfo ? 'pointer' : 'default' }}>
                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: 'var(--azul-claro)', minWidth: '110px' }}>{s.codigo}</span>
                    <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--azul)' }}>{s.tipoSolicitud}</span>
                    <span style={{ background: estado.bg, color: estado.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
                      {s.estado}
                    </span>
                    {s.bloqueadaPorInfo && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> Necesita corrección
                        {abierta === s.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </span>
                    )}
                  </div>

                  {abierta === s.id && (
                    <PanelCorreccion
                      solicitudId={s.id}
                      usuarioId={usuario.id}
                      onEnviado={() => { setAbierta(null); cargar(); }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PanelCorreccion({ solicitudId, usuarioId, onEnviado }) {
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState('');
  const [enviando, setEnviando]   = useState(false);
  const [mensajeGeneral, setMensajeGeneral] = useState('');
  const [camposObs, setCamposObs] = useState({});
  const [esquemaCompleto, setEsquemaCompleto] = useState([]);
  const [datosCompletos, setDatosCompletos]   = useState({});
  const [valores, setValores]     = useState({});

  useEffect(() => {
    setCargando(true);
    Promise.all([
      solicitudesService.getObservacionesPendientes(solicitudId),
      solicitudesService.getById(solicitudId),
    ])
      .then(([obsRes, detalleRes]) => {
        const obs = obsRes.data;
        setMensajeGeneral(obs.mensajeGeneral || '');
        setCamposObs(obs.camposConObservacion || {});

        const tipo = detalleRes.data.solicitud?.tipoSolicitud;
        let esquema = [];
        if (tipo?.esquemaJson) {
          try {
            const parsed = JSON.parse(tipo.esquemaJson);
            esquema = Array.isArray(parsed) ? parsed : (parsed.campos || []);
          } catch { esquema = []; }
        }
        setEsquemaCompleto(esquema);

        let datos = {};
        if (detalleRes.data.datos?.datosJson) {
          try { datos = JSON.parse(detalleRes.data.datos.datosJson); } catch { datos = {}; }
        }
        setDatosCompletos(datos);
        setValores(datos);
      })
      .catch(err => { console.error(err); setError('No se pudo cargar la información de corrección.'); })
      .finally(() => setCargando(false));
  }, [solicitudId]);

  // Solo los campos marcados por el gestor (más las secciones a las que pertenecen,
  // para que el formulario dinámico se vea ordenado en vez de una lista suelta).
  const nombresObservados = Object.keys(camposObs);
  const camposFiltrados = esquemaCompleto.filter(c => nombresObservados.includes(c.nombre));

  const enviar = async () => {
    setEnviando(true);
    setError('');
    try {
      // Subir archivos nuevos que el solicitante haya adjuntado como parte de la corrección
      const archivosNuevos = Object.entries(valores).filter(([, val]) => val instanceof File);
      for (const [key, archivo] of archivosNuevos) {
        const partesClave = key.split('_');
        const grupo       = partesClave[1];
        const nombreDoc   = partesClave.slice(2).join(' ');
        // Necesitamos el código de la solicitud para subir el archivo
        const { data } = await solicitudesService.getById(solicitudId);
        await archivosService.subir(data.solicitud.codigo, grupo, nombreDoc, archivo, solicitudId, usuarioId);
      }

      // El resto de los datos (no archivos) se combinan con los datos originales completos
      const valoresSinArchivos = Object.fromEntries(
        Object.entries(valores).filter(([, val]) => !(val instanceof File))
      );
      const datosFinales = { ...datosCompletos, ...valoresSinArchivos };

      await solicitudesService.responderCorreccion(solicitudId, {
        datosJson: JSON.stringify(datosFinales),
        usuarioId,
      });

      onEnviado();
    } catch (e) {
      console.error(e);
      setError('No se pudo enviar la corrección. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <div style={{ padding: '1.5rem', color: 'var(--gris-texto)', fontSize: '0.88rem' }}>Cargando observaciones...</div>;
  }

  return (
    <div style={{ padding: '1.25rem 1.5rem 1.5rem', background: '#fafbfc', borderTop: '1px dashed var(--gris-borde)' }}>
      {mensajeGeneral && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radio)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.86rem', color: '#9a3412' }}>
          <strong>Comentario del gestor legal:</strong> {mensajeGeneral}
        </div>
      )}

      {nombresObservados.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Campos a corregir
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: 'var(--azul)' }}>
            {Object.entries(camposObs).map(([campo, obs]) => {
              const etiqueta = esquemaCompleto.find(c => c.nombre === campo)?.etiqueta || campo;
              return <li key={campo} style={{ marginBottom: '3px' }}><strong>{etiqueta}:</strong> {obs}</li>;
            })}
          </ul>
        </div>
      )}

      {camposFiltrados.length > 0 ? (
        <FormularioDinamico esquema={camposFiltrados} valores={valores} onChange={setValores} />
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--gris-texto)' }}>No se encontraron los campos marcados en el formulario actual.</p>
      )}

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radio)', padding: '0.65rem 0.85rem', marginTop: '0.75rem', color: 'var(--rojo)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={enviar} disabled={enviando}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.6rem 1.5rem', fontSize: '0.88rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", cursor: 'pointer', opacity: enviando ? 0.7 : 1 }}>
          <Send size={14} /> {enviando ? 'Enviando...' : 'Reenviar al gestor legal'}
        </button>
      </div>
    </div>
  );
}
