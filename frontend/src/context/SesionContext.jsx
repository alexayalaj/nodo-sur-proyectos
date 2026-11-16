import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { borrarSesion, guardarSesion, leerSesion, registrarCierreDeSesion } from '../api/cliente.js';

const SesionContext = createContext(null);

// Lee la fecha de expiración (exp, en segundos) del payload del JWT
function expiracion(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch (e) {
    return null;
  }
}

function sesionInicial() {
  const guardada = leerSesion();
  if (!guardada?.token) return null;
  const exp = expiracion(guardada.token);
  if (!exp || exp <= Date.now()) {
    borrarSesion();
    return null;
  }
  return guardada;
}

const MOTIVOS = {
  TOKEN_INVALIDO: 'Tu sesión expiró o ya no es válida. Inicia sesión de nuevo.',
  CUENTA_DESACTIVADA: 'Tu cuenta está desactivada. Contacta a un administrador.',
  EXPIRADA: 'Tu sesión expiró. Inicia sesión de nuevo.',
};

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(sesionInicial);
  const [aviso, setAviso] = useState('');

  const iniciarSesion = useCallback((token, usuario) => {
    const nueva = { token, usuario };
    guardarSesion(nueva);
    setAviso('');
    setSesion(nueva);
  }, []);

  const cerrarSesion = useCallback((motivo) => {
    borrarSesion();
    setSesion(null);
    setAviso(MOTIVOS[motivo] || '');
  }, []);

  // El cliente de la API avisa cuando el servidor rechaza el token
  useEffect(() => {
    registrarCierreDeSesion(cerrarSesion);
  }, [cerrarSesion]);

  // Cierre automático cuando llega la hora de expiración del token
  useEffect(() => {
    if (!sesion) return undefined;
    const exp = expiracion(sesion.token);
    const restante = exp ? exp - Date.now() : 0;
    const temporizador = setTimeout(() => cerrarSesion('EXPIRADA'), Math.min(Math.max(restante, 0), 2147483647));
    return () => clearTimeout(temporizador);
  }, [sesion, cerrarSesion]);

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario || null,
      token: sesion?.token || null,
      rol: sesion?.usuario?.rol || null,
      esAdmin: sesion?.usuario?.rol === 'admin',
      aviso,
      limpiarAviso: () => setAviso(''),
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion, aviso, iniciarSesion, cerrarSesion]
  );
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) throw new Error('useSesion debe usarse dentro de SesionProvider.');
  return contexto;
}
