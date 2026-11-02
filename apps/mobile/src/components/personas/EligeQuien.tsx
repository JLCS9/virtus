/**
 * «¿Con quién?»: primero tus fichas, luego los grupos («Alguien de mi familia»…). Lo elige el usuario,
 * nunca la app. El valor es 'p:<id>' para una ficha, o la clave del grupo.
 */
import { Pressable, Text, View } from 'react-native';

import { CON_QUIEN } from '@/lib/camino';
import { claveFicha, idDeClave, type Persona } from '@/lib/personas';
import { Opcion, Opciones } from '@/components/camino/ui';
import { color, fontFamily, radius } from '@/theme';
import { Avatar } from './comun';

const TEXTO_CON_QUIEN: Record<string, string> = Object.fromEntries([...CON_QUIEN, ['solo', 'Solo']]);

/** Texto para mostrar un «con quién» guardado: el nombre de la ficha o el grupo. */
export function textoConQuien(clave: string, porId: Record<string, Persona> = {}) {
  const id = idDeClave(clave);
  if (id) return porId[id]?.nombre ?? 'Una persona';
  return TEXTO_CON_QUIEN[clave] ?? clave;
}

export function EligeQuien({
  personas = [],
  valor,
  onElegir,
  extra = [],
  conmutar = false,
  sugerida = null,
}: {
  personas?: Persona[];
  valor: string | null | undefined;
  onElegir: (v: string | null) => void;
  extra?: [string, string][];
  conmutar?: boolean;
  sugerida?: string | null;
}) {
  const elegir = (v: string) => onElegir(conmutar && valor === v ? null : v);
  return (
    <View style={{ gap: 10 }}>
      {personas.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {personas.map((p) => {
            const v = claveFicha(p.id);
            const activa = valor === v;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                onPress={() => elegir(v)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 6,
                  paddingLeft: 6,
                  paddingRight: 14,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: activa ? color.azulProfundo : color.bruma,
                  backgroundColor: activa ? color.azulProfundo : color.blanco,
                }}>
                <Avatar persona={p} tam={32} />
                <Text style={{ fontFamily: fontFamily.sans500, fontSize: 15, color: activa ? color.blanco : color.pizarra }}>{p.nombre}</Text>
                {p.id === sugerida ? (
                  <Text style={{ fontFamily: fontFamily.sans700, fontSize: 11, letterSpacing: 0.6, color: activa ? color.blanco : color.doradoVirtud }}>· SUGERIDA</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <Opciones>
        {[...CON_QUIEN, ...extra].map(([v, texto]) => (
          <Opcion key={v} compacta={personas.length > 0} activa={valor === v} onPress={() => elegir(v)}>
            {texto}
          </Opcion>
        ))}
      </Opciones>
    </View>
  );
}
