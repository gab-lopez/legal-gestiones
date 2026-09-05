import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCog } from 'lucide-react';

// Usuarios de datos de prueba (Querys/SQLQuery_2.sql). Solo se usa cuando
// VITE_AUTH_DISABLED=true, para poder probar cada rol sin editar
// appsettings.Development.json ni reiniciar el backend.
const USUARIOS_PRUEBA = [
  { correo: 'dgabriel@rvcuatro.com',      nombre: 'Darvin Gabriel',           rol: 'Administrador' },
  { correo: 'amenegazzo@rvcuatro.com',    nombre: 'Alejandro Menegazzo',      rol: 'Administrador' },
  { correo: 'dvillafuerte@rvcuatro.com',  nombre: 'Dania Villafuerte',        rol: 'Gestor Legal' },
  { correo: 'hpalma@rvcuatro.com',        nombre: 'Heidy Palma',              rol: 'Solicitante' },
  { correo: 'fjimenez@rvcuatro.com',      nombre: 'Fredy Jiménez',            rol: 'Solicitante' },
  { correo: 'mgcastellanos@rvcuatro.com', nombre: 'Mayra Castellanos',        rol: 'Solicitante' },
  { correo: 'jlima@rvcuatro.com',         nombre: 'Juan José Lima',           rol: 'Solicitante' },
  { correo: 'mlgarcia@rvcuatro.com',      nombre: 'María de Lourdes García',  rol: 'Solicitante' },
  { correo: 'cordonez@rvcuatro.com',      nombre: 'Carlos Ordoñez',           rol: 'Solicitante' },
  { correo: 'ecaxaj@rvcuatro.com',        nombre: 'Eddy Caxaj',               rol: 'Solicitante' },
  { correo: 'jlantan@rvcuatro.com',       nombre: 'Juan Francisco Lantán',    rol: 'Solicitante' },
];

export default function DevUserSwitcher() {
  const { usuario } = useAuth();
  const [valor, setValor] = useState(
    localStorage.getItem('devUserEmail') || usuario?.correo || USUARIOS_PRUEBA[0].correo
  );

  const cambiar = (correo) => {
    setValor(correo);
    localStorage.setItem('devUserEmail', correo);
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '14px',
      right: '14px',
      zIndex: 999,
      background: '#1f2937',
      border: '1px solid #efcc0b',
      borderRadius: '10px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <UserCog size={14} color="#efcc0b" style={{ flexShrink: 0 }} />
      <span style={{ color: '#efcc0b', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Dev
      </span>
      <select
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        style={{
          background: '#111827',
          color: '#fff',
          border: '1px solid #374151',
          borderRadius: '6px',
          padding: '4px 6px',
          fontSize: '0.78rem',
          cursor: 'pointer',
          maxWidth: '260px',
        }}
      >
        {USUARIOS_PRUEBA.map(u => (
          <option key={u.correo} value={u.correo}>
            {u.nombre} — {u.rol}
          </option>
        ))}
      </select>
    </div>
  );
}
