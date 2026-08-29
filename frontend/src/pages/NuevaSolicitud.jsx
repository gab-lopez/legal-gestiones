import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormularioDinamico from '../components/FormularioDinamico';
import PartesInvolucradas from '../components/PartesInvolucradas';
import { tiposSolicitudService, proyectosService, empresasService, solicitudesService, archivosService } from '../services/api';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [esquema, setEsquema] = useState(null);
  const [form, setForm] = useState({ tipoSolicitudId: '', proyectoId: '', empresaId: '', descripcion: '' });
  const [datosDinamicos, setDatosDinamicos] = useState({});
  const [partes, setPartes] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    tiposSolicitudService.getAll().then(r => setTipos(r.data));
    proyectosService.getAll().then(r => setProyectos(r.data));
    empresasService.getAll().then(r => setEmpresas(r.data));
  }, []);

  const handleTipo = (e) => {
    const id = parseInt(e.target.value);
    const tipo = tipos.find(t => t.id === id) || null;
    setForm({ ...form, tipoSolicitudId: id });
    setTipoSeleccionado(tipo);
    setDatosDinamicos({});
    setPartes([]);

    if (tipo?.esquemaJson) {
      try {
        const parsed = JSON.parse(tipo.esquemaJson);
        setEsquema(parsed);
      } catch { setEsquema(null); }
    } else {
      setEsquema(null);
    }
  };

  const tienePartes = esquema && !Array.isArray(esquema) && esquema.roles_partes?.length > 0;
  const camposFormulario = esquema
    ? (Array.isArray(esquema) ? esquema : (esquema.campos || []))
    : [];

  const validar = () => {
    if (!form.tipoSolicitudId) return 'Selecciona un tipo de documento.';

    for (const campo of camposFormulario) {
  if (campo.requerido && campo.tipo !== 'seccion' && campo.tipo !== 'adjuntos') {
    // Solo validar si el campo es visible (no tiene condición o la condición se cumple)
    const esVisible = !campo.condicional || datosDinamicos[campo.condicional] === campo.valor;
    if (esVisible && !datosDinamicos[campo.nombre])
      return `El campo "${campo.etiqueta}" es obligatorio.`;
  }
      // Validar adjuntos requeridos — solo si el campo es visible
if (campo.requerido && campo.tipo === 'adjuntos') {
  const esVisible = !campo.condicional || datosDinamicos[campo.condicional] === campo.valor;
  if (esVisible) {
    for (const doc of campo.docs || []) {
      const key = `${campo.nombre}_${doc}`;
      if (!datosDinamicos[key])
        return `Falta el documento "${doc}" en "${campo.etiqueta}".`;
    }
  }
}
    }

    if (tienePartes) {
      if (partes.length === 0) return 'Agrega al menos una parte involucrada.';
      for (const parte of partes) {
        if (!parte.rol)            return 'Todas las partes deben tener un rol.';
        if (!parte.tipo)           return 'Todas las partes deben tener un tipo.';
        if (!parte.nombre)         return 'Todas las partes deben tener nombre.';
        if (!parte.identificacion) return 'Todas las partes deben tener número de identificación.';

        const docsReq = parte.tipo === 'Persona individual'
          ? esquema.docs_persona_individual
          : esquema.docs_persona_juridica;

        for (const doc of docsReq) {
          if (!parte.documentos[doc])
            return `Falta el documento "${doc}" en la parte "${parte.nombre || parte.rol}".`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validar();
    if (err) return setError(err);
    setEnviando(true);
    setError('');

    try {
      const partesPayload = partes.map(p => ({
        rolParte:             p.rol,
        tipoParte:            p.tipo,
        nombre:               p.nombre,
        identificacionNumero: p.identificacion,
      }));

      // Filtrar archivos del datosJson antes de enviarlo
      const datosSinArchivos = Object.fromEntries(
        Object.entries(datosDinamicos).filter(([, val]) => !(val instanceof File))
      );

      const res = await solicitudesService.create({
        tipoSolicitudId: form.tipoSolicitudId,
        proyectoId:      form.proyectoId  ? parseInt(form.proyectoId)  : null,
        empresaId:       form.empresaId   ? parseInt(form.empresaId)   : null,
        descripcion:     form.descripcion || null,
        solicitanteId:   usuario.id,
        datosJson:       JSON.stringify(datosSinArchivos),
        partes:          tienePartes ? partesPayload : [],
      });

      const { codigo, id: solicitudId } = res.data;

      // Subir archivos de partes involucradas
      if (tienePartes) {
        for (const parte of partes) {
          const nombreParte = `${parte.rol}_${parte.nombre}`;
          for (const [docNombre, archivo] of Object.entries(parte.documentos)) {
            if (archivo instanceof File) {
              await archivosService.subir(codigo, nombreParte, docNombre, archivo, solicitudId, usuario.id);
            }
          }
        }
      }

      // Subir adjuntos directos del formulario
      const archivosFormulario = Object.entries(datosDinamicos)
        .filter(([, val]) => val instanceof File);

      for (const [key, archivo] of archivosFormulario) {
        // key tiene formato: adjuntos_arrendatario_DPI, adjuntos_arrendatario_RTU, etc.
        const partesClave = key.split('_');
        const grupo       = partesClave[1]; // arrendatario
        const nombreDoc   = partesClave.slice(2).join(' '); // DPI, RTU, etc.
        await archivosService.subir(codigo, grupo, nombreDoc, archivo, solicitudId, usuario.id);
      }

      navigate('/');
    } catch (e) {
      console.error(e);
      setError('Error al crear la solicitud. Revisa los datos.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Nueva solicitud</h1>
        <p style={{ color: 'var(--gris-texto)', fontSize: '0.9rem' }}>Completa los datos para enviar tu gestión al equipo legal</p>
      </div>

      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-md)', padding: '2rem' }}>

        <div style={grupo}>
          <label style={labelStyle}>Tipo de documento <span style={{ color: 'var(--rojo)' }}>*</span></label>
          <select style={inputStyle} value={form.tipoSolicitudId} onChange={handleTipo}>
            <option value="">Selecciona el tipo de gestión...</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>

        {tipoSeleccionado && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radio)', padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
            <div><span style={{ color: 'var(--gris-texto)' }}>Tiempo de resolución: </span><strong style={{ color: 'var(--azul)' }}>{tipoSeleccionado.horasResolucion}h</strong></div>
            <div><span style={{ color: 'var(--gris-texto)' }}>Alerta previa: </span><strong style={{ color: 'var(--naranja)' }}>{tipoSeleccionado.horasAlertaPrevia}h antes</strong></div>
          </div>
        )}

        {tipoSeleccionado?.requiereProyecto && (
          <div style={grupo}>
            <label style={labelStyle}>Proyecto <span style={{ color: 'var(--rojo)' }}>*</span></label>
            <select style={inputStyle} value={form.proyectoId} onChange={e => setForm({ ...form, proyectoId: parseInt(e.target.value) })}>
              <option value="">Selecciona el proyecto...</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        )}

        {tipoSeleccionado?.requiereEmpresa && (
          <div style={grupo}>
            <label style={labelStyle}>Empresa <span style={{ color: 'var(--rojo)' }}>*</span></label>
            <select style={inputStyle} value={form.empresaId} onChange={e => setForm({ ...form, empresaId: parseInt(e.target.value) })}>
              <option value="">Selecciona la empresa...</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombreLegal}</option>)}
            </select>
          </div>
        )}

        {camposFormulario.length > 0 && (
          <FormularioDinamico
            esquema={camposFormulario}
            valores={datosDinamicos}
            onChange={setDatosDinamicos}
          />
        )}

        {tienePartes && (
          <>
            <Seccion titulo="PARTES INVOLUCRADAS" />
            <PartesInvolucradas
              roles={esquema.roles_partes}
              docsIndividual={esquema.docs_persona_individual}
              docsJuridica={esquema.docs_persona_juridica}
              partes={partes}
              onChange={setPartes}
            />
          </>
        )}

        {tipoSeleccionado && (
          <div style={{ ...grupo, marginTop: '1.5rem' }}>
            <label style={labelStyle}>Notas adicionales</label>
            <textarea style={{ ...inputStyle, height: '90px', resize: 'vertical' }}
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Información adicional que el gestor legal deba considerar..."
            />
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 'var(--radio)', padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--rojo)', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {tipoSeleccionado && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--gris-borde)', marginTop: '1rem' }}>
            <button onClick={() => navigate('/')}
              style={{ background: 'transparent', border: '1px solid var(--gris-borde)', color: 'var(--gris-texto)', borderRadius: 'var(--radio)', padding: '0.65rem 1.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={enviando}
              style={{ background: 'var(--azul)', color: '#fff', border: 'none', borderRadius: 'var(--radio)', padding: '0.65rem 2rem', fontSize: '0.9rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", opacity: enviando ? 0.7 : 1, cursor: 'pointer' }}
              onMouseEnter={e => !enviando && (e.target.style.background = 'var(--azul-medio)')}
              onMouseLeave={e => e.target.style.background = 'var(--azul)'}>
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Seccion({ titulo }) {
  return (
    <div style={{ borderTop: '1px solid var(--gris-borde)', margin: '1.75rem 0 1.25rem', position: 'relative' }}>
      <span style={{ position: 'absolute', top: '-11px', left: '0', background: '#fff', paddingRight: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gris-texto)', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {titulo}
      </span>
    </div>
  );
}

const grupo      = { marginBottom: '1.25rem' };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--azul)', fontFamily: "'Montserrat', sans-serif" };
const inputStyle = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radio)', border: '1px solid var(--gris-borde)', fontSize: '0.9rem', color: 'var(--azul)', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' };