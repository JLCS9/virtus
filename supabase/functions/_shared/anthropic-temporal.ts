/**
 * TEMPORAL — excepción explícita al principio 4 mientras AWS activa Bedrock en la cuenta.
 * Claude por la API de Anthropic, solo para cuentas con feature_access 'retos_anthropic_directo'
 * (hoy, solo la de Jose y con datos de prueba). El texto ya llega seudonimizado igual que a
 * Bedrock. Retirar este fichero, el secreto ANTHROPIC_API_KEY y la fila de feature_access en
 * cuanto Bedrock funcione.
 */
import Anthropic from 'npm:@anthropic-ai/sdk';

import type { Modelo } from '../../../packages/method/src/retos/index.ts';

import { RespuestaRechazada } from './bedrock.ts';

const MODELO_COACH = 'claude-opus-5-5';
const MODELO_CLASIFICADOR = 'claude-haiku-5-5';

let cliente: Anthropic | null = null;
function anthropic(): Anthropic {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('ANTHROPIC_API_KEY no está configurado');
  cliente ??= new Anthropic({ apiKey: key, maxRetries: 2, timeout: 60_000 });
  return cliente;
}

export const modeloAnthropicDirecto: Modelo = {
  completar: async ({ uso, sistema, mensajes }) => {
    const coach = uso !== 'clasificador';
    const msg = await anthropic().beta.messages.create({
      model: coach ? MODELO_COACH : MODELO_CLASIFICADOR,
      max_tokens: coach ? 8000 : 2000,
      ...(sistema ? { system: sistema } : {}),
      messages: mensajes.map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto })),
      output_config: { effort: 'low' },
      // Si Opus declina por un clasificador de seguridad, la API reintenta con el modelo indicado.
      ...(coach ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
    } as never);
    const r = msg as unknown as { stop_reason: string; content: { type: string; text?: string }[] };
    if (r.stop_reason === 'refusal') throw new RespuestaRechazada('refusal');
    if (r.stop_reason === 'max_tokens') throw new Error('respuesta cortada por max_tokens');
    const texto = r.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('')
      .trim();
    if (!texto) throw new Error('respuesta vacía');
    return texto;
  },
};
