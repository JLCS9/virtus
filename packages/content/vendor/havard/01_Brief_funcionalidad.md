# Funcionalidad: Retos diarios de carácter

Documento de contexto para el proyecto de desarrollo. Se acompaña de `02_Prompts_sistema.md`, `03_Esquema_datos_y_motor.md` y `Biblioteca_de_retos_Havard.xlsx`.

## 1. Qué se quiere lograr

Añadir a la app existente (web y móvil) una funcionalidad que acompañe al usuario en su crecimiento personal según el método de Liderazgo Virtuoso de Alexandre Dianine-Havard. El método parte de que cada persona tiene un temperamento innato (colérico, melancólico, sanguíneo, flemático) y forja su carácter practicando seis virtudes: prudencia, fortaleza, dominio de sí, justicia, magnanimidad y humildad. A cada temperamento le cuesta especialmente una virtud (colérico → humildad, melancólico → audacia, sanguíneo → resistencia, flemático → magnanimidad), y el crecimiento consiste en practicarla en situaciones reales de la vida ordinaria.

Objetivo: que el usuario reciba cada mañana un reto concreto, aplicado a su día y a las personas de su vida, y que cada noche haga un examen de conciencia guiado de cinco minutos del que salga el reto del día siguiente. Al cabo de semanas, el sistema conoce sus situaciones recurrentes y sus patrones, y los retos parecen escritos por alguien que le conoce.

Lo que no es: no es un chatbot de bienestar, no es terapia, no sustituye a un mentor humano. El método es explícito en esto y la funcionalidad debe decirlo.

## 2. Cómo se plantea

Dos momentos fijos al día y nada más.

### Mañana (30 segundos)
Pantalla o notificación con el reto en una frase, ligado a la situación que el usuario contó la noche anterior. Ejemplo: "En la reunión con Marta, antes de defender tu propuesta, pregúntale qué haría ella". Debajo, una línea con el porqué (qué virtud trabaja y por qué le cuesta a su temperamento). Sin chat.

### Noche (5–6 minutos)
Conversación guiada en cinco pasos, uno por turno:

1. **Parar.** Tres respiraciones guiadas, sin preguntas.
2. **El reto de hoy.** ¿Lo hiciste? (sí / a medias / no). Si no: ¿falló la primera reacción o la decisión? Esta distinción es central en el método.
3. **El día.** Una sola pregunta abierta sobre qué ha pasado. De aquí salen personas y situaciones.
4. **Mañana.** Qué tiene mañana en lo que querría hacerlo distinto.
5. **Propósito.** El sistema propone el reto de mañana aplicado a esa situación; el usuario lo acepta o lo reescribe con sus palabras.

Botón "tengo prisa" que salta los pasos 3 y 4.

### Onboarding (una vez, 6–8 turnos)
Temperamento (lo da o se infiere con cuatro preguntas), misión en una frase, escenarios habituales de su semana con las personas que aparecen, y una autoevaluación breve que inicializa los niveles de virtud.

### Principio de diseño
El método vive en código, no en el modelo: la selección del reto, la actualización de niveles y las reglas de progresión son deterministas y testeables. El modelo de lenguaje solo redacta el reto para la situación concreta y conduce la conversación nocturna. Esto hace el sistema auditable y limita lo que el modelo puede hacer mal.

## 3. Componentes a construir

### Biblioteca de retos
Archivo `Biblioteca_de_retos_Havard.xlsx`: 113 retos etiquetados por virtud, subcomponente, ámbito, tipo (acción / omisión / contemplación), dificultad por temperamento (1–5), disparador contextual, pregunta de examen y fuente en los libros. Se importa a una tabla y se mantiene editable desde admin. El catálogo (virtudes, temperamentos, perfiles combinados, obstáculos) está en la hoja Catálogo.

### Motor de método (backend, determinista)
- Scoring de candidatos: necesidad (nivel bajo en la virtud, con peso triple para la virtud-reto del temperamento) × relevancia (coincidencia del disparador con la situación de mañana) × zona de crecimiento (intensidad = nivel + 1) × espiral (penaliza repetir virtud más de 4 días; cada semana toca corazón, razón y voluntad) × novedad.
- Actualización de niveles: media móvil de 14 días; un fallo "de reacción" no baja el nivel, un fallo "de decisión" sí; máximo 0,3 puntos de variación por día.
- Detección de derivas: si el usuario solo acepta retos de su virtud fuerte, o rechaza repetidamente retos de un tipo, se marca.
- Devuelve al modelo cinco candidatos ordenados, nunca la biblioteca entera.

### Orquestador de conversación
Gestiona el modo (onboarding / mañana / noche), el paso dentro del examen nocturno, construye el prompt con el contexto mínimo y valida la salida JSON del modelo contra esquema antes de escribir nada en base de datos. Prompts en `02_Prompts_sistema.md`.

