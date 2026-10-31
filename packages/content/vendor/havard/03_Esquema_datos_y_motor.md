# Esquema de datos y motor de método

Complementa `01_Brief_funcionalidad.md` y `02_Prompts_sistema.md`. SQL orientativo para Postgres; los nombres de columna coinciden con las claves de los JSON de los prompts.

## 1. Principio: separación de identidad y contenido

Dos mundos que nunca se juntan en el mismo proceso:

- **Servicio de identidad** (ya existe en la app): cuenta, email, facturación, y la tabla `user_pseudonym (user_id, pseudo_id, created_at)`. Solo el servicio de autenticación lee esta tabla y lo único que hace es traducir sesión → `pseudo_id`.
- **Núcleo de método**: todas las tablas de abajo, indexadas solo por `pseudo_id`. Un volcado de esta base no identifica a nadie por sí solo.

Los campos marcados `[cifrado]` se cifran en aplicación con clave por usuario (envelope encryption: clave maestra en KMS, clave de usuario derivada y almacenada cifrada en el servicio de identidad).

## 2. Tablas

### 2.1 Biblioteca (importada del Excel, editable desde admin)

```sql
CREATE TABLE reto (
  id                  TEXT PRIMARY KEY,         -- pru-01, aud-03...
  texto               TEXT NOT NULL,
  variante_corta      TEXT NOT NULL,
  virtud              TEXT NOT NULL,            -- prudencia|fortaleza|dominio de sí|justicia|magnanimidad|humildad
  subcomponente       TEXT,                     -- deliberacion|decision|audacia|resistencia|fundamental|fraternal|null
  facultad            TEXT NOT NULL,            -- corazon|razon|voluntad
  ambito              TEXT NOT NULL,            -- trabajo|familia|amistad|vida interior|cultura|cuerpo|sociedad
  tipo                TEXT NOT NULL,            -- accion|omision|contemplacion
  minutos_estimados   INT,
  requiere_otra_persona BOOLEAN,
  disparador          TEXT,                     -- valor normalizado del catálogo, o null
  dif_colerico        SMALLINT CHECK (dif_colerico BETWEEN 1 AND 5),
  dif_melancolico     SMALLINT,
  dif_sanguineo       SMALLINT,
  dif_flematico       SMALLINT,
  obstaculo           TEXT,
  repetible           BOOLEAN,
  pregunta_examen     TEXT NOT NULL,
  fuente_libro        TEXT, fuente_seccion TEXT, cita_literal TEXT,
  activo              BOOLEAN DEFAULT TRUE
);
```

`intensidad` no se almacena: se calcula como media redondeada de las cuatro dificultades, o mejor, se usa directamente la dificultad del temperamento del usuario.

### 2.2 Catálogo de disparadores

Lista normalizada que usan la biblioteca, el onboarding y el examen nocturno. Valor inicial (derivado de la columna `disparador_contextual` del Excel; ampliar según uso):

```
reunion_donde_decido        reunion_de_equipo          desacuerdo_con_superior
conversacion_dificil        error_o_contratiempo       critica_recibida
tarea_pendiente             entrega_con_presion        jornada_cargada
colaborador_indeciso        colaborador_con_error      evaluacion_o_feedback
persona_dificil             persona_con_rencor         exito_ajeno
llegada_a_casa              comida_familiar            tarde_con_hijos
situacion_tensa_habitual    inicio_del_dia             antes_de_dormir
bajon_emocional             preocupacion_recurrente    impulso_de_compra_o_novedad
presion_social              ocasion_de_ayudar          sin_disparador
```

### 2.3 Perfil

```sql
CREATE TABLE perfil (
  pseudo_id               UUID PRIMARY KEY,
  temperamento_dominante  TEXT NOT NULL,
  temperamento_secundario TEXT,
  confianza_temperamento  REAL,
  mision                  TEXT,                  -- [cifrado]
  notas                   TEXT,                  -- [cifrado]
  creado_en               TIMESTAMPTZ,
  actualizado_en          TIMESTAMPTZ
);

CREATE TABLE nivel_virtud (
  pseudo_id   UUID REFERENCES perfil,
  virtud      TEXT,      -- las 8 claves: prudencia, fortaleza_audacia, fortaleza_resistencia,
                         -- dominio_de_si, justicia, magnanimidad, humildad_fundamental, humildad_fraternal
  nivel       REAL CHECK (nivel BETWEEN 1 AND 5),
  confianza   REAL,      -- cuántos datos reales hay detrás (0 = solo autoevaluación)
  actualizado_en TIMESTAMPTZ,
  PRIMARY KEY (pseudo_id, virtud)
);

CREATE TABLE persona (                           -- personas recurrentes de la vida del usuario
  pseudo_id   UUID REFERENCES perfil,
  token       TEXT,                              -- [P1], [P2]...
  rol         TEXT,                              -- superior|colaborador|pareja|hijo|amigo|padre|otro
  notas       TEXT,                              -- [cifrado] p.ej. "suele interrumpirle"
  menciones   INT DEFAULT 0,
  ultima_mencion DATE,
  PRIMARY KEY (pseudo_id, token)
);

CREATE TABLE escenario (                         -- situaciones habituales (onboarding + aprendidas)
  id          SERIAL PRIMARY KEY,
  pseudo_id   UUID REFERENCES perfil,
  etiqueta    TEXT,                              -- [cifrado]
  disparador  TEXT,
  personas    TEXT[],                            -- tokens
  frecuencia  INT DEFAULT 1
);
```

