import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LocalLink as Link, useLocalPath } from '../i18n';
import { supabase } from '../account/supabase';
import { fetchFirstName } from '../account/account';
import { olvidarAcceso } from '../account/useAcceso';
import { olvidarDatos } from '../account/useDatos';
import { olvidarCatalogo } from '../formacion/useFormacion';
import logoUrl from '../assets/logo-1.png';
import { NAVY, BEIGE, MUTED, FONT_SLAB, FONT_BODY, GOLD_REF } from '../theme';
import { eyebrow, fechaLarga } from './estilos';
import { EsqueletoPagina } from './Esqueleto';
import { IconoHoy, IconoCamino, IconoFormacion } from './Iconos';

const PESTANAS = [
  { ruta: '/app', etiqueta: 'Hoy', Icono: IconoHoy },
  { ruta: '/app/camino', etiqueta: 'Camino', Icono: IconoCamino },
  { ruta: '/app/formacion', etiqueta: 'Formación', Icono: IconoFormacion },
];

function indicePestana(pathname, lp) {
  return PESTANAS.findIndex(({ ruta, bloqueada }) => !bloqueada && pathname === lp(ruta));
}

export default function AppShell({ user }) {
  const lp = useLocalPath();
  const { pathname } = useLocation();
  const [nombre, setNombre] = useState('');
  // El onboarding va limpio: sin cabecera ni burbuja de navegación.
  const enBienvenida = pathname === lp('/app/bienvenida');

  // Tipografías del portal: un <link> que se pone una sola vez (con preconnect), no un @import dentro del
  // <style>, que bloquea el pintado y hace que el texto cambie de fuente a mitad de carga.
  useEffect(() => {
    if (document.getElementById('vl-fuentes-portal')) return;
    const pre = (href, extra = {}) => { const l = document.createElement('link'); l.rel = 'preconnect'; l.href = href; Object.assign(l, extra); document.head.appendChild(l); };
    pre('https://fonts.googleapis.com');
    pre('https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
    const hoja = document.createElement('link');
    hoja.id = 'vl-fuentes-portal';
    hoja.rel = 'stylesheet';
    hoja.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap';
    document.head.appendChild(hoja);
  }, []);

  // Al cambiar de pantalla se vuelve arriba al instante (el scroll suave es solo para moverse por la página).
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname]);

  // Se precarga el código de las demás pestañas cuando el navegador está libre: así cambiar de una a otra
  // es inmediato, sin esperar a que baje cada trozo.
  useEffect(() => {
    const precargar = () => { import('./Hoy'); import('./CaminoDiario'); import('../formacion/Formacion'); import('./Perfil'); };
    const id = window.requestIdleCallback ? window.requestIdleCallback(precargar, { timeout: 2500 }) : window.setTimeout(precargar, 1200);
    return () => { if (window.cancelIdleCallback) window.cancelIdleCallback(id); else window.clearTimeout(id); };
  }, []);

  useEffect(() => {
    let vivo = true;
    fetchFirstName(user).then((n) => { if (vivo) setNombre(n); }).catch(() => {});
    return () => { vivo = false; };
  }, [user]);

  async function salir() {
    olvidarAcceso();
    olvidarCatalogo();
    olvidarDatos();
    await supabase.auth.signOut({ scope: 'local' });
  }

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(1100px 520px at 50% -8%, #fff 0%, rgba(255,255,255,0) 70%), ${BEIGE}`, fontFamily: FONT_BODY, WebkitFontSmoothing: 'antialiased', paddingBottom: enBienvenida ? 0 : 108 }}>
      <style>{`
        .vl-app { --vl-pad: clamp(18px, 4vw, 56px); --vl-max: 1600px; }
        .vl-app * { box-sizing: border-box; }

        /* ───── Estilo del portal: suave, redondeado y minimalista ─────
           Todo el portal se escribió con esquinas rectas y tipografía con serifa. En lugar de tocar cada
           pantalla, esta capa lo afina desde un solo sitio: para cambiar radios, fuentes o sombras, aquí.
           (Lo que lleva su propio borderRadius ≠ 0 en el código no se toca.) */
        .vl-app {
          --vl-r-boton: 999px; --vl-r-tarjeta: 20px; --vl-r-bloque: 14px; --vl-r-campo: 12px;
          --vl-fuente: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          --vl-fuente-titulo: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
          --vl-sombra: 0 1px 2px rgba(20,32,60,0.03), 0 6px 24px rgba(20,32,60,0.05);
          --vl-sombra-alta: 0 2px 4px rgba(20,32,60,0.04), 0 10px 30px rgba(20,32,60,0.08);
          font-family: var(--vl-fuente);
        }
        /* Fuentes: la serifa de los títulos pasa a una sans moderna, y el cuerpo a Inter. */
        .vl-app [style*="Roboto Slab"], .vl-app [font-family*="Roboto Slab"] { font-family: var(--vl-fuente-titulo) !important; }
        .vl-app [style*="Roboto,"], .vl-app [font-family*="Roboto,"] { font-family: var(--vl-fuente) !important; }
        .vl-app [style*="Roboto Slab"] { letter-spacing: -0.015em; }

        /* Esquinas: cualquier cosa con borderRadius 0 se redondea; los botones en píldora y los que son
           bloques de texto (opciones de respuesta, filas) con un radio menor para que no se deformen. */
        .vl-app [style*="border-radius: 0px"] { border-radius: var(--vl-r-bloque) !important; }
        .vl-app section[style*="border-radius: 0px"], .vl-app article[style*="border-radius: 0px"] { border-radius: var(--vl-r-tarjeta) !important; }
        .vl-app button[style*="border-radius: 0px"], .vl-app a[style*="border-radius: 0px"] { border-radius: var(--vl-r-boton) !important; }
        .vl-app button[style*="border-radius: 0px"][style*="text-align: left"], .vl-app button[style*="border-radius: 0px"][style*="width: 100%"],
        .vl-app a[style*="border-radius: 0px"][style*="width: 100%"] { border-radius: var(--vl-r-bloque) !important; }
        .vl-app input[style*="border-radius: 0px"], .vl-app textarea[style*="border-radius: 0px"], .vl-app select[style*="border-radius: 0px"] { border-radius: var(--vl-r-campo) !important; }
        /* Y lo que no declara radio (botones y campos sueltos). */
        .vl-app button { border-radius: var(--vl-r-boton); }
        .vl-app input:not([type=checkbox]):not([type=radio]), .vl-app textarea, .vl-app select { border-radius: var(--vl-r-campo); }

        /* Campos: foco suave en lugar del contorno duro del navegador. */
        .vl-app input:not([type=checkbox]):not([type=radio]):focus, .vl-app textarea:focus, .vl-app select:focus {
          outline: none; border-color: ${GOLD_REF} !important; box-shadow: 0 0 0 4px rgba(165,139,38,0.18);
        }

        /* Movimiento de botones y enlaces: se elevan un poco al pasar y se hunden al pulsar. */
        .vl-app button, .vl-app a { transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease, border-color 180ms ease, opacity 180ms ease; }
        .vl-app button:not(:disabled):hover { transform: translateY(-1px); }
        .vl-app button:not(:disabled):active { transform: translateY(0) scale(0.985); }
        .vl-app button:disabled { cursor: default; }
        @media (prefers-reduced-motion: reduce) { .vl-app button:not(:disabled):hover, .vl-app button:not(:disabled):active { transform: none; } }
        .vl-app a:focus-visible, .vl-app button:focus-visible { outline: 3px solid rgba(165,139,38,0.55); outline-offset: 3px; }

        @keyframes vl-puntos { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }

        /* Transiciones: fundidos suaves, sin desenfoque ni zoom. La página entera entra con un fundido; las
           tarjetas que aparecen dentro (paso a paso en los ejercicios) suben un poco al entrar. */
        @keyframes vl-pagina { from { opacity: 0; } to { opacity: 1; } }
        @keyframes vl-entra { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes vl-entra-der { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
        @keyframes vl-entra-izq { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: none; } }
        .vl-pagina    { animation: vl-pagina    220ms ease-out backwards; }
        .vl-entra     { animation: vl-entra     280ms cubic-bezier(.22,.61,.36,1) backwards; }
        .vl-entra-der { animation: vl-entra-der 280ms cubic-bezier(.22,.61,.36,1) backwards; }
        .vl-entra-izq { animation: vl-entra-izq 280ms cubic-bezier(.22,.61,.36,1) backwards; }

        /* Marcadores mientras carga */
        @keyframes vl-brillo { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
        .vl-esqueleto {
          border-radius: 12px; background-size: 400% 100%;
          background-image: linear-gradient(90deg, rgba(27,42,74,0.05) 25%, rgba(27,42,74,0.10) 37%, rgba(27,42,74,0.05) 63%);
          animation: vl-brillo 1.6s ease infinite;
        }

        /* Scroll agradable: suave al moverse por la página (con movimiento reducido, no) y barra discreta. */
        @media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
        html { scroll-padding-top: 24px; scrollbar-width: thin; scrollbar-color: rgba(27,42,74,0.22) transparent; }
        body { overscroll-behavior-y: none; }

        /* Grid responsive */
        .vl-cols { display: flex; flex-direction: column; gap: 14px; }
        @media (min-width: 768px) {
          .vl-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: start; }
          .vl-cols > .vl-ancho { grid-column: 1 / -1; }
        }
        @media (min-width: 1500px) { .vl-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (min-width: 2000px) { .vl-cols-3 { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        /* Desktop: cabecera más espaciosa */
        @media (min-width: 960px) {
          .vl-header { padding-top: 28px !important; padding-bottom: 6px !important; }
          .vl-main   { padding-top: 20px !important; }
        }
        @media (min-width: 1920px) {
          .vl-app { --vl-max: 1700px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .vl-pagina, .vl-entra, .vl-entra-der, .vl-entra-izq, .vl-esqueleto { animation: none; }
          .vl-slider-pista, .vl-slider-ventana { transition: none !important; }
        }

        .vl-mi-cuenta:hover { background: rgba(165,139,38,0.12) !important; }
        .vl-fila-persona:hover { background: rgba(27,42,74,0.04) !important; }
        /* En pantallas estrechas «Mi cuenta» queda solo en el círculo, para que quepa el nombre. */
        @media (max-width: 520px) {
          .vl-mi-cuenta { padding: 4px !important; }
          .vl-mi-cuenta > span:last-child { display: none; }
        }

        /* Tarjeta paginada: altura fija mínima y botones siempre en el mismo sitio */
        .vl-pag { display: flex; flex-direction: column; min-height: clamp(320px, calc(100vh - 420px), 440px); }
        /* La columna derecha arranca a la misma altura que la tarjeta de la izquierda aunque el bloc sea lo primero. */
        .vl-split-notas-col > :first-child, .vl-video-lado > :first-child { margin-top: 0 !important; }
        .vl-pag > .vl-pag-cuerpo { flex: 1 0 auto; justify-content: center; }
        @media (max-width: 700px) { .vl-pag { min-height: 400px; } }

        /* Tarjeta de pregunta: altura fija mínima, contenido arriba y botones anclados abajo */
        .vl-pag-pregunta { display: flex; flex-direction: column; }
        .vl-pag-pregunta > .vl-pag-nav { margin-top: auto !important; padding-top: 16px; }
        @media (min-width: 1100px) { .vl-pag-pregunta--fija { min-height: 530px; } .vl-pag-pregunta--quiz { min-height: 590px; } }

        /* Ejercicio en dos columnas: el contenido nunca queda más bajo que el bloc de notas */
        @media (min-width: 1100px) {
          .vl-split-contenido { min-height: var(--vl-lado-base, 0px); display: flex; flex-direction: column; position: sticky; top: 60px; }
          .vl-split-contenido > * { flex: 1 0 auto; display: flex; flex-direction: column; }
          .vl-split-contenido > * > :last-child { flex: 1 0 auto; }
        }
      `}</style>
      <div className="vl-app">
        {!enBienvenida && <header className="vl-header" style={{ maxWidth: 'var(--vl-max)', margin: '0 auto', padding: '20px var(--vl-pad) 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/app" aria-label="Virtuous Leadership" style={{ display: 'flex' }}>
            <img src={logoUrl} alt="" width="34" height="34" style={{ display: 'block' }} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={eyebrow}>{fechaLarga()}</div>
            <div style={{ fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700, color: NAVY, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nombre ? `Hola, ${nombre}` : 'Hola'}
            </div>
          </div>
          <Link to="/app/perfil" className="vl-mi-cuenta" style={{
            display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
            color: pathname.startsWith(lp('/app/perfil')) ? NAVY : MUTED,
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, padding: '4px 12px 4px 4px', borderRadius: 999,
            background: pathname.startsWith(lp('/app/perfil')) ? 'rgba(165,139,38,0.14)' : 'rgba(27,42,74,0.05)',
            transition: 'background 200ms ease, color 200ms ease',
          }}>
            <span style={{
              width: 30, height: 30, background: NAVY, borderRadius: '50%',
              display: 'grid', placeItems: 'center', color: '#fff', fontSize: 14, fontWeight: 700,
              flexShrink: 0,
            }}>
              {nombre ? nombre[0].toUpperCase() : '?'}
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>Mi cuenta</span>
          </Link>
        </header>}

        <main className="vl-main vl-pagina" key={pathname}
              style={{ maxWidth: 'var(--vl-max)', margin: '0 auto', padding: '20px var(--vl-pad) 0' }}>
          <Suspense fallback={<EsqueletoPagina />}>
            <Outlet context={{ user }} />
          </Suspense>
        </main>

        {!enBienvenida && <NavBurbuja pathname={pathname} lp={lp} />}
      </div>
    </div>
  );
}

function NavBurbuja({ pathname, lp }) {
  const contenedorRef = useRef(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [toast, setToast] = useState(false);
  const indiceActivo = indicePestana(pathname, lp);

  useEffect(() => {
    const nav = contenedorRef.current;
    if (!nav || indiceActivo < 0) return;
    const enlaces = nav.querySelectorAll('[data-tab]');
    const el = enlaces[indiceActivo];
    if (!el) return;
    setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [indiceActivo]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <nav aria-label="Navegación principal" style={{
      position: 'fixed', left: 0, right: 0, bottom: 'max(16px, env(safe-area-inset-bottom))',
      display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', zIndex: 950, gap: 10,
    }}>
      {toast && (
        <div role="status" style={{
          pointerEvents: 'none', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, borderRadius: 999,
          color: NAVY, background: 'rgba(255,255,255,0.92)', padding: '10px 20px',
          boxShadow: '0 2px 12px rgba(15,29,56,0.15)',
          backdropFilter: 'blur(8px)', animation: 'vl-entra 280ms ease both',
        }}>
          Próximamente
        </div>
      )}
      <div ref={contenedorRef} style={{
        pointerEvents: 'auto', display: 'flex', gap: 4, padding: 6, borderRadius: 999,
        background: 'rgba(255,255,255,0.78)', boxShadow: '0 8px 32px rgba(20,32,60,0.16), 0 1px 0 rgba(255,255,255,0.7) inset', border: '1px solid rgba(27,42,74,0.06)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        position: 'relative',
      }}>
        {indiceActivo >= 0 && pill.width > 0 && (
          <span aria-hidden style={{
            position: 'absolute', top: 6, height: 'calc(100% - 12px)',
            left: pill.left, width: pill.width,
            background: 'rgba(165,139,38,0.16)', borderRadius: 999,
            transition: 'left 320ms cubic-bezier(.4,0,.2,1), width 320ms cubic-bezier(.4,0,.2,1)',
            pointerEvents: 'none',
          }} />
        )}
        {PESTANAS.map(({ ruta, etiqueta, Icono, bloqueada }) => {
          const activa = !bloqueada && pathname === lp(ruta);
          if (bloqueada) {
            return (
              <button key={ruta} type="button" data-tab onClick={() => setToast(true)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 84,
                padding: '9px 14px 8px', border: 'none', cursor: 'pointer',
                color: MUTED, background: 'transparent', opacity: 0.55,
                fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 500, letterSpacing: '0.02em',
                position: 'relative', zIndex: 1,
              }}>
                <Icono />
                {etiqueta}
              </button>
            );
          }
          return (
            <Link key={ruta} to={ruta} data-tab aria-current={activa ? 'page' : undefined} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 72,
              padding: '7px 12px 6px', textDecoration: 'none', borderRadius: 999,
              fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.01em',
              position: 'relative', zIndex: 1,
              color: activa ? NAVY : MUTED, background: 'transparent',
              fontWeight: activa ? 700 : 500,
              transition: 'color 200ms ease',
            }}>
              <Icono />
              {etiqueta}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div style={{ minHeight: '100vh', background: BEIGE, display: 'grid', placeItems: 'center', color: MUTED, fontFamily: FONT_BODY, fontSize: 15 }}>
      <span style={{ color: NAVY }}>{texto}</span>
    </div>
  );
}
