/**
 * Seudonimizador (03 §4). El NER corre en el servicio Python del VPS (services/seudonimizador);
 * aquí vive el diccionario por usuario (identidad.token_map, cifrado) y la restauración.
 * Falla cerrado: sin servicio no hay texto hacia el modelo.
 *
 * Secretos: SEUDONIMIZADOR_URL, SEUDONIMIZADOR_TOKEN.
 */
import type { Seudonimizador } from '../../../packages/method/src/retos/index.ts';

import { db } from './db.ts';

type Tipo = 'P' | 'ORG' | 'L' | 'F';
interface Entrada {
  valor: string;
  token: string;
  tipo: Tipo;
}

export class SeudonimizadorNoDisponible extends Error {}

export async function seudonimizadorPara(userId: string): Promise<Seudonimizador> {
  const sql = db();
  const filas = await sql`
    select token, tipo, public.field_dec(valor_cifrado) as valor
    from identidad.token_map where user_id = ${userId}`;
  const conocidos: Entrada[] = filas.map((f) => ({ token: f.token, tipo: f.tipo, valor: f.valor }));

  const siguiente = () => {
    const n: Record<Tipo, number> = { P: 1, ORG: 1, L: 1, F: 1 };
    for (const c of conocidos) {
      const k = Number(c.token.match(/\d+/)?.[0] ?? 0);
      if (k >= n[c.tipo]) n[c.tipo] = k + 1;
    }
    return n;
  };

  return {
    async seudonimizar(texto: string): Promise<string> {
      const url = Deno.env.get('SEUDONIMIZADOR_URL');
      const token = Deno.env.get('SEUDONIMIZADOR_TOKEN');
      if (!url || !token) throw new SeudonimizadorNoDisponible('seudonimizador no configurado');
      const res = await fetch(`${url.replace(/\/$/, '')}/seudonimizar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        // El servicio trabaja con personas, organizaciones y lugares ([Fn] lo reserva el 03 para fechas).
        body: JSON.stringify({
          texto,
          conocidos: conocidos.filter((c) => c.tipo !== 'F'),
          siguiente: (({ P, ORG, L }) => ({ P, ORG, L }))(siguiente()),
        }),
        signal: AbortSignal.timeout(10_000),
      }).catch((e) => {
        throw new SeudonimizadorNoDisponible(String(e));
      });
      if (!res.ok) throw new SeudonimizadorNoDisponible(`seudonimizador ${res.status}`);
      const out = (await res.json()) as { texto: string; nuevos: Entrada[] };
      for (const n of out.nuevos ?? []) {
        if (!/^\[(P|ORG|L|F)\d+\]$/.test(n.token)) continue;
        await sql`
          insert into identidad.token_map (user_id, token, valor_cifrado, tipo)
          values (${userId}, ${n.token}, public.field_enc(${n.valor}), ${n.tipo})
          on conflict (user_id, token) do nothing`;
        conocidos.push(n);
      }
      return out.texto;
    },
    async restaurar(texto: string): Promise<string> {
      const mapa = new Map(conocidos.map((c) => [c.token, c.valor]));
      return texto.replace(/\[(P|ORG|L|F)\d+\]/g, (t) => mapa.get(t) ?? t);
    },
  };
}