### Seudonimizador
Antes de que cualquier texto del usuario llegue al modelo o a los logs, un detector de entidades (spaCy español o GLiNER, en local) sustituye personas, organizaciones y lugares por tokens estables por usuario (`[P1]`, `[ORG1]`, `[L1]`). El diccionario de correspondencia se guarda cifrado con clave por usuario, fuera del núcleo. El usuario siempre ve los nombres reales; el modelo y los logs solo ven tokens. En onboarding el usuario puede declarar nombres propios (hijos, empresa) que el detector debe cubrir.

### Memoria del usuario
Perfil estable (temperamento, misión, escenarios, personas recurrentes con rol, niveles de virtud) y registro diario (reto, resultado, tipo de fallo, situaciones y personas que aparecieron, reto de mañana). Indexada por un `pseudo_id` distinto del id de cuenta; la correspondencia vive en el servicio de identidad existente de la app. Texto libre de los exámenes cifrado en aplicación con clave por usuario.

### Clasificador de crisis
Llamada barata sobre cada mensaje nocturno antes del coach. Tres niveles: ninguno / atención / crisis. En crisis se abandona el guion, se muestra un mensaje fijo revisado por un profesional con recursos del país del usuario, y no se vuelve al examen esa noche.

### UI
Pantalla de reto matinal, flujo nocturno con pasos (respiración animada, botones sí / a medias / no, campo de texto o voz, propuesta editable del reto), onboarding, y una vista de progreso trimestral por virtud. Sin rachas ni gamificación agresiva: el método rechaza el perfeccionismo y la comparación.

## 4. Herramientas y stack

- **Modelo:** Claude vía Amazon Bedrock en región europea, con inference profile `eu.`, modo de retención sin compartir datos con el proveedor, y model invocation logging desactivado o limitado a texto ya seudonimizado. Anthropic no tiene acceso a los prompts en Bedrock; AWS no los almacena ni los usa para entrenar. Confirmar con AWS qué modelos Claude están disponibles hoy en perfil EU sin requisito de retención.
- **Backend:** el existente de la app; se añaden los módulos motor de método, orquestador y seudonimizador como servicios internos. Python recomendado para motor y seudonimizador por el ecosistema NLP.
- **Datos:** Postgres (tablas de biblioteca, perfil, registro, personas); cifrado de campo con envelope encryption (clave maestra en KMS, claves por usuario derivadas).
- **NLP local:** spaCy `es_core_news_md` o GLiNER para NER; validación de JSON con Pydantic.
- **Jobs:** cola para la generación del reto al cierre del examen y para el recordatorio matinal.
- **Observabilidad:** trazas de cada llamada al modelo con texto seudonimizado y retención corta; conjunto de pruebas automáticas con casos de método (un colérico pide retos de audacia → el sistema lo redirige a humildad; un mensaje de crisis → se activa el flujo de ayuda; el JSON de salida siempre valida).
- **Cumplimiento:** DPA con AWS; DPIA propia por tratarse de datos sobre creencias y vida interior (categoría especial RGPD); consentimiento explícito en onboarding; exportación y borrado completo desde la app.

## 5. Interfaces entre componentes

- Motor → Orquestador: `candidatos[5]` con `{reto_id, texto, virtud, subcomponente, tipo, disparador, intensidad, pregunta_examen}`.
- Orquestador → Modelo (mañana): perfil mínimo + reto elegido + situación de mañana + propósito del usuario. Salida: `{reto, porque, reto_id}`.
- Orquestador → Modelo (noche): datos de hoy + paso actual + candidatos; al final `EXTRAER_EXAMEN`. Salida: JSON con resultado, tipo de fallo, personas y situaciones nuevas, situación de mañana, reto de mañana aceptado, señal de crisis.
- Validaciones en orquestador: `reto_manana.reto_id` ∈ candidatos; personas nuevas solo con token y rol; cualquier incumplimiento del esquema descarta la salida y repite la llamada una vez.

## 6. Fases

1. **Prototipo (2–3 semanas):** biblioteca importada, motor de scoring con tests, flujo nocturno completo en web con Bedrock EU, seudonimizador básico. Diez usuarios internos un mes.
2. **Producto (4–6 semanas):** móvil, onboarding completo, clasificador de crisis, cifrado por usuario, vista de progreso, admin de biblioteca, DPIA.
3. **Evolución:** afinado de un modelo pequeño para la extracción nocturna, exportación mensual para mentor humano, revisión trimestral guiada basada en los cuestionarios de *Creado para la grandeza*.

## 7. Métricas

- Tasa de exámenes completados: objetivo > 60 % de los días activos.
- Duración media del examen: objetivo 4–6 min.
- Proporción de retos reescritos por el usuario (señal de que la instanciación no acierta).
- Distribución de virtudes trabajadas por usuario: debe cubrir corazón, razón y voluntad cada semana.
- Ninguna métrica de rachas visible al usuario.