El diccionario `token ↔ nombre real` **no** está en estas tablas: vive en el servicio de identidad, cifrado por usuario (`token_map (user_id, token, valor_cifrado, tipo)`).

### 2.4 Registro diario

```sql
CREATE TABLE dia (
  pseudo_id       UUID REFERENCES perfil,
  fecha           DATE,
  reto_id         TEXT REFERENCES reto,
  reto_texto      TEXT,                          -- [cifrado] frase instanciada que vio el usuario
  reto_porque     TEXT,
  situacion       TEXT,                          -- [cifrado] situación a la que se aplicó
  disparador      TEXT,
  personas        TEXT[],
  resultado       TEXT,                          -- si|a_medias|no|sin_respuesta
  tipo_fallo      TEXT,                          -- reaccion|decision|null
  nota_usuario    TEXT,                          -- [cifrado]
  resumen_dia     TEXT,                          -- [cifrado]
  obstaculos      TEXT[],
  paso_alcanzado  SMALLINT,
  modo_prisa      BOOLEAN,
  reescrito_por_usuario BOOLEAN,
  nivel_atencion  TEXT,                          -- ninguno|atencion|crisis
  PRIMARY KEY (pseudo_id, fecha)
);

CREATE TABLE conversacion_noche (                -- texto completo, retención corta (p.ej. 30 días)
  pseudo_id   UUID, fecha DATE, turno SMALLINT,
  rol         TEXT,                              -- usuario|coach
  texto       TEXT,                              -- [cifrado], ya seudonimizado
  PRIMARY KEY (pseudo_id, fecha, turno)
);
```

## 3. Motor de método

Todo determinista, en el backend, con tests. El modelo nunca escribe en estas tablas.

### 3.1 Selección de candidatos (se ejecuta en el paso 5 del examen)

Entradas: perfil, niveles, últimos 14 días de `dia`, situación de mañana (disparador + personas) si la hay.

```
VIRTUD_RETO = {colerico: humildad_fraternal, melancolico: fortaleza_audacia,
               sanguineo: fortaleza_resistencia, flematico: magnanimidad}

def puntuar(reto, usuario, manana):
    v = virtud_clave(reto)                      # mapea virtud+subcomponente a una de las 8 claves
    nivel = usuario.niveles[v]
    dif = reto.dificultad(usuario.temperamento_dominante)

    necesidad = (5 - nivel)                     # 0..4
    if v == VIRTUD_RETO[usuario.temperamento_dominante]: necesidad *= 3
    if usuario.temperamento_secundario and v == VIRTUD_RETO[usuario.temperamento_secundario]: necesidad *= 1.5

    relevancia = 1.0
    if manana and reto.disparador == manana.disparador: relevancia = 3.0
    elif manana and reto.ambito == ambito_de(manana.disparador): relevancia = 1.5
    if reto.requiere_otra_persona and not (manana and manana.personas): relevancia *= 0.6

    objetivo = min(5, nivel + 1)
    zona = 1.0 - abs(dif - objetivo) * 0.25     # 1.0 si dif == nivel+1; baja 0.25 por punto de distancia
    zona = max(zona, 0.1)

    espiral = 1.0
    dias_seguidos = racha_de_virtud(usuario.ultimos_dias, v)
    if dias_seguidos >= 4: espiral = 0.3
    if facultad_no_tocada_esta_semana(usuario, reto.facultad): espiral *= 1.5
    if v in ("magnanimidad",) and ultimo_fue(usuario, "humildad_fraternal"): espiral *= 1.2   # pareja
    if v == "humildad_fraternal" and ultimo_fue(usuario, "magnanimidad"): espiral *= 1.2

    novedad = 1.0
    ultimo = dias_desde_ultimo_uso(usuario, reto.id)
    if ultimo is not None:
        if not reto.repetible: novedad = 0.0 if ultimo < 90 else 0.5
        else: novedad = min(1.0, ultimo / 14)
    if rechazos_recientes(usuario, reto.tipo) >= 3: novedad *= 0.4     # señal de voluntarismo

    return necesidad * relevancia * zona * espiral * novedad

candidatos = top5(sorted(retos_activos, key=puntuar, reverse=True))
# Garantía: al menos uno de los 5 es de la virtud-reto, y al menos uno no requiere otra persona.
```

### 3.2 Actualización de niveles (se ejecuta tras `EXTRAER_EXAMEN`)

