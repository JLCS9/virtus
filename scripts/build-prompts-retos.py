#!/usr/bin/env python3
"""
Genera packages/method/src/retos/prompts.ts copiando LITERALMENTE los bloques de
packages/content/vendor/havard/02_Prompts_sistema.md (fuente de verdad; no se reescriben).
Uso: python3 scripts/build-prompts-retos.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'packages/content/vendor/havard/02_Prompts_sistema.md'
OUT = ROOT / 'packages/method/src/retos/prompts.ts'

md = SRC.read_text(encoding='utf-8')
bloques = re.findall(r'^```\n(.*?)\n```', md, flags=re.S | re.M)
nombres = ['BLOQUE_BASE', 'MODO_ONBOARDING', 'MODO_MANANA', 'MODO_NOCHE', 'CLASIFICADOR_CRISIS']
assert len(bloques) == len(nombres), f'se esperaban {len(nombres)} bloques, hay {len(bloques)}'
assert bloques[0].startswith('Eres el coach') and bloques[4].startswith('Clasifica')

reintento = re.search(r'el mensaje "(El JSON anterior no era válido: \{\{error\}\}\. Responde solo con el JSON corregido\.)"', md).group(1)
atencion = re.search(r'la línea "(Hoy la persona parece pasar un mal momento:[^"]+)"', md).group(1)

out = ['// Generado por scripts/build-prompts-retos.py desde 02_Prompts_sistema.md. No editar a mano.', '']
for n, b in zip(nombres, bloques):
    out.append(f'export const {n} = {json.dumps(b, ensure_ascii=False)};')
out.append(f'export const MENSAJE_REINTENTO = {json.dumps(reintento, ensure_ascii=False)};')
out.append(f'export const LINEA_ATENCION = {json.dumps(atencion, ensure_ascii=False)};')
out.append("export const EXTRAER_PERFIL = 'EXTRAER_PERFIL';")
out.append("export const EXTRAER_EXAMEN = 'EXTRAER_EXAMEN';")
out.append('')
out.append('/** Sustituye {{variable}}; falla si falta alguna (nunca se envía un prompt a medias). */')
out.append('export function rellenar(plantilla: string, vars: Record<string, string | number | boolean | null>): string {')
out.append('  return plantilla.replace(/\\{\\{(\\w+)\\}\\}/g, (_, k: string) => {')
out.append("    if (!(k in vars)) throw new Error(`prompt: falta la variable {{${k}}}`);")
out.append("    const v = vars[k];")
out.append("    return v === null ? 'null' : String(v);")
out.append('  });')
out.append('}')
OUT.write_text('\n'.join(out) + '\n', encoding='utf-8')
print('ok', OUT.relative_to(ROOT))
