/**
 * Adapta el reto base del día a la vida de la persona. La IA solo redacta: no conversa,
 * no inventa doctrina, no diagnostica. Si algo falla devuelve { text: null } y la app
 * muestra el reto base. Solo se envía lo mínimo (alias, rol, temperamento, cómo fue ayer).
 * El modelo se consume por Amazon Bedrock en región UE (ver _shared/bedrock.ts).
 */
import { completarTexto, MODELO_COACH, RespuestaRechazada } from '../_shared/bedrock.ts';
import { cors, json, userContext } from '../_shared/http.ts';

const TEMPERAMENT = { COL: 'colérico', MEL: 'melancólico', SAN: 'sanguíneo', FLE: 'flemático' } as const;
type T = keyof typeof TEMPERAMENT;

const SYSTEM = `Adaptas retos diarios del sistema de Liderazgo Virtuoso de Alexandre Havard.
Recibes un reto base escrito por el equipo editorial y lo reescribes para la vida concreta de una persona.

Reglas:
- Conserva la virtud, la intención y la acción del reto base. No añadas doctrina ni consejos.
- Una sola frase o dos muy breves, en español, tuteando, directa y exigente, como los libros de Alex.
- Concreta y verificable hoy. Si hay rol o persona, el reto ocurre en ese rol o con esa persona (usa el alias tal cual).
- El temperamento secundario modula la dificultad: no lo nombres ni etiquetes a la persona.
- Si ayer prevaleció la primera reacción, haz el reto un poco más pequeño y alcanzable; si cumplió, mantén la exigencia.
- Nunca uses: mindset, empoderar, coaching, KPI, soft skills, zona de confort, ni lenguaje de venta.
- No interpretes emociones ni diagnostiques. Entre 25 y 200 caracteres.
- Responde solo con un objeto JSON {"text": "<el reto adaptado>"}, sin texto antes ni después.`;

interface Body {
  baseId: string;
  baseText: string;
  virtue: string;
  role: string | null;
  dominant: T;
  secondary: T | null;
  yesterday: { secondPrevailed: boolean | null; challengeDone: string | null } | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await userContext(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ text: null });
  }

  // El texto base de referencia es el de la biblioteca editorial si existe.
  const { data: base } = await ctx.db.from('challenges_base').select('text').eq('id', body.baseId).maybeSingle();
  const input = {
    reto_base: body.baseText || base?.text,
    virtud: body.virtue,
    rol: body.role,
    temperamento_dominante: TEMPERAMENT[body.dominant],
    temperamento_secundario: body.secondary ? TEMPERAMENT[body.secondary] : null,
    ayer: body.yesterday,
  };
  if (!input.reto_base) return json({ text: null });

  try {
    const salida = await completarTexto({
      modelo: MODELO_COACH,
      sistema: SYSTEM,
      mensajes: [{ role: 'user', content: JSON.stringify(input) }],
      maxTokens: 4000,
    });
    const raw = salida.slice(salida.indexOf('{'), salida.lastIndexOf('}') + 1);
    const text = raw ? (JSON.parse(raw) as { text?: string }).text?.trim() ?? null : null;
    if (!text || text.length < 25 || text.length > 200 || /[{}]/.test(text)) return json({ text: null });
    return json({ text });
  } catch (error) {
    if (error instanceof RespuestaRechazada) console.warn('adapt-challenge: rechazada');
    else console.error('adapt-challenge:', (error as Error).message);
    return json({ text: null });
  }
});
