'use dom';

// El portal /app de la web, tal cual, dentro de la app.
//
// Es un componente DOM de Expo: en iOS y Android se pinta en una vista web incrustada en la app (con el
// código de src/web/ empaquetado dentro, no se descarga de internet) y en la web de Expo, directamente.
// Así cada bloque, texto, estilo y consulta es el mismo código que virtuousleadership.com/es/app.
// src/web/ es una copia de la web (scripts/sync-web.mjs): no se edita a mano.
//
// Lo que pone la app alrededor (el resto es de la web):
//  - Sesión: la mantiene el lado nativo y llega por props; aquí solo se usa (setSession).
//  - Rutas: las mismas que el bloque «Portal /app» de src/App.jsx de la web, en un router en memoria.
//    Lo que sale del portal (tests, páginas públicas) se abre en el navegador del móvil.
//  - Enlaces externos, WhatsApp, correo, «copiar» y «compartir» van a las funciones nativas.
//  - Avisa al lado nativo de cada cambio de pantalla (para reprogramar las notificaciones) y de
//    cuando se cierra la sesión.
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { IS_DOM } from 'expo/dom';
import type { DOMProps } from 'expo/dom';

import { RUTA_PORTAL, SITIO, type SesionPortal } from './constantes';
import { I18nProvider } from '../web/i18n';
import { supabase } from '../web/account/supabase';
import { useSession } from '../web/account/useSession';
import AppShell, { Cargando } from '../web/app/AppShell';
import Bienvenida from '../web/app/Bienvenida';
import Hoy from '../web/app/Hoy';
import CaminoDiario from '../web/app/CaminoDiario';
import Formacion from '../web/formacion/Formacion';
import Modulo from '../web/formacion/Modulo';
import ResultadoCaracter from '../web/app/ResultadoCaracter';
import Personas from '../web/app/Personas';
import Perfil from '../web/app/Perfil';
import Horarios from '../web/app/Horarios';


type Props = {
  /** Tokens de la sesión nativa (cambian cuando el lado nativo la renueva). */
  sesion: SesionPortal;
  /** Petición de ir a una pantalla (p. ej. al tocar una notificación); `n` distingue peticiones iguales. */
  ir?: { ruta: string; n: number } | null;
  abrirWeb: (url: string) => Promise<void>;
  abrirExterno: (url: string) => Promise<void>;
  copiar: (texto: string) => Promise<void>;
  compartir: (texto: string) => Promise<void>;
  onRuta: (ruta: string) => Promise<void>;
  onSesionCerrada: () => Promise<void>;
  dom?: DOMProps;
};

declare global {
  interface Window {
    __vlRuta?: () => string;
    __vlAbrirWeb?: (url: string) => void;
  }
}

const absoluta = (url: string) => (/^https?:/i.test(url) ? url : `${SITIO}${url.startsWith('/') ? '' : '/'}${url}`);
const EXTERNO = /^(https?:|mailto:|tel:|whatsapp:|sms:)/i;

export default function PortalWeb(props: Props) {
  const acciones = useRef(props);
  useEffect(() => {
    acciones.current = props;
  });
  const [lista, setLista] = useState(false);

  // La sesión nativa pasa al cliente del portal (sin guardarla ni renovarla aquí: ver account/supabase.js).
  const { access_token, refresh_token } = props.sesion;
  useEffect(() => {
    if (!supabase) return;
    let vivo = true;
    supabase.auth.setSession({ access_token, refresh_token }).finally(() => {
      if (vivo) setLista(true);
    });
    return () => {
      vivo = false;
    };
  }, [access_token, refresh_token]);

  // «Salir» o «Borrar cuenta» dentro del portal cierran también la sesión nativa.
  useEffect(() => {
    if (!supabase) return undefined;
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') acciones.current.onSesionCerrada();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Puente con el móvil: lo que en la web hace el navegador, aquí lo hace la app.
  useEffect(() => {
    window.__vlAbrirWeb = (url) => {
      acciones.current.abrirWeb(absoluta(url));
    };
    const alPulsar = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a || e.defaultPrevented) return; // los <Link> del router ya se han gestionado
      const href = a.getAttribute('href') ?? '';
      if (EXTERNO.test(href)) {
        e.preventDefault();
        acciones.current.abrirExterno(href);
      } else if (href.startsWith('/')) {
        e.preventDefault();
        acciones.current.abrirWeb(absoluta(href));
      }
    };
    document.addEventListener('click', alPulsar);
    if (IS_DOM) {
      window.open = ((url?: string | URL) => {
        if (url) acciones.current.abrirExterno(String(url));
        return null;
      }) as typeof window.open;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: (texto: string) => acciones.current.copiar(String(texto)) },
      });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (datos: ShareData) => acciones.current.compartir([datos?.text, datos?.url].filter(Boolean).join('\n')),
      });
    }
    return () => document.removeEventListener('click', alPulsar);
  }, []);

  if (!lista) return <Cargando />;

  return (
    <MemoryRouter initialEntries={[props.ir?.ruta ?? RUTA_PORTAL]}>
      <I18nProvider>
        <Rutas ir={props.ir ?? null} acciones={acciones} />
      </I18nProvider>
    </MemoryRouter>
  );
}

function Rutas({ ir, acciones }: { ir: Props['ir']; acciones: MutableRefObject<Props> }) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.__vlRuta = () => pathname;
    acciones.current.onRuta(pathname + search);
  }, [pathname, search, acciones]);

  const ultima = useRef(ir?.n);
  useEffect(() => {
    if (!ir || ir.n === ultima.current) return;
    ultima.current = ir.n;
    navigate(ir.ruta);
  }, [ir, navigate]);

  return (
    <Routes>
      {/* Igual que el bloque «Portal /app» de src/App.jsx en la web. */}
      <Route path={RUTA_PORTAL} element={<Armazon />}>
        <Route path="bienvenida" element={<Bienvenida />} />
        <Route index element={<Hoy />} />
        <Route path="camino" element={<CaminoDiario />} />
        <Route path="formacion" element={<Formacion />} />
        <Route path="formacion/:cursoId" element={<Modulo />} />
        <Route path="caracter" element={<ResultadoCaracter />} />
        <Route path="personas" element={<Personas />} />
        <Route path="personas/:personaId" element={<Personas />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="horarios" element={<Horarios />} />
      </Route>
      <Route path="*" element={<FueraDelPortal acciones={acciones} />} />
    </Routes>
  );
}

function Armazon() {
  const session = useSession() as { user: unknown } | null | undefined;
  if (!session) return <Cargando />;
  return <AppShell user={session.user} />;
}

// Enlaces del portal a páginas públicas de la web (tests, resultados…): se abren en el navegador
// del móvil y el portal vuelve a la pantalla de la que se salió.
function FueraDelPortal({ acciones }: { acciones: MutableRefObject<Props> }) {
  const { pathname, search, hash, key } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    acciones.current.abrirWeb(absoluta(pathname + search + hash));
    if (key === 'default') navigate(RUTA_PORTAL, { replace: true });
    else navigate(-1);
  }, [pathname, search, hash, key, navigate, acciones]);
  return <Cargando />;
}
