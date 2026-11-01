/**
 * Conversación guiada de los retos (examen de la noche y onboarding). La interfaz solo muestra
 * turnos y botones: los pasos los decide el servidor.
 */
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Caption, Chip, Row, Stack, useSurface } from '@/components/ui';
import { color, radius, space, type } from '@/theme';

export interface MensajeChat {
  rol: 'coach' | 'usuario';
  texto: string;
}

export function Burbuja({ m }: { m: MensajeChat }) {
  const s = useSurface();
  const coach = m.rol === 'coach';
  return (
    <View
      style={{
        alignSelf: coach ? 'flex-start' : 'flex-end',
        maxWidth: '88%',
        paddingVertical: space.s,
        paddingHorizontal: space.m,
        borderRadius: radius.l,
        backgroundColor: coach ? s.superficie : s.acento,
      }}>
      <Text style={[coach ? type.lectura : type.body, { color: coach ? s.texto : color.azulNoche }]}>{m.texto}</Text>
    </View>
  );
}

export function ListaChat({ mensajes, ocupado }: { mensajes: MensajeChat[]; ocupado: boolean }) {
  return (
    <Stack gap={space.s}>
      {mensajes.map((m, i) => (
        <Burbuja key={i} m={m} />
      ))}
      {ocupado ? <Caption>…</Caption> : null}
    </Stack>
  );
}

/** Pie con botones de respuesta rápida y caja de texto. */
export function EntradaChat({
  botones,
  etiquetaBoton,
  onBoton,
  onEnviar,
  ocupado,
}: {
  botones: string[];
  etiquetaBoton: (b: string) => string;
  onBoton: (b: string) => void;
  onEnviar: (texto: string) => void;
  ocupado: boolean;
}) {
  const { t } = useTranslation();
  const s = useSurface();
  const [texto, setTexto] = useState('');
  const enviar = () => {
    if (!texto.trim() || ocupado) return;
    onEnviar(texto.trim());
    setTexto('');
  };
  return (
    <View style={{ gap: space.s }}>
      {botones.length ? (
        <Row>
          {botones.map((b) => (
            <Chip key={b} label={etiquetaBoton(b)} onPress={() => !ocupado && onBoton(b)} />
          ))}
        </Row>
      ) : null}
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder={t('retos.escribe')}
        placeholderTextColor={color.piedra}
        multiline
        submitBehavior="submit"
        returnKeyType="send"
        onSubmitEditing={enviar}
        maxLength={2000}
        accessibilityLabel={t('retos.escribe')}
        style={[
          type.body,
          {
            minHeight: 48,
            maxHeight: 120,
            borderWidth: 1,
            borderRadius: radius.m,
            paddingHorizontal: space.m,
            paddingVertical: space.s,
            color: s.texto,
            borderColor: s.borde,
            backgroundColor: s.fondoAlt,
          },
        ]}
      />
      <Button label={t('retos.enviar')} disabled={ocupado || !texto.trim()} onPress={enviar} />
      <Caption>{t('retos.privacidad')}</Caption>
    </View>
  );
}

/** Estado de una conversación con el servidor. */
export function useConversacion<R extends { mensaje: string }>(llamar: (entrada: never) => Promise<R>) {
  const { t } = useTranslation();
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [ultima, setUltima] = useState<R | null>(null);
  const [ocupado, setOcupado] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abierta = useRef(false);

  async function paso(entrada: unknown, etiqueta?: string) {
    setOcupado(true);
    setError(null);
    if (etiqueta) setMensajes((x) => [...x, { rol: 'usuario', texto: etiqueta }]);
    try {
      const r = await llamar(entrada as never);
      setUltima(r);
      setMensajes((x) => [...x, { rol: 'coach', texto: r.mensaje }]);
    } catch {
      setError(t('retos.sinServicio'));
    } finally {
      setOcupado(false);
    }
  }
  useEffect(() => {
    if (abierta.current) return;
    abierta.current = true;
    void paso(null);
  }, []);
  return { mensajes, ultima, ocupado, error, paso };
}
