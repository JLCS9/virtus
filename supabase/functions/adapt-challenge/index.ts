/**
 * Adapta el reto base del día a la vida de la persona. La IA solo redacta: no conversa,
 * no inventa doctrina, no diagnostica. Si algo falla devuelve { text: null } y la app
 * muestra el reto base. Solo se envía lo mínimo (alias, rol, temperamento, cómo fue ayer).
 * Usar una organización de Anthropic sin retención de datos para entrenamiento.
 */
import Anthropic from 'npm:@anthropic-ai/sdk';

import { cors, json, userContext } from '../_shared/http.ts';

const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-opus-5';
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

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
- No interpretes emociones ni diagnostiques. Entre 25 y 200 caracteres.`;

const SCHEMA = {
  type: 'object',
  properties: { text: { type: 'string', description: 'El reto adaptado, listo para mostrar.' } },
  required: ['text'],
  additionalProperties: false,
};

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
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ['server-side-fallback-2026-07-01'],
      // Si el modelo declina, la API reintenta con el modelo recomendado.
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(input) }],
    } as never);
    const msg = response as unknown as { stop_reason: string; content: { type: string; text?: string }[] };
    if (msg.stop_reason !== 'end_turn') return json({ text: null });
    const block = msg.content.find((b) => b.type === 'text');
    const text = block?.text ? (JSON.parse(block.text) as { text: string }).text.trim() : null;
    if (!text || text.length < 25 || text.length > 200 || /[{}]/.test(text)) return json({ text: null });
    return json({ text });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.warn('adapt-challenge: rate limited');
    else if (error instanceof Anthropic.APIError) console.error('adapt-challenge:', error.status, error.message);
    else console.error('adapt-challenge:', error);
    return json({ text: null });
  }
});
