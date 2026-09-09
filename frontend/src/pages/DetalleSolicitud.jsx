import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { solicitudesService, archivosService, documentosService, sociedadesService } from '../services/api';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle, FileText, User, Building2, Download, Eye, FileCheck, Edit2, Save, X, Stamp } from 'lucide-react';

const coloresSla = {
  ok:         { bg: '#dcfce7', color: '#15803d', label: 'En tiempo',   Icono: CheckCircle },
  alerta:     { bg: '#fef9c3', color: '#a16207', label: 'Por vencer',  Icono: AlertTriangle },
  vencida:    { bg: '#fee2e2', color: '#b91c1c', label: 'Vencida',     Icono: XCircle },
  completada: { bg: '#e0e7ff', color: '#3730a3', label: 'Completada',  Icono: CheckCircle },
};

const coloresEstado = {
  'Recibida':           { bg: '#eff6ff', color: '#1d4ed8' },
  'En revisión':        { bg: '#fef9c3', color: '#a16207' },
  'Pendiente de info':  { bg: '#fee2e2', color: '#b91c1c' },
  'Documento generado': { bg: '#f0fdf4', color: '#15803d' },
  'Aprobada':           { bg: '#dcfce7', color: '#15803d' },
  'Rechazada':          { bg: '#fee2e2', color: '#b91c1c' },
};

const camposOcultos = ['sociedad_id', 'tipo_arrendatario', 'incluye_fiador', 'tipo_fiador'];