```
def actualizar_nivel(usuario, dia):
    v = virtud_clave(dia.reto)
    if dia.resultado == "si":        delta = +0.15
    elif dia.resultado == "a_medias": delta = +0.05
    elif dia.resultado == "no":
        delta = -0.10 if dia.tipo_fallo == "decision" else 0.0   # fallo de reacción no baja el nivel
    else: delta = 0.0
    delta = max(-0.3, min(0.3, delta))
    nuevo = media_movil_14_dias(usuario.historial[v] + [usuario.niveles[v] + delta])
    usuario.niveles[v] = clamp(nuevo, 1, 5)
    usuario.confianza[v] = min(1.0, usuario.confianza[v] + 0.05)
```

Reglas adicionales:
- Cada trimestre, un examen largo (basado en los cuestionarios por virtud de *Creado para la grandeza*) recalibra niveles y confianza.
- Si en 14 días un usuario tiene `resultado = si` en más del 85 % de los días, el objetivo de intensidad sube a nivel + 1.5 (se redondea).
- Obstáculos: se acumulan en `dia.obstaculos`; si uno aparece 3 veces en 14 días, el motor prioriza retos cuyo `obstaculo` coincide.

### 3.3 Memoria de personas y escenarios

Tras cada examen:
- `personas_nuevas` → insertar en `persona` con token y rol; `personas_mencionadas` → `menciones += 1`, `ultima_mencion = hoy`.
- `manana.situacion` con disparador → si existe un `escenario` con el mismo disparador y personas, `frecuencia += 1`; si no, crear uno nuevo.
- Nada de texto libre entra en `persona.notas` sin pasar por el seudonimizador.

### 3.4 Escenario de respaldo para la mañana

Si el examen no dejó situación (prisa, abandono, sin respuesta): elegir el `escenario` del usuario con mayor `frecuencia` cuyo disparador tenga retos activos; si no hay ninguno, usar `sin_disparador` y el reto con menor `requiere_otra_persona`.

## 4. Seudonimizador

Pipeline que corre en el backend antes de cualquier llamada al modelo y antes de escribir en `conversacion_noche`:

1. Lista declarada por el usuario en onboarding (nombres de hijos, pareja, empresa, ciudad) → sustitución directa.
2. NER local (spaCy `es_core_news_md` o GLiNER) para PER, ORG, LOC y fechas exactas.
3. Asignación de tokens estables por usuario: primera aparición de "Marta" → `[P1]` y se guarda en `token_map`; apariciones siguientes reutilizan el token. Prefijos: `[Pn]` personas, `[ORGn]` organizaciones, `[Ln]` lugares, `[Fn]` fechas.
4. Restauración: al mostrar texto al usuario, se sustituyen los tokens por los valores de `token_map` descifrados en memoria y nunca se persisten restaurados.

Pruebas: conjunto de 100 frases con nombres españoles, apellidos compuestos, apodos y nombres de empresa; objetivo de recall > 95 % en PER. Un fallo del seudonimizador es un incidente de datos, no un bug menor.

## 5. Flujo de una noche (secuencia)

```
usuario abre examen
  → orquestador carga perfil, niveles, últimos 14 días, personas, escenarios
  → paso 1: coach (sin texto de usuario)
  → por cada turno de usuario:
      texto → seudonimizador → clasificador de crisis
        crisis   → mensaje fijo, fin; dia.nivel_atencion = crisis
        atencion → se añade línea de cuidado al bloque de datos
      → coach con paso actual → respuesta → restaurar tokens → mostrar
      → orquestador decide el paso siguiente (botones sí/a medias/no avanzan paso 2; "prisa" salta a 5)
  → antes del paso 5: motor.candidatos(perfil, niveles, manana)  → se inyectan en el bloque
  → al cerrar: EXTRAER_EXAMEN → validar JSON → actualizar nivel, personas, escenarios, dia
  → generar reto de mañana (modo MAÑANA) → guardar dia(mañana).reto_texto → programar notificación
```

## 6. Qué viaja al modelo en cada modo (contrato de datos)

| Modo | Entra | No entra |
|---|---|---|
| Onboarding | nada previo | — |
| Mañana | temperamento, misión, reto elegido, situación de mañana (tokens), propósito del usuario, razón de temperamento, escenario de respaldo | historia personal, exámenes anteriores, niveles numéricos, identidad |
| Noche | temperamento, misión, reto de hoy, niveles, virtudes recientes, personas conocidas (token + rol), 5 candidatos, paso, texto del usuario del turno (seudonimizado) | exámenes completos anteriores (solo resumen de 1 frase si hace falta), identidad, diccionario de tokens |
| Crisis | solo el mensaje del turno | todo lo demás |

## 7. Retención y derechos

- `conversacion_noche`: 30 días, luego se borra; `dia` conserva solo los campos estructurados y los resúmenes cifrados.
- Exportación: el usuario puede descargar perfil + registro con los tokens restaurados.
- Borrado: elimina `token_map` primero (sin él, el resto queda irreversiblemente anónimo), luego el resto en cascada.
- Trazas de observabilidad: texto seudonimizado, 14 días.
