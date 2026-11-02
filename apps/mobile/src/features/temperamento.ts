/**
 * Primario y secundario del test de temperamento de la persona, para el Camino: el del dispositivo o,
 * si no hay, el último guardado en la cuenta (lo guarda la web o la app con formas distintas).
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { Temp } from '@/lib/camino';
import { useVirtus } from '@/store/virtus';

export interface MiTemperamento {
  primario: Temp;
  secundario: Temp | null;
}

const ES_TEMP = /^(COL|MEL|SAN|FLE)$/;
const temp = (v: unknown): Temp | null => (typeof v === 'string' && ES_TEMP.test(v) ? (v as Temp) : null);

/** La web guarda { primario, secundario }; la app { dominant, secondary, type }; algunos solo profileKey. */
export function deResultado(r: Record<string, unknown> | null | undefined): MiTemperamento | null {
  if (!r) return null;
  const clave = typeof (r.profileKey ?? r.type) === 'string' ? String(r.profileKey ?? r.type).split('-') : [];
  const primario = temp(r.primario) ?? temp(r.dominant) ?? temp(clave[0]);
  if (!primario) return null;
  return { primario, secundario: temp(r.secundario) ?? temp(r.secondary) ?? temp(clave[1]) };
}

const useRemoto = create<{ valor: MiTemperamento | null | undefined }>(() => ({ valor: undefined }));
let pedido = false;

async function leerRemoto() {
  if (pedido) return;
  pedido = true;
  try {
    if (!supabase) throw new Error('sin backend');
    const { data } = await supabase
      .from('test_results')
      .select('result')
      .eq('kind', 'temperament')
      .order('taken_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    useRemoto.setState({ valor: deResultado(data?.result as Record<string, unknown> | null) });
  } catch {
    useRemoto.setState({ valor: null });
    pedido = false;
  }
}

/** undefined mientras se carga; null si no hay test. */
export function useTemperamento(): MiTemperamento | null | undefined {
  const local = useVirtus((s) => s.temperament);
  const remoto = useRemoto((s) => s.valor);
  useEffect(() => {
    if (!local) void leerRemoto();
  }, [local]);
  if (local) return { primario: local.dominant, secundario: local.secondary };
  return remoto;
}