export default function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [datos, setDatos]             = useState(null);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [historial, setHistorial]     = useState([]);
  const [generando, setGenerando]     = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [sociedades, setSociedades]   = useState([]);
  const [subiendoFirmado, setSubiendoFirmado]         = useState(false);
  const [mensajeExitoFirmado, setMensajeExitoFirmado] = useState('');
  const [errorFirmado, setErrorFirmado]               = useState('');

  const [editandoDatos, setEditandoDatos]           = useState(false);
  const [datosEditados, setDatosEditados]           = useState({});
  const [camposObservados, setCamposObservados]     = useState({});
  const [guardandoDatos, setGuardandoDatos]         = useState(false);
  const [mensajeObservacion, setMensajeObservacion] = useState('');

  useEffect(() => {
    solicitudesService.getById(id)
      .then(res => setDatos(res.data))
      .catch(() => setError('No se pudo cargar la solicitud.'))
      .finally(() => setCargando(false));
    solicitudesService.getHistorial(id)
      .then(res => setHistorial(res.data))
      .catch(() => {});
    sociedadesService.getAll()
      .then(res => setSociedades(res.data))
      .catch(() => {});
  }, [id]);

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    const fechaUtc = fecha.endsWith('Z') ? fecha : fecha + 'Z';
    return new Date(fechaUtc).toLocaleString('es-GT', {
      timeZone: 'America/Guatemala',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const nombreEstado = (estadoId) => {
    const estados = {
      '1': 'Recibida', '2': 'En revisión', '3': 'Pendiente de info',
      '4': 'Documento generado', '5': 'Aprobada', '6': 'Rechazada'
    };
    return estados[estadoId] || estadoId;
  };

  const valorLegible = (key, val) => {
    if (key === 'sociedad_id') {
      const s = sociedades.find(s => s.id === parseInt(val));
      return s ? s.nombreSociedad : val;
    }
    return String(val);
  };

  const generarBorrador = async () => {
    setGenerando(true);
    setMensajeExito('');
    try {
      await documentosService.generar(id, usuario.id);
      const res = await solicitudesService.getById(id);
      setDatos(res.data);
      solicitudesService.getHistorial(id).then(r => setHistorial(r.data));
      setMensajeExito('Borrador generado correctamente.');
      setTimeout(() => setMensajeExito(''), 4000);
    } catch { alert('Error al generar el documento.'); }
    finally { setGenerando(false); }
  };

  const subirDocumentoFirmado = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo despues
    if (!archivo) return;

    setSubiendoFirmado(true);
    setErrorFirmado('');
    setMensajeExitoFirmado('');
    try {
      await archivosService.subirDocumentoFirmado(id, usuario.id, archivo);
      const res = await solicitudesService.getById(id);
      setDatos(res.data);
      solicitudesService.getHistorial(id).then(r => setHistorial(r.data));
      setMensajeExitoFirmado('Documento firmado subido correctamente.');
      setTimeout(() => setMensajeExitoFirmado(''), 4000);
    } catch (err) {
      setErrorFirmado(err.response?.data?.mensaje || 'Error al subir el documento firmado.');
    } finally {
      setSubiendoFirmado(false);
    }
  };

  const guardarDatos = async () => {
    setGuardandoDatos(true);
    try {
      await solicitudesService.actualizarDatos(id, {
        datosJson: JSON.stringify(datosEditados),
        usuarioId: usuario.id,
      });
      const res = await solicitudesService.getById(id);
      setDatos(res.data);
      solicitudesService.getHistorial(id).then(r => setHistorial(r.data));
      setEditandoDatos(false);
      setCamposObservados({});
    } catch { alert('Error al guardar.'); }
    finally { setGuardandoDatos(false); }
  };

  const enviarObservaciones = async () => {
    setGuardandoDatos(true);
    try {
      await solicitudesService.guardarObservaciones(id, {
        usuarioId:            usuario.id,
        camposConObservacion: camposObservados,
        mensajeGeneral:       mensajeObservacion || null,
      });
      const res = await solicitudesService.getById(id);
      setDatos(res.data);
      solicitudesService.getHistorial(id).then(r => setHistorial(r.data));
      setEditandoDatos(false);
      setCamposObservados({});
      setMensajeObservacion('');
    } catch { alert('Error al enviar observaciones.'); }
    finally { setGuardandoDatos(false); }
  };

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gris-texto)', padding: '2rem' }}>
      <Clock size={18} /> Cargando...
    </div>
  );

  if (error) return <div style={{ color: 'var(--rojo)', padding: '2rem' }}>{error}</div>;

  const { solicitud, datos: datosSolicitud, partes, adjuntos } = datos;
  const sla    = coloresSla[solicitud.semaforoSla]       || coloresSla.ok;
  const estado = coloresEstado[solicitud.estado?.nombre] || { bg: '#f3f4f6', color: '#374151' };

  let datosJson = {};
  try { datosJson = JSON.parse(datosSolicitud?.datosJson || '{}'); } catch {}

  const esGestor = usuario?.rolId === 3 || usuario?.rolId === 1;

  const entradas = Object.entries(editandoDatos ? datosEditados : datosJson)
    .filter(([key]) => !camposOcultos.includes(key));

  const descargarArchivo = async (ruta, nombre) => {
    try {
      const res = await archivosService.descargar(ruta);
      const extension = ruta.split('.').pop().toLowerCase();
      const mimeTypes = { 'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      const mimeType = mimeTypes[extension] || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const a = document.createElement('a');
      a.href = url; a.download = nombre; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('No se pudo descargar el archivo.'); }
  };

  const previsualizarArchivo = async (ruta) => {
    try {
      const res = await archivosService.descargar(ruta);
      const extension = ruta.split('.').pop().toLowerCase();
      const mimeTypes = { 'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      const mimeType = mimeTypes[extension] || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      window.open(url, '_blank');
    } catch { alert('No se pudo previsualizar el archivo.'); }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none', color: 'var(--azul-claro)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, padding: '0', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Volver a solicitudes
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {solicitud.tipoSolicitud?.nombre}
            </h1>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: 'var(--azul-claro)' }}>
              {solicitud.codigo}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ background: estado.bg, color: estado.color, padding: '5px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
              {solicitud.estado?.nombre}
            </span>
            <span style={{ background: sla.bg, color: sla.color, padding: '5px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <sla.Icono size={13} /> {sla.label}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>

        {/* Columna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <Tarjeta titulo="Información general">
            <Grilla>
              <Dato label="Solicitante"      valor={`${solicitud.solicitante?.nombres} ${solicitud.solicitante?.apellidos}`} />
              <Dato label="Fecha solicitud"  valor={formatFecha(solicitud.fechaSolicitud)} />
              <Dato label="Fecha límite SLA" valor={formatFecha(solicitud.fechaLimiteSla)} />
              <Dato label="Fecha cierre"     valor={solicitud.fechaCierre ? formatFecha(solicitud.fechaCierre) : 'Pendiente'} />
              {solicitud.proyecto    && <Dato label="Proyecto" valor={solicitud.proyecto.nombre} />}
              {solicitud.empresa     && <Dato label="Empresa"  valor={solicitud.empresa.nombreLegal} />}
              {solicitud.descripcion && <Dato label="Notas"    valor={solicitud.descripcion} full />}
            </Grilla>

            {(() => {
              const sociedadId = datosJson['sociedad_id'];
              if (!sociedadId) return null;
              const s = sociedades.find(s => s.id === parseInt(sociedadId));
              if (!s) return null;
              return (
                <>
                  <div style={{ borderTop: '1px solid var(--gris-borde)', margin: '1rem 0 0.75rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-10px', left: 0, background: '#fff', paddingRight: '10px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gris-texto)', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Sociedad arrendante
                    </span>
                  </div>
                  <Grilla>
                    <Dato label="Sociedad"             valor={s.nombreSociedad} full />
                    <Dato label="Representante legal"  valor={s.nombreRepresentante} />
                    <Dato label="Cargo"                valor={s.cargo} />
                    <Dato label="DPI representante"    valor={s.dpi} />
                    <Dato label="Notario del contrato" valor={s.nombreNotario || '—'} />
                    <Dato label="Fecha del acta"       valor={s.actaFecha || '—'} />
                    <Dato label="Notario del acta"     valor={s.actaNotario || '—'} />
                    <Dato label="Registro Mercantil"   valor={s.registroNumero || '—'} />
                    <Dato label="Folio"                valor={s.registroFolio || '—'} />
                    <Dato label="Libro"                valor={s.registroLibro || '—'} />
                  </Grilla>
                </>
              );
            })()}
          </Tarjeta>

          {entradas.length > 0 && (
            <Tarjeta titulo="Datos del documento">
              {esGestor && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  {!editandoDatos ? (
                    <button onClick={() => { setEditandoDatos(true); setDatosEditados({ ...datosJson }); setCamposObservados({}); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--azul-claro)', color: 'var(--azul-claro)', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <Edit2 size={13} /> Editar campos
                    </button>
                  ) : (
                    <>
                      <button onClick={guardarDatos} disabled={guardandoDatos}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                        <Save size={13} /> {guardandoDatos ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button onClick={() => { setEditandoDatos(false); setCamposObservados({}); setMensajeObservacion(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: 'var(--gris-texto)', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '5px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>
                        <X size={13} /> Cancelar
                      </button>
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem' }}>
                {entradas.map(([key, val]) => {
                  const tieneObservacion = !!camposObservados[key];
                  const valorMostrar     = valorLegible(key, val);
                  return (
                    <div key={key} style={{ gridColumn: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '3px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: tieneObservacion ? '#d97706' : 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Montserrat', sans-serif" }}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        {esGestor && editandoDatos && (
                          <button onClick={() => setCamposObservados(prev => {
                            const nuevo = { ...prev };
                            if (nuevo[key]) delete nuevo[key];
                            else nuevo[key] = 'Requiere corrección';
                            return nuevo;
                          })}
                            style={{ background: tieneObservacion ? '#fef9c3' : 'transparent', border: `1px solid ${tieneObservacion ? '#d97706' : 'var(--gris-borde)'}`, borderRadius: '4px', padding: '1px 6px', cursor: 'pointer', fontSize: '0.7rem', color: tieneObservacion ? '#d97706' : 'var(--gris-texto)', whiteSpace: 'nowrap' }}>
                            {tieneObservacion ? '⚠ Marcado' : '+ Observar'}
                          </button>
                        )}
                      </div>
                      {editandoDatos ? (
                        <input type="text" value={datosEditados[key] || ''}
                          onChange={e => setDatosEditados({ ...datosEditados, [key]: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: 'var(--radio)', border: `1px solid ${tieneObservacion ? '#d97706' : 'var(--azul-claro)'}`, fontSize: '0.85rem', color: 'var(--azul)', background: tieneObservacion ? '#fffbeb' : '#fff', outline: 'none', boxSizing: 'border-box' }} />
                      ) : (
                        <div style={{ fontSize: '0.88rem', color: 'var(--azul)' }}>{valorMostrar || '—'}</div>
                      )}
                      {tieneObservacion && editandoDatos && (
                        <input type="text" value={camposObservados[key]}
                          onChange={e => setCamposObservados({ ...camposObservados, [key]: e.target.value })}
                          placeholder="Describe la corrección requerida..."
                          style={{ width: '100%', padding: '0.3rem 0.6rem', borderRadius: 'var(--radio)', border: '1px solid #d97706', fontSize: '0.78rem', color: 'var(--azul)', background: '#fffbeb', outline: 'none', boxSizing: 'border-box', marginTop: '3px' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {esGestor && editandoDatos && Object.keys(camposObservados).length > 0 && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gris-borde)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d97706', marginBottom: '0.5rem' }}>
                    ⚠ {Object.keys(camposObservados).length} campo(s) marcado(s) para corrección
                  </div>
                  <textarea value={mensajeObservacion}
                    onChange={e => setMensajeObservacion(e.target.value)}
                    placeholder="Mensaje general para el solicitante (opcional)..."
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.85rem', height: '70px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
                  <button onClick={enviarObservaciones} disabled={guardandoDatos}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                    ⚠ {guardandoDatos ? 'Enviando...' : 'Solicitar correcciones al solicitante'}
                  </button>
                </div>
              )}
            </Tarjeta>
          )}

          {partes?.length > 0 && (
            <Tarjeta titulo="Partes involucradas">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {partes.map(parte => (
                  <div key={parte.id} style={{ border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {parte.tipoParte === 'Persona individual'
                        ? <User size={15} color="var(--azul-claro)" />
                        : <Building2 size={15} color="var(--azul-claro)" />}
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" }}>
                        {parte.rolParte}
                      </span>
                      <span style={{ background: 'var(--gris-suave)', color: 'var(--gris-texto)', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem' }}>
                        {parte.tipoParte}
                      </span>
                    </div>
                    <Grilla>
                      <Dato label="Nombre"         valor={parte.nombre} />
                      <Dato label="Identificación" valor={parte.identificacionNumero || '—'} />
                    </Grilla>
                  </div>
                ))}
              </div>
            </Tarjeta>
          )}

          {historial.length > 0 && (
            <Tarjeta titulo="Historial">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {historial.map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', gap: '0.75rem', paddingBottom: i < historial.length - 1 ? '1rem' : '0', position: 'relative' }}>
                    {i < historial.length - 1 && (
                      <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '0', width: '2px', background: 'var(--gris-borde)' }} />
                    )}
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: h.tipoEvento === 'creacion' ? 'var(--azul)' : h.tipoEvento === 'solicitud_correccion' ? '#d97706' : h.tipoEvento === 'documento_firmado' ? '#15803d' : 'var(--azul-claro)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                    </div>
                    <div style={{ flex: 1, paddingTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: h.tipoEvento === 'solicitud_correccion' ? '#d97706' : 'var(--azul)', fontFamily: "'Montserrat', sans-serif" }}>
                          {h.tipoEvento === 'creacion'             ? 'Solicitud creada' :
                           h.tipoEvento === 'cambio_estado'        ? `Estado → ${nombreEstado(h.valorNuevo)}` :
                           h.tipoEvento === 'documento_generado'   ? 'Borrador generado' :
                           h.tipoEvento === 'documento_firmado'    ? 'Documento firmado subido' :
                           h.tipoEvento === 'edicion_datos'        ? 'Datos editados por gestor' :
                           h.tipoEvento === 'solicitud_correccion' ? 'Correcciones solicitadas al solicitante' :
                           h.tipoEvento}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gris-texto)', whiteSpace: 'nowrap' }}>
                          {formatFecha(h.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gris-texto)' }}>{h.usuario}</div>
                      {h.comentario && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--azul)', background: 'var(--gris-fondo)', borderRadius: 'var(--radio)', padding: '0.4rem 0.6rem', marginTop: '0.4rem', borderLeft: `3px solid ${h.tipoEvento === 'solicitud_correccion' ? '#d97706' : 'var(--azul-claro)'}` }}>
                          {h.comentario}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Tarjeta>
          )}
        </div>

        {/* Columna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <Tarjeta titulo="Documentos adjuntos">
            {adjuntos?.length === 0 ? (
              <p style={{ color: 'var(--gris-texto)', fontSize: '0.85rem' }}>Sin documentos adjuntos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(() => {
                  // La version oficial/vigente del documento firmado es la de
                  // numero mas alto; las anteriores quedan como historico
                  // (ver Tarea 19: diferenciacion de version oficial).
                  const maxVersionFirmado = Math.max(
                    0,
                    ...(adjuntos?.filter(a => a.esDocumentoFirmado).map(a => a.version) || [])
                  );

                  const grupos = {};
                  adjuntos?.forEach(adj => {
                    const partes = adj.rutaArchivo?.split('/');
                    const nombreParte = partes?.length >= 3
                      ? partes[partes.length - 2].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      : 'General';
                    if (!grupos[nombreParte]) grupos[nombreParte] = [];
                    grupos[nombreParte].push(adj);
                  });
                  return Object.entries(grupos).map(([parte, docs]) => (
                    <div key={parte} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', paddingBottom: '0.3rem', borderBottom: '1px solid var(--gris-suave)' }}>
                        {parte}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {docs.map(adj => {
                          const extension = adj.rutaArchivo?.split('.').pop().toLowerCase();
                          const esImagen  = ['jpg', 'jpeg', 'png'].includes(extension);
                          const esPdf     = extension === 'pdf';
                          const esVersionVigente = adj.esDocumentoFirmado && adj.version === maxVersionFirmado;
                          const esVersionAnterior = adj.esDocumentoFirmado && !esVersionVigente;
                          return (
                            <div key={adj.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid var(--gris-borde)', borderRadius: 'var(--radio)', background: esVersionVigente ? '#f0fdf4' : esVersionAnterior ? '#fafbfc' : adj.esDocumentoGenerado ? '#eff6ff' : '#fafbfc', opacity: esVersionAnterior ? 0.65 : 1 }}>
                              <FileText size={13} color={esVersionVigente ? '#15803d' : adj.esDocumentoGenerado ? 'var(--azul-claro)' : 'var(--gris-texto)'} />
                              <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--azul)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {adj.nombreArchivo}
                              </span>
                              {esVersionVigente && (
                                <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 600, marginRight: '2px' }}>✓ Vigente</span>
                              )}
                              {esVersionAnterior && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--gris-texto)', fontWeight: 600, marginRight: '2px' }}>Versión anterior</span>
                              )}
                              {adj.esDocumentoGenerado && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--azul-claro)', fontWeight: 600, marginRight: '2px' }}>Generado</span>
                              )}
                              {(esPdf || esImagen) && (
                                <button onClick={() => previsualizarArchivo(adj.rutaArchivo)} title="Vista previa"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px', display: 'flex', borderRadius: '4px' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gris-suave)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <Eye size={14} color="var(--azul-claro)" />
                                </button>
                              )}
                              <button onClick={() => descargarArchivo(adj.rutaArchivo, adj.nombreArchivo)} title="Descargar"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px', display: 'flex', borderRadius: '4px' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--gris-suave)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Download size={14} color="var(--azul-claro)" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </Tarjeta>

          {esGestor && (
            <Tarjeta titulo="Acciones">
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--gris-borde)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif", marginBottom: '0.5rem' }}>
                  Documento
                </div>
                <button onClick={generarBorrador} disabled={generando}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: generando ? 'var(--gris-suave)' : 'var(--azul)', color: generando ? 'var(--gris-texto)' : '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.65rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: generando ? 'default' : 'pointer', width: '100%', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif" }}>
                  <FileCheck size={15} />
                  {generando ? 'Generando...' : 'Generar borrador'}
                </button>
                {mensajeExito && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
                    ✓ {mensajeExito}
                  </div>
                )}

                <label
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: subiendoFirmado ? 'var(--gris-suave)' : '#15803d', color: subiendoFirmado ? 'var(--gris-texto)' : '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.65rem 1rem', fontSize: '0.85rem', fontWeight: 600, cursor: subiendoFirmado ? 'default' : 'pointer', width: '100%', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif", marginTop: '0.6rem', boxSizing: 'border-box' }}>
                  <Stamp size={15} />
                  {subiendoFirmado ? 'Subiendo...' : 'Subir documento firmado'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={subirDocumentoFirmado} disabled={subiendoFirmado} style={{ display: 'none' }} />
                </label>
                {mensajeExitoFirmado && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
                    ✓ {mensajeExitoFirmado}
                  </div>
                )}
                {errorFirmado && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--rojo)', fontWeight: 600, textAlign: 'center' }}>
                    {errorFirmado}
                  </div>
                )}
              </div>
              <CambiarEstado solicitudId={id} estadoActual={solicitud.estado?.nombre} usuarioId={usuario.id}
                onActualizado={() => {
                  solicitudesService.getById(id).then(r => setDatos(r.data));
                  solicitudesService.getHistorial(id).then(r => setHistorial(r.data));
                }} />
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  );
}

function CambiarEstado({ solicitudId, estadoActual, usuarioId, onActualizado }) {
  const [estados] = useState([
    { id: 1, nombre: 'Recibida' },
    { id: 2, nombre: 'En revisión' },
    { id: 3, nombre: 'Pendiente de info' },
    { id: 4, nombre: 'Documento generado' },
    { id: 5, nombre: 'Aprobada' },
    { id: 6, nombre: 'Rechazada' },
  ]);
  const [estadoId, setEstadoId]     = useState('');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando]   = useState(false);

  const guardar = async () => {
    if (!estadoId) return;
    setGuardando(true);
    try {
      const { solicitudesService } = await import('../services/api');
      await solicitudesService.cambiarEstado(solicitudId, {
        estadoId:      parseInt(estadoId),
        usuarioId,
        comentario:    comentario || null,
        bloqueada:     null,
        motivoBloqueo: null,
      });
      setComentario('');
      setEstadoId('');
      onActualizado();
    } catch { alert('Error al cambiar el estado.'); }
    finally { setGuardando(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Cambiar estado</label>
        <select style={inputStyle} value={estadoId} onChange={e => setEstadoId(e.target.value)}>
          <option value="">Selecciona...</option>
          {estados.filter(e => e.nombre !== estadoActual).map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Comentario</label>
        <textarea style={{ ...inputStyle, height: '70px', resize: 'vertical' }}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Observaciones del cambio..." />
      </div>
      <button onClick={guardar} disabled={!estadoId || guardando}
        style={{ background: estadoId ? 'var(--azul)' : 'var(--gris-borde)', color: estadoId ? '#fff' : 'var(--gris-texto)', border: 'none', borderRadius: 'var(--radio)', padding: '0.65rem', fontSize: '0.88rem', fontWeight: 600, cursor: estadoId ? 'pointer' : 'default', fontFamily: "'Montserrat', sans-serif" }}>
        {guardando ? 'Guardando...' : 'Guardar cambio'}
      </button>
    </div>
  );
}

function Tarjeta({ titulo, children }) {
  return (
    <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gris-borde)', background: 'var(--azul)' }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{titulo}</h3>
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  );
}

function Grilla({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem' }}>{children}</div>;
}

function Dato({ label, valor, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontFamily: "'Montserrat', sans-serif" }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--azul)' }}>{valor || '—'}</div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" };
const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.88rem', color: 'var(--azul)', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' };