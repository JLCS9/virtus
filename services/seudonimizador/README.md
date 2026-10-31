# Seudonimizador

Microservicio sin estado que sustituye personas, organizaciones y lugares del
texto del usuario por tokens estables (`[P1]`, `[ORG1]`, `[L1]`) antes de que
ese texto llegue al modelo (Claude en Bedrock EU) o a cualquier log. Es la
implementación del §4 de `03_Esquema_datos_y_motor.md`.

Lo llaman las Edge Functions de Supabase. El mapa token↔valor **no vive aquí**:
el llamador lo guarda cifrado en `identidad.token_map` y lo envía en cada
petición como `conocidos`. El servicio no persiste nada y no registra el texto.

## API

Todas las rutas salvo `/salud` exigen `Authorization: Bearer $SEUDONIMIZADOR_TOKEN`
(comparación en tiempo constante).

### `POST /seudonimizar`

```json
{
  "texto": "Hoy marta me dijo que en Telefónica no la valoran. Hablé con Pedro.",
  "conocidos": [
    {"valor": "Marta Ruiz", "token": "[P1]", "tipo": "P"},
    {"valor": "Telefónica", "token": "[ORG1]", "tipo": "ORG"}
  ],
  "siguiente": {"P": 2, "ORG": 2, "L": 1}
}
```

```json
{
  "texto": "Hoy [P1] me dijo que en [ORG1] no la valoran. Hablé con [P2].",
  "nuevos": [{"valor": "Pedro", "token": "[P2]", "tipo": "P"}]
}
```

- `conocidos`: lo declarado en onboarding + todo el `token_map` del usuario.
- `siguiente`: próximo número libre por tipo. Si llega atrasado respecto a
  `conocidos`, el servicio salta los números ya usados (nunca colisiona).
- `nuevos`: valores vistos por primera vez. El llamador debe añadirlos a
  `token_map` (cifrados) y actualizar `siguiente` antes de la siguiente llamada.
- Límites: `texto` ≤ 20 000 caracteres, `conocidos` ≤ 2 000 elementos.
- Errores de validación (422) devuelven solo la ubicación del campo, nunca el
  valor recibido.

### `GET /salud`

`{"estado": "ok", "modelo": "es_core_news_md"}`. Sin autenticación (lo usa el healthcheck).

## Pipeline

1. **Valores conocidos** — sustitución directa, insensible a mayúsculas y
   tildes (`marta`, `MARTA`, `Martá` → `[P1]`). Un conocido de persona con
   varias palabras también cubre su nombre de pila solo ("Marta Ruiz" → "Marta"),
   salvo que dos conocidos compartan nombre de pila.
2. **NER spaCy** `es_core_news_md`: `PER`→P, `ORG`→ORG, `LOC`→L (`MISC` se
   ignora). Se recortan bordes que no son nombre ("Ayer Marta" → "Marta"). Una
   entidad que contiene un conocido ("Marta Ruiz" con "Marta" conocida) toma el
   token del conocido.
3. **Heurísticas** (`app/lexico.py`):
   - Nombres de pila y apodos frecuentes de España y Latinoamérica, también en
     minúscula (`hablé con pedro`). Los que son también palabras comunes
     (`rosa`, `luz`, `julio`, `armando`, `pilar`…) solo cuentan en mayúscula a
     mitad de frase o tras un sustantivo relacional (`mi jefa rosa`).
   - Cualquier palabra tras un sustantivo relacional o tratamiento (`mi jefe`,
     `mi suegra`, `don`, `la doctora`…) si va en mayúscula o es nombre propio.
   - Palabras en mayúscula a mitad de frase que el NER no reconoció → se
     seudonimizan (siglas → ORG, tras `en/desde/hacia` → L, resto → P).
   - Extensión a apellidos y segundos nombres contiguos, incluidas partículas
     (`María José Sánchez de la Fuente` → un solo token).
   - Se respetan términos religiosos y de calendario (`Dios`, `Misa`, `Señor`,
     días, meses) para que el examen siga teniendo sentido.
4. **Tokens estables** — conocidos reutilizan su token; un valor nuevo recibe
   el siguiente número de su tipo y aparece en `nuevos`; dentro de una misma
   petición, repetirlo da el mismo token.

**Criterio de diseño:** ante la duda se seudonimiza. Un falso positivo
("la Reunión de Ventas" → "la [P1] de [P2]") cuesta algo de legibilidad al
modelo; un falso negativo es un incidente de datos.

**Pendiente respecto al esquema:** el esquema menciona fechas exactas (`[Fn]`);
el contrato actual de la API solo cubre P/ORG/L. Si se añaden, hay que ampliar
`tipo` en el llamador y en `token_map`.

## Desarrollo local

```bash
cd services/seudonimizador
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest -s
```

`-s` muestra el recall medido y cada fallo. El conjunto está en
`tests/frases.py` (101 frases, 126 menciones de persona: nombres al inicio de
frase, tras relacionales, apellidos compuestos, apodos, minúsculas, sin tildes,
Latinoamérica). Umbral exigido: recall ≥ 0,95 en personas. Medido hoy: 0,992
(único fallo: "Esperanza" a inicio de frase, nombre ambiguo que el NER no ve).
Ampliar el conjunto con casos reales (ya seudonimizados manualmente) en cuanto
haya usuarios internos.

Arrancar el servidor:

```bash
SEUDONIMIZADOR_TOKEN=$(openssl rand -hex 32) .venv/bin/uvicorn app.main:app --port 8000 --no-access-log
```

El token es obligatorio (≥ 32 caracteres); sin él el servicio no arranca.

## Despliegue (VPS Hostinger, junto a `/opt/virtuousleadership/`)

Requisitos:

- **El VPS debe estar en una región de la UE** (p. ej. Hostinger Lituania,
  Francia, Países Bajos o Alemania). El texto que llega aquí todavía no está
  seudonimizado: es dato personal y, por el contexto (creencias, vida
  interior), de categoría especial RGPD.
- **Solo accesible por HTTPS a través del nginx del host**, con el bearer token.
  El contenedor publica el puerto únicamente en `127.0.0.1`.

Pasos:

1. Generar el token y guardarlo en `/opt/virtuousleadership/.env` y como
   secreto de las Edge Functions (`supabase secrets set SEUDONIMIZADOR_TOKEN=…`
   y `SEUDONIMIZADOR_URL=https://seudo.virtuousleadership.com`):
   ```bash
   openssl rand -hex 32
   ```
2. Copiar el bloque de `docker-compose.snippet.yml` dentro de `services:` del
   `docker-compose.yml` existente (ajustar `build.context` a donde esté el repo).
3. Construir y arrancar solo este servicio:
   ```bash
   docker compose up -d --build seudonimizador
   ```
4. Añadir un server block en el nginx del host (certificado con certbot como
   el resto de dominios):
   ```nginx
   server {
       listen 443 ssl http2;
       server_name seudo.virtuousleadership.com;
       # ssl_certificate / ssl_certificate_key: los de certbot

       access_log off;               # no registrar nada de este servicio
       client_max_body_size 256k;
       limit_req zone=seudo burst=20 nodelay;   # zona definida en http {}:
       # limit_req_zone $binary_remote_addr zone=seudo:10m rate=10r/s;

       location / {
           proxy_pass http://127.0.0.1:8090;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_read_timeout 15s;
       }
   }
   ```
   nginx nunca registra cuerpos de petición, pero `access_log off` evita
   además dejar rastro de IPs y tiempos ligados a usuarios.
5. Comprobar:
   ```bash
   curl -s https://seudo.virtuousleadership.com/salud
   ```

La imagen incluye el modelo `es_core_news_md` (wheel fijado con sha256 en
`requirements.txt`), corre como usuario sin privilegios, con sistema de
ficheros de solo lectura y sin capacidades. `mem_limit` de 768 MB en el snippet: medir el consumo real tras el primer despliegue.

## Qué se registra

Solo `método ruta estado latencia` por petición (middleware propio; el access
log de uvicorn está desactivado). En errores 500 se registra el tipo de la
excepción, nunca su mensaje ni la traza, porque podrían contener texto del
usuario. Hay un test que lo comprueba (`test_logs_no_contienen_texto`).
