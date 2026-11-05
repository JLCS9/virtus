// localStorage de la web → AsyncStorage, con las mismas claves y el mismo JSON.
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function leerJSON<T>(clave: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function guardarJSON(clave: string, valor: unknown) {
  AsyncStorage.setItem(clave, JSON.stringify(valor)).catch(() => {
    /* sin almacenamiento */
  });
}
