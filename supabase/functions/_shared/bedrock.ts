/**
 * Claude en Amazon Bedrock, región UE (principio 4: nunca la API de Anthropic directamente).
 * Endpoint Messages de Bedrock («Claude in Amazon Bedrock»): https://bedrock-mantle.{región}.api.aws/anthropic
 * con la API key de Bedrock como bearer. Sin registro de invocaciones en la cuenta de AWS
 * (o limitado a texto seudonimizado) y sin compartir datos con el proveedor.
 *
 * Secretos: AWS_BEARER_TOKEN_BEDROCK (API key de Bedrock), BEDROCK_REGION (por defecto eu-central-1),
 * BEDROCK_MODEL_COACH y BEDROCK_MODEL_CLASIFICADOR (id con prefijo de perfil de inferencia eu.).
 */
import Anthropic from 'npm:@anthropic-ai/sdk';

import type { Modelo } from '../../../packages/method/src/retos/index.ts';

const REGION = Deno.env.get('BEDROCK_REGION') ?? 'eu-central-1';
if (!REGION.startsWith('eu-')) throw new Error(`BEDROCK_REGION debe ser una región UE, es ${REGION}`);

export const MODELO_COACH = Deno.env.get('BEDROCK_MODEL_COACH') ?? 'eu.anthropic.claude-opus-5-5';
export const MODELO_CLASIFICADOR = Deno.env.get('BEDROCK_MODEL_CLASIFICADOR') ?? 'eu.anthropic.claude-haiku-5-5';

let cliente: Anthropic | null = null;
function bedrock(): Anthropic {
  const token = Deno.env.get('AWS_BEARER_TOKEN_BEDROCK');
  if (!token) throw new Error('AWS_BEARER_TOKEN_BEDROCK no está configurado');
  cliente ??= new Anthropic({
    apiKey: token,
    baseURL: `https://bedrock-mantle.${REGION}.api.aws/anthropic`,
    maxRetries: 2,
    timeout: 60_000,
  });
  return cliente;
}

export class RespuestaRechazada extends Error {}

/** Llamada simple: texto de la respuesta, o error si el modelo rechaza o se corta. */
export async function completarTexto(p: {
  modelo: string;
  sistema?: string;
  mensajes: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}): Promise<string> {
  const msg = await bedrock().messages.create({
    model: p.modelo,
    max_tokens: p.maxTokens,
    ...(p.sistema ? { system: p.sistema } : {}),
    messages: p.mensajes,
    // Turnos breves y extracciones: esfuerzo bajo (en Opus 5.5 el razonamiento no se desactiva).
    output_config: { effort: 'low' },
  } as Anthropic.MessageCreateParamsNonStreaming);
  if (msg.stop_reason === 'refusal') throw new RespuestaRechazada('refusal');
  if (msg.stop_reason === 'max_tokens') throw new Error('respuesta cortada por max_tokens');
  const texto = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!texto) throw new Error('respuesta vacía');
  return texto;
}

/** Adaptador del puerto Modelo del orquestador. */
export const modeloBedrock: Modelo = {
  completar: async ({ uso, sistema, mensajes }) =>
    completarTexto({
      modelo: uso === 'clasificador' ? MODELO_CLASIFICADOR : MODELO_COACH,
      sistema: sistema || undefined,
      mensajes: mensajes.map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto })),
      // El razonamiento adaptativo cuenta dentro de max_tokens: margen holgado.
      maxTokens: uso === 'clasificador' ? 2000 : 8000,
    }),
};
