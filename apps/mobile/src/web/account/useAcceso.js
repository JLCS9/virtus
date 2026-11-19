import { useEffect, useState } from 'react';
import { tieneAccesoRetos } from './retos';

// ¿Tiene la cuenta la suscripción a Retos activa? `undefined` mientras se comprueba.
// Solo decide qué interfaz enseñar: el servidor lo exige igualmente en cada llamada.
let ultimo; // se recuerda entre pestañas para que la barra inferior no parpadee

export function useAcceso(activo = true) {
  const [acceso, setAcceso] = useState(ultimo);
  useEffect(() => {
    if (!activo) return undefined;
    let vivo = true;
    tieneAccesoRetos()
      .then((ok) => { ultimo = ok; if (vivo) setAcceso(ok); })
      .catch(() => { if (vivo) setAcceso(false); });
    return () => { vivo = false; };
  }, [activo]);
  return activo ? acceso : undefined;
}

export function olvidarAcceso() { ultimo = undefined; }
