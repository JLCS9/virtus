// Pestaña «Configuración» (web: TabConfig de src/app/Perfil.jsx).
 
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { User } from '@supabase/supabase-js';

import { actualizarPerfil, borrarCuenta, cambiarPassword, salir as cerrarSesion } from '../datos';
import { olvidarCatalogo } from '../formacion/useFormacion';
import { olvidarAcceso } from '../hooks';
import { GOLD_REF_DK, fuente, parrafo } from '../tema';
import { vaciarCacheLocal } from './datos';
import { BotonLinea, BtnGuardar, Campo, CampoPwd, Casilla, Fila, Modal, Seccion } from './piezas';

export const IDIOMAS: Record<string, string> = { es: 'Español', en: 'English', fr: 'Français', ru: 'Русский' };
const SEXO: Record<string, string> = { hombre: 'Hombre', mujer: 'Mujer' };
const PROPOSITO: Record<string, string> = { cuenta: 'Cuenta y resultados', newsletter: 'Boletín', tutor: 'Tutor' };

const parrafoPeq = { ...parrafo, fontSize: 13, lineHeight: 13 * 1.65 };
const PWD_INICIAL = { old: '', pwd: '', estado: 'idle', showOld: false, showNew: false };

export function TabConfig({
  user,
  profile,
  consents,
  onRefresh,
  onCacheVaciada,
}: {
  user: User;
  profile: Record<string, any>;
  consents: Record<string, any>[];
  onRefresh: () => void;
  onCacheVaciada: () => void;
}) {
  const [editando, setEditando] = useState<null | 'general' | 'personal' | 'password'>(null);
  const [guardando, setGuardando] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [pwdState, setPwdState] = useState(PWD_INICIAL);
  const [confirmBorrar, setConfirmBorrar] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  function abrir(seccion: 'general' | 'personal', datos: Record<string, any>) {
    setDraft(datos);
    setEditando(seccion);
    setGuardando(false);
  }

  async function guardar(campos: Record<string, any>) {
    setGuardando(true);
    try {
      await actualizarPerfil(user.id, campos);
      setEditando(null);
      onRefresh();
    } catch {
      setGuardando(false);
    }
  }

  async function guardarPwd() {
    if (!pwdState.old || pwdState.pwd.length < 6) return;
    setPwdState((s) => ({ ...s, estado: 'guardando' }));
    try {
      await cambiarPassword(pwdState.old, pwdState.pwd);
      setPwdState({ ...PWD_INICIAL, estado: 'ok' });
      temporizador.current = setTimeout(() => {
        setPwdState(PWD_INICIAL);
        setEditando(null);
      }, 1800);
    } catch (err) {
      setPwdState((s) => ({ ...s, estado: (err as Error)?.message === 'wrong_password' ? 'wrong' : 'error' }));
    }
  }

  async function salir() {
    olvidarAcceso();
    olvidarCatalogo();
    await cerrarSesion();
    router.replace('/login');
  }

  async function eliminar() {
    try {
      await borrarCuenta();
      olvidarAcceso();
      olvidarCatalogo();
      router.replace('/login');
    } catch {
      /* como en la web: si falla, no pasa nada */
    }
  }

  async function vaciarCache() {
    await vaciarCacheLocal();
    olvidarAcceso();
    olvidarCatalogo();
    onCacheVaciada();
  }

  return (
    <>
      <View style={{ gap: 18 }}>
        <Seccion titulo="Configuración general" onEdit={() => abrir('general', { locale: profile.locale })}>
          <Fila label="Email" valor={user.email} />
          <Fila label="Idioma" valor={IDIOMAS[profile.locale]} />
          <Fila label="Contraseña" valor="••••••••" />
          <View style={{ marginTop: 12, alignItems: 'flex-start' }}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setPwdState(PWD_INICIAL);
                setEditando('password');
              }}>
              <Text style={{ ...fuente.body(400), fontSize: 13, color: GOLD_REF_DK, textDecorationLine: 'underline' }}>Cambiar contraseña</Text>
            </Pressable>
          </View>
        </Seccion>

        <Seccion
          titulo="Datos personales"
          onEdit={() =>
            abrir('personal', {
              first_name: profile.first_name ?? '',
              last_name: profile.last_name ?? '',
              sex: profile.sex ?? '',
              birth_year: profile.birth_year ?? '',
              country: profile.country ?? '',
              spiritual: profile.spiritual ?? false,
            })
          }>
          <Fila label="Nombre" valor={[profile.first_name, profile.last_name].filter(Boolean).join(' ')} />
          <Fila label="Sexo" valor={SEXO[profile.sex]} />
          <Fila label="Año de nacimiento" valor={profile.birth_year} />
          <Fila label="País" valor={profile.country} />
          <Fila label="Vida espiritual" valor={profile.spiritual ? 'Sí' : 'No'} />
        </Seccion>

        <Seccion titulo="Consentimientos">
          {consents.length > 0 ? (
            consents.map((c, i) => <Fila key={i} label={PROPOSITO[c.purpose] ?? c.purpose} valor={c.granted ? 'Aceptado' : 'Denegado'} />)
          ) : (
            <Text style={parrafoPeq}>Sin consentimientos registrados</Text>
          )}
        </Seccion>

        <Seccion titulo="Caché y datos locales">
          <Text style={[parrafoPeq, { marginBottom: 12 }]}>Vacía los datos locales del navegador (progreso de módulos, catálogo, preferencias).</Text>
          <BotonLinea onPress={vaciarCache}>Vaciar caché y recargar</BotonLinea>
        </Seccion>

        <Seccion titulo="Sesión y cuenta">
          <BotonLinea onPress={salir} style={{ marginBottom: 12 }}>
            Cerrar sesión
          </BotonLinea>
          {!confirmBorrar ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmBorrar(true)}
              style={({ pressed }) => ({
                borderWidth: 1.5,
                borderColor: '#fca5a5',
                paddingVertical: 9,
                paddingHorizontal: 18,
                alignItems: 'center',
                backgroundColor: pressed ? '#fef2f2' : 'transparent',
              })}>
              <Text style={{ ...fuente.body(600), fontSize: 13, color: '#dc2626' }}>Cancelar mi cuenta</Text>
            </Pressable>
          ) : (
            <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', padding: 16 }}>
              <Text style={{ ...fuente.body(400), fontSize: 13, color: '#991b1b', marginBottom: 12, lineHeight: 13 * 1.5 }}>
                <Text style={fuente.body(700)}>¿Estás seguro?</Text> Se borrará tu cuenta y perderás todo tu progreso. Esta acción no se puede deshacer.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={eliminar}
                  style={({ pressed }) => ({ backgroundColor: '#dc2626', paddingVertical: 9, paddingHorizontal: 18, opacity: pressed ? 0.85 : 1 })}>
                  <Text style={{ ...fuente.body(600), fontSize: 13, color: '#fff' }}>Sí, borrar mi cuenta</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmBorrar(false)}
                  style={({ pressed }) => ({ borderWidth: 1, borderColor: '#fca5a5', paddingVertical: 9, paddingHorizontal: 14, opacity: pressed ? 0.7 : 1 })}>
                  <Text style={{ ...fuente.body(400), fontSize: 13, color: '#991b1b' }}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Seccion>
      </View>

      {editando === 'general' ? (
        <Modal titulo="Configuración general" onClose={() => setEditando(null)}>
          <View style={{ gap: 14 }}>
            <Campo label="Idioma" value={draft.locale} opciones={IDIOMAS} onChange={(v) => setDraft((d) => ({ ...d, locale: v }))} />
            <BtnGuardar onPress={() => guardar({ locale: draft.locale })} guardando={guardando} />
          </View>
        </Modal>
      ) : null}

      {editando === 'personal' ? (
        <Modal titulo="Datos personales" onClose={() => setEditando(null)}>
          <View style={{ gap: 14 }}>
            <Campo label="Nombre" value={draft.first_name} onChange={(v) => setDraft((d) => ({ ...d, first_name: v }))} />
            <Campo label="Apellidos" value={draft.last_name} onChange={(v) => setDraft((d) => ({ ...d, last_name: v }))} />
            <Campo label="Sexo" value={draft.sex} opciones={SEXO} onChange={(v) => setDraft((d) => ({ ...d, sex: v }))} />
            <Campo
              label="Año de nacimiento"
              teclado="number-pad"
              value={draft.birth_year}
              onChange={(v) => setDraft((d) => ({ ...d, birth_year: v ? Number(v) : null }))}
            />
            <Campo label="País" value={draft.country} onChange={(v) => setDraft((d) => ({ ...d, country: v }))} placeholder="ES, MX, AR…" />
            <Casilla label="Vida espiritual" valor={draft.spiritual ?? false} onChange={(v) => setDraft((d) => ({ ...d, spiritual: v }))} />
            <BtnGuardar onPress={() => guardar(draft)} guardando={guardando} />
          </View>
        </Modal>
      ) : null}

      {editando === 'password' ? (
        <Modal titulo="Cambiar contraseña" onClose={() => setEditando(null)}>
          <View style={{ gap: 14 }}>
            <CampoPwd
              label="Contraseña actual"
              value={pwdState.old}
              onChange={(v) => setPwdState((s) => ({ ...s, old: v }))}
              visible={pwdState.showOld}
              onToggle={() => setPwdState((s) => ({ ...s, showOld: !s.showOld }))}
            />
            <CampoPwd
              label="Nueva contraseña"
              value={pwdState.pwd}
              onChange={(v) => setPwdState((s) => ({ ...s, pwd: v }))}
              visible={pwdState.showNew}
              onToggle={() => setPwdState((s) => ({ ...s, showNew: !s.showNew }))}
              placeholder="Mínimo 6 caracteres"
            />
            <BtnGuardar onPress={guardarPwd} guardando={pwdState.estado === 'guardando'} />
            {pwdState.estado === 'ok' ? <Text style={{ ...fuente.body(400), fontSize: 13, color: '#2e7d32' }}>Contraseña actualizada</Text> : null}
            {pwdState.estado === 'wrong' ? (
              <Text style={{ ...fuente.body(400), fontSize: 13, color: '#c62828' }}>La contraseña actual no es correcta</Text>
            ) : null}
            {pwdState.estado === 'error' ? (
              <Text style={{ ...fuente.body(400), fontSize: 13, color: '#c62828' }}>Error al cambiar la contraseña</Text>
            ) : null}
          </View>
        </Modal>
      ) : null}
    </>
  );
}

