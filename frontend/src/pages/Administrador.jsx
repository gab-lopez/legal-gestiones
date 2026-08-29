import { useState } from 'react';
import { Settings, Building2, Users, FileText, FolderOpen, Shield } from 'lucide-react';
import AdminSociedades from '../components/admin/AdminSociedades';
import AdminUsuarios from '../components/admin/AdminUsuarios';
import AdminProyectos from '../components/admin/AdminProyectos';
import AdminEmpresas from '../components/admin/AdminEmpresas';
import AdminTipos from '../components/admin/AdminTipos';
import AdminUnidades from '../components/admin/AdminUnidades';


const secciones = [
  { id: 'sociedades', label: 'Sociedades',       Icono: Shield,    componente: AdminSociedades },
  { id: 'usuarios',   label: 'Usuarios',          Icono: Users,     componente: AdminUsuarios   },
  { id: 'empresas',   label: 'Empresas',          Icono: Building2, componente: AdminEmpresas   },
  { id: 'unidades', label: 'Unidades', Icono: FolderOpen, componente: AdminUnidades },
  { id: 'tipos',      label: 'Tipos y SLAs',      Icono: FileText,  componente: AdminTipos      },
];

export default function Administrador() {
  const [seccionActiva, setSeccionActiva] = useState('sociedades');
  const SeccionActual = secciones.find(s => s.id === seccionActiva)?.componente;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>

      {/* Sidebar */}
      <div style={{ background: 'var(--blanco)', borderRadius: 'var(--radio-lg)', boxShadow: 'var(--sombra-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gris-borde)', background: 'var(--azul)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={16} color="rgba(255,255,255,0.8)" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Administrador
            </span>
          </div>
        </div>
        <nav style={{ padding: '0.5rem 0' }}>
          {secciones.map(({ id, label, Icono }) => (
            <button key={id} onClick={() => setSeccionActiva(id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1.25rem', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: seccionActiva === id ? 600 : 400, background: seccionActiva === id ? '#eff6ff' : 'transparent', color: seccionActiva === id ? 'var(--azul-claro)' : 'var(--azul)', borderLeft: seccionActiva === id ? '3px solid var(--azul-claro)' : '3px solid transparent', textAlign: 'left', transition: 'all 0.15s' }}>
              <Icono size={15} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido */}
      <div>
        {SeccionActual && <SeccionActual />}
      </div>
    </div>
  );
}