/**
 * EXTENSIÓN del guion de la noche (no es copia del 02). Se añade DESPUÉS de los bloques del 02,
 * que siguen generándose literalmente desde 02_Prompts_sistema.md (prompts.ts) y no se tocan.
 *
 * Motivo: el consejo de la noche (el propósito de mañana, paso 5) debe ajustarse a lo que la
 * persona ha contado en el examen: sus hechos, si cumplió el reto y cómo falló, y las señales
 * que han salido. El 02 solo pide encajar la situación de mañana.
 *
 * Qué viaja al modelo (03 §6): solo datos de ESTA noche (botones y señales extraídas de la misma
 * conversación) y, como máximo, los nombres de obstáculos que se repiten en 14 días (valores de un
 * catálogo de siete, sin texto libre de noches anteriores). Pendiente de revisión editorial.
 */
import type { Resultado, TipoFallo } from './tipos.ts';

export const AJUSTE_NOCHE = `AJUSTES DE LA CONVERSACIÓN (completan el guion; no lo sustituyen)

Lo que la persona cuenta esta noche es la materia de tu consejo. En el paso 5:
- Parte de sus hechos: el momento, las personas (con su token) y lo que dijo que le costó. No inventes ninguno. Si apenas ha contado algo, elige el candidato más afín al reto de hoy y no finjas conocer su día.
- Si hoy no cumplió el reto y falló la decisión, elige entre los candidatos el de la misma virtud con menos intensidad (si no hay, el de menos intensidad) y plantéalo como un paso más pequeño, nunca como más exigencia.
- Si falló la primera reacción, que el propósito empiece por el momento concreto de mañana en que puede repetirse: "En la reunión con [P2], antes de responder, ...".
- Si cumplió el reto con soltura, puedes elegir uno con una intensidad más, sin pasar de nivel actual + 1.
- Si en lo que cuenta aparece una de las señales del guion o un obstáculo de los datos de abajo, elige el candidato que lo combata, sin nombrarlo ni etiquetar a la persona.
- Una sola frase de menos de 30 palabras, en segunda persona, sin explicar la teoría ni dar varios consejos a la vez. El propósito dice qué hará y cuándo, no por qué le conviene.`;

const FALLO: Record<TipoFallo, string> = {
  reaccion: 'falló la primera reacción',
  decision: 'falló la decisión',
};

export interface DatosNoche {
  /** Lo que marcó con los botones (determinista). */
  resultado: Resultado | null;
  tipo_fallo: TipoFallo | null;
  /** Señales que el modelo ha extraído de esta misma conversación (ya validadas contra el catálogo). */
  obstaculosHoy: string[];
  /** Obstáculos que se repiten ≥ 3 veces en 14 días, contando esta noche. */
  obstaculosRepetidos: { obstaculo: string; veces: number }[];
}

/** Bloque «datos del motor» para el sistema de la noche, o null si no hay nada que decir. */
export function datosDelMotor(d: DatosNoche): string | null {
  const lineas: string[] = [];
  if (d.resultado === 'si') lineas.push('- Reto de hoy: cumplido.');
  else if (d.resultado === 'a_medias') {
    lineas.push(`- Reto de hoy: cumplido a medias${d.tipo_fallo ? `; ${FALLO[d.tipo_fallo]}` : ''}.`);
  } else if (d.resultado === 'no') {
    lineas.push(`- Reto de hoy: no cumplido${d.tipo_fallo ? `; ${FALLO[d.tipo_fallo]}` : ''}.`);
  }
  if (d.obstaculosHoy.length) lineas.push(`- Señales que han aparecido esta noche: ${d.obstaculosHoy.join(', ')}.`);
  if (d.obstaculosRepetidos.length) {
    lineas.push(
      `- Se repite en las dos últimas semanas: ${d.obstaculosRepetidos.map((o) => `${o.obstaculo} (${o.veces} veces)`).join(', ')}.`,
    );
  }
  if (!lineas.length) return null;
  return `DATOS DEL SISTEMA SOBRE ESTA NOCHE (úsalos al elegir y redactar; no los cites como «datos»):\n${lineas.join('\n')}`;
}
