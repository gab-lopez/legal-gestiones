import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { MsalAuthenticationTemplate } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';
import { AuthProvider, useAuth } from './context/AuthContext';
import { loginRequest } from './authConfig';
import { LayoutDashboard, FilePlus, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import NuevaSolicitud from './pages/NuevaSolicitud';
import DetalleSolicitud from './pages/DetalleSolicitud';
import Administrador from './pages/Administrador';

const navItems = [
  { to: '/',                label: 'Dashboard',       Icono: LayoutDashboard },
  { to: '/nueva-solicitud', label: 'Nueva solicitud', Icono: FilePlus },
];

function Sidebar({ expandido, setExpandido }) {
  const { usuario, logout } = useAuth();
  const w = expandido ? '220px' : '64px';

  return (
    <aside style={{
      width: w,
      minHeight: '100vh',
      background: 'var(--azul)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 100,
      boxShadow: '2px 0 8px rgba(2,29,57,0.15)',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
    }}>

      {/* Logo + hamburguesa */}
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: expandido ? 'space-between' : 'center', minHeight: '64px' }}>
        {expandido && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="RV4" style={{ height: '32px', objectFit: 'contain' }}
              onError={e => e.target.style.display = 'none'} />
            <div>
              <div style={{ color: '#efcc0b', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Legal</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gestiones</div>
            </div>
          </div>
        )}
        <button onClick={() => setExpandido(!expandido)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {expandido ? <X size={18} color="rgba(255,255,255,0.7)" /> : <Menu size={18} color="rgba(255,255,255,0.7)" />}
        </button>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '0.75rem 0' }}>
        {navItems.map(({ to, label, Icono }) => (
          <NavLink key={to} to={to} end={to === '/'}
            title={!expandido ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: expandido ? '0.75rem' : '0',
              justifyContent: expandido ? 'flex-start' : 'center',
              padding: expandido ? '0.7rem 1.25rem' : '0.7rem',
              color: isActive ? '#efcc0b' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'rgba(239,204,11,0.08)' : 'transparent',
              borderLeft: isActive ? '3px solid #efcc0b' : '3px solid transparent',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}>
            <Icono size={17} style={{ flexShrink: 0 }} />
            {expandido && label}
          </NavLink>
        ))}

        {usuario?.rolId === 1 && (
          <NavLink to="/admin"
            title={!expandido ? 'Administrador' : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: expandido ? '0.75rem' : '0',
              justifyContent: expandido ? 'flex-start' : 'center',
              padding: expandido ? '0.7rem 1.25rem' : '0.7rem',
              color: isActive ? '#efcc0b' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'rgba(239,204,11,0.08)' : 'transparent',
              borderLeft: isActive ? '3px solid #efcc0b' : '3px solid transparent',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}>
            <Settings size={17} style={{ flexShrink: 0 }} />
            {expandido && 'Administrador'}
          </NavLink>
        )}
      </nav>

      {/* Usuario y logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: expandido ? '1rem' : '0.75rem', display: 'flex', flexDirection: 'column', alignItems: expandido ? 'stretch' : 'center', gap: '0.5rem' }}>
        {expandido && usuario && (
          <div style={{ marginBottom: '0.25rem' }}>
            <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usuario.nombres} {usuario.apellidos}
            </div>
            <div style={{ color: '#efcc0b', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
              {usuario.rol}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usuario.area}
            </div>
          </div>
        )}
        <button onClick={logout} title={!expandido ? 'Cerrar sesión' : undefined}
          style={{ display: 'flex', alignItems: 'center', justifyContent: expandido ? 'flex-start' : 'center', gap: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radio)', padding: expandido ? '0.5rem 0.75rem' : '0.5rem', fontSize: '0.82rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#efcc0b'; e.currentTarget.style.color = '#efcc0b'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
          <LogOut size={14} style={{ flexShrink: 0 }} />
          {expandido && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}

function Layout() {
  const { cargando } = useAuth();
  const [expandido, setExpandido] = useState(true);

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--azul)' }}>
      <div style={{ color: '#efcc0b', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>Cargando...</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar expandido={expandido} setExpandido={setExpandido} />
      <main style={{ marginLeft: expandido ? '220px' : '64px', flex: 1, padding: '2rem', background: 'var(--gris-fondo)', minHeight: '100vh', transition: 'margin-left 0.25s ease' }}>
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/nueva-solicitud" element={<NuevaSolicitud />} />
          <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
          <Route path="/admin"           element={<Administrador />} />
          <Route path="*"                element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

export default function App() {
  // Con VITE_AUTH_DISABLED=true (frontend/.env.local) nos saltamos el redirect a
  // Microsoft por completo. Debe ir junto con Auth:Enabled=false en el backend.
  if (AUTH_DISABLED) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginRequest}
      >
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </MsalAuthenticationTemplate>
    </BrowserRouter>
  );
}