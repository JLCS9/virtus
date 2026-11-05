// Datos locales que lee «Mi cuenta». En la web viven en localStorage con estas claves
// (src/formacion/useModulo.js → `vl-modulo:${userId}:${moduloId}`, useNotas.js → `vl-notas:${userId}:${moduloId}`);
// en la app, en AsyncStorage con las mismas claves.
 
import AsyncStorage from '@react-native-async-storage/async-storage';

export const claveModulo = (userId: string, moduloId: string) => `vl-modulo:${userId}:${moduloId}`;
export const claveNotas = (userId: string, moduloId: string) => `vl-notas:${userId}:${moduloId}`;

/** Síntesis del cierre del Curso 1 (paso m1-27), o null. Igual que leerSintesis() de Perfil.jsx. */
export async function leerSintesis(userId: string, moduloId: string): Promise<Record<string, any> | null> {
  try {
    const bruto = JSON.parse((await AsyncStorage.getItem(claveModulo(userId, moduloId))) ?? 'null');
    const cierre = bruto?.completados?.['m1-27'];
    if (!cierre || !cierre.lo_que_facilita) return null;
    return cierre;
  } catch {
    return null;
  }
}

/** Notas guardadas de un módulo ({ pasoId: [{ id, fecha, texto }] }), o null. */
export async function leerNotasModulo(userId: string, moduloId: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem(claveNotas(userId, moduloId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * «Vaciar caché y recargar». La web hace localStorage.clear() + sessionStorage.clear(). En la app solo se
 * borran los datos locales de la web portada (claves `vl-…`): borrar todo AsyncStorage borraría también la
 * sesión de Supabase y el estado del resto de la app.
 */
export async function vaciarCacheLocal() {
  try {
    const claves = await AsyncStorage.getAllKeys();
    const nuestras = claves.filter((k) => k.startsWith('vl-'));
    if (nuestras.length) await AsyncStorage.multiRemove(nuestras);
  } catch {
    /* como en la web: si falla, se sigue */
  }
}
