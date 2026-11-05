// Mi cuenta (web: src/app/Perfil.jsx). Tres pestañas: Configuración · Mis resultados · Mis notas.

import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { leerPerfil } from "@/portal/datos";
import { useSession } from "@/portal/hooks";
import { TabConfig } from "@/portal/perfil/TabConfig";
import { TabDatos } from "@/portal/perfil/TabDatos";
import { TabNotas } from "@/portal/perfil/TabNotas";
import { ESPACIO_BURBUJA } from "@/portal/Shell";
import { GOLD_REF, LINE, MUTED, NAVY, fuente } from "@/portal/tema";

type Tab = "config" | "datos" | "notas";

const TABS: { key: Tab; label: string }[] = [
  { key: "config", label: "Configuración" },
  { key: "datos", label: "Mis resultados" },
  { key: "notas", label: "Mis notas" },
];

type Datos = Awaited<ReturnType<typeof leerPerfil>>;

function Mensaje({ children }: { children: string }) {
  return (
    <Text
      style={{
        ...fuente.body(400),
        fontSize: 15,
        color: MUTED,
        textAlign: "center",
        padding: 40,
      }}
    >
      {children}
    </Text>
  );
}

export default function Perfil() {
  const session = useSession();
  const user = session?.user;
  const [data, setData] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<Tab>("config");
  // «Vaciar caché y recargar»: en la web recarga la página; aquí se vuelve a montar la pantalla.
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!user?.id) return undefined;
    let vivo = true;
    leerPerfil(user.id)
      .then((d) => {
        if (!vivo) return;
        setData(d);
        setCargando(false);
      })
      .catch(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [user?.id, recarga]);

  let contenido;
  if (!user || (cargando && !data)) {
    contenido = <Mensaje>Cargando perfil…</Mensaje>;
  } else if (!data?.profile) {
    contenido = <Mensaje>No se pudo cargar el perfil.</Mensaje>;
  } else {
    const { profile, tests, personas, camino, consents } = data;
    contenido = (
      <View key={recarga}>
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 2,
            borderBottomColor: LINE,
            marginBottom: 20,
          }}
        >
          {TABS.map((t) => {
            const activa = tab === t.key;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: activa }}
                onPress={() => setTab(t.key)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderBottomWidth: 2,
                  borderBottomColor: activa ? GOLD_REF : "transparent",
                  marginBottom: -2,
                }}
              >
                <Text
                  style={{
                    ...fuente.body(activa ? 700 : 500),
                    fontSize: 14,
                    color: activa ? NAVY : MUTED,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "config" ? (
          <TabConfig
            user={user}
            profile={profile as Record<string, any>}
            consents={consents}
            onRefresh={() => {
              setCargando(true);
              setRecarga((n) => n + 1);
            }}
            onCacheVaciada={() => {
              setTab("config");
              setRecarga((n) => n + 1);
            }}
          />
        ) : null}
        {tab === "datos" ? (
          <TabDatos
            tests={tests}
            personas={personas}
            camino={camino}
            userId={user.id}
          />
        ) : null}
        {tab === "notas" ? <TabNotas userId={user.id} /> : null}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: ESPACIO_BURBUJA,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {contenido}
    </ScrollView>
  );
}
