#!/usr/bin/env python3
"""
Importa la biblioteca de retos de Havard (xlsx) a:
  - supabase/seed_retos.sql                       → metodo.disparador + metodo.reto (upsert)
  - packages/content/src/es/retos-havard.json     → respaldo offline de la app y fixtures del motor

Fuente: packages/content/vendor/havard/Biblioteca_de_retos_Havard.xlsx (hoja «Retos»).
Los disparadores en texto libre se normalizan con mapeo_disparadores.csv contra
catalogo_disparadores.csv; si queda alguno sin mapear, falla.

Solo librería estándar (el xlsx se lee como zip + XML). Uso:
  python3 scripts/import-retos-havard.py
"""
import csv
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / 'packages/content/vendor/havard'
XLSX = VENDOR / 'Biblioteca_de_retos_Havard.xlsx'
OUT_SQL = ROOT / 'supabase/seed_retos.sql'
OUT_JSON = ROOT / 'packages/content/src/es/retos-havard.json'

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
TEMP = {'colérico': 'COL', 'melancólico': 'MEL', 'sanguíneo': 'SAN', 'flemático': 'FLE'}
VIRTUDES = {'prudencia', 'fortaleza', 'dominio de sí', 'justicia', 'magnanimidad', 'humildad'}
SUBCOMP = {'deliberacion', 'decision', 'audacia', 'resistencia', 'fundamental', 'fraternal'}
AMBITOS = {'trabajo', 'familia', 'amistad', 'vida interior', 'cultura', 'cuerpo', 'sociedad'}
OBSTACULOS = {'conformismo', 'perfeccionismo', 'impaciencia', 'falta de realismo',
              'autosatisfacción', 'determinismo', 'voluntarismo'}


def read_sheet(name: str) -> list[dict]:
    with zipfile.ZipFile(XLSX) as z:
        shared = [''.join(t.text or '' for t in si.iter(f"{{{NS['m']}}}t"))
                  for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rid = next(s.get(f"{{{NS['r']}}}id") for s in wb.iter(f"{{{NS['m']}}}sheet") if s.get('name') == name)
        target = next(r.get('Target') for r in rels if r.get('Id') == rid)
        sheet = ET.fromstring(z.read('xl/' + target.lstrip('/').removeprefix('xl/')))
    rows = []
    for r in sheet.iter(f"{{{NS['m']}}}row"):
        row = {}
        for c in r:
            col = re.match(r'[A-Z]+', c.get('r')).group()
            v = c.find('m:v', NS)
            if v is not None:
                row[col] = shared[int(v.text)] if c.get('t') == 's' else v.text
            else:
                t = c.find('.//m:t', NS)
                row[col] = t.text if t is not None else None
        rows.append(row)
    header = rows[0]
    return [{header[k]: (v.strip() if isinstance(v, str) else v) for k, v in r.items() if k in header}
            for r in rows[1:] if any(r.values())]


def si_no(v, campo, rid) -> bool:
    if v in ('sí', 'si'): return True
    if v == 'no': return False
    sys.exit(f'{rid}: {campo} debe ser sí/no, es {v!r}')


def entero(v, rid, campo, lo=None, hi=None):
    if v is None or v == '': return None
    n = int(float(v))
    if lo is not None and not lo <= n <= hi: sys.exit(f'{rid}: {campo}={n} fuera de rango')
    return n


def main() -> None:
    catalogo = list(csv.DictReader(open(VENDOR / 'catalogo_disparadores.csv', encoding='utf-8')))
    claves = {d['clave'] for d in catalogo}
    mapeo = {m['texto_excel']: m['clave'] for m in csv.DictReader(open(VENDOR / 'mapeo_disparadores.csv', encoding='utf-8'))}
    for texto, clave in mapeo.items():
        if clave not in claves: sys.exit(f'mapeo: «{texto}» → {clave} no está en el catálogo')

    retos, sin_mapear, ids = [], set(), set()
    for d in read_sheet('Retos'):
        rid = d['id']
        if rid in ids: sys.exit(f'id duplicado: {rid}')
        ids.add(rid)
        if d['virtud'] not in VIRTUDES: sys.exit(f'{rid}: virtud {d["virtud"]!r}')
        if d.get('subcomponente') and d['subcomponente'] not in SUBCOMP: sys.exit(f'{rid}: subcomponente')
        if d['ambito'] not in AMBITOS: sys.exit(f'{rid}: ámbito {d["ambito"]!r}')
        if d.get('obstaculo_que_combate') and d['obstaculo_que_combate'] not in OBSTACULOS:
            sys.exit(f'{rid}: obstáculo {d["obstaculo_que_combate"]!r}')
        if not d.get('pregunta_examen'): sys.exit(f'{rid}: falta pregunta_examen')
        texto_disp = d.get('disparador_contextual')
        if texto_disp and texto_disp not in mapeo: sin_mapear.add(texto_disp)
        perfil = None
        if rid.startswith('gt-'):
            m = re.match(r'Si eres (\w+)-(\w+):', d['texto'])
            if not m or m.group(1) not in TEMP or m.group(2) not in TEMP:
                sys.exit(f'{rid}: no se reconoce el perfil combinado en el texto')
            perfil = f'{TEMP[m.group(1)]}-{TEMP[m.group(2)]}'
        retos.append({
            'id': rid,
            'texto': d['texto'],
            'variante_corta': d.get('variante_corta'),
            'virtud': d['virtud'],
            'subcomponente': d.get('subcomponente') or None,
            'facultad': d['facultad'],
            'ambito': d['ambito'],
            'tipo': d['tipo'],
            'minutos_estimados': entero(d.get('minutos_estimados'), rid, 'minutos'),
            'requiere_otra_persona': si_no(d.get('requiere_otra_persona'), 'requiere_otra_persona', rid),
            'disparador': mapeo.get(texto_disp, 'sin_disparador') if texto_disp else 'sin_disparador',
            'dif_colerico': entero(d['dif_colerico'], rid, 'dif_colerico', 1, 5),
            'dif_melancolico': entero(d['dif_melancolico'], rid, 'dif_melancolico', 1, 5),
            'dif_sanguineo': entero(d['dif_sanguineo'], rid, 'dif_sanguineo', 1, 5),
            'dif_flematico': entero(d['dif_flematico'], rid, 'dif_flematico', 1, 5),
            'obstaculo': d.get('obstaculo_que_combate') or None,
            'repetible': si_no(d.get('repetible'), 'repetible', rid),
            'pregunta_examen': d['pregunta_examen'],
            'fuente_libro': d.get('fuente_libro'),
            'fuente_seccion': d.get('fuente_seccion'),
            'cita_literal': d.get('cita_literal'),
            'perfil_combinado': perfil,
            'activo': True,
        })
    if sin_mapear:
        sys.exit('Disparadores sin mapear en mapeo_disparadores.csv:\n  ' + '\n  '.join(sorted(sin_mapear)))

    def q(v):
        if v is None: return 'null'
        if isinstance(v, bool): return 'true' if v else 'false'
        if isinstance(v, int): return str(v)
        return "'" + str(v).replace("'", "''") + "'"

    cols = list(retos[0].keys())
    sql = ['-- Generado por scripts/import-retos-havard.py. No editar a mano.',
           f'-- {len(retos)} retos, {len(catalogo)} disparadores.', '']
    for d in catalogo:
        sql.append(f"insert into metodo.disparador (clave, descripcion, ambito) values "
                   f"({q(d['clave'])}, {q(d['descripcion'])}, {q(d['ambito'] or None)}) "
                   f"on conflict (clave) do update set descripcion = excluded.descripcion, ambito = excluded.ambito;")
    sql.append('')
    upd = ', '.join(f'{c} = excluded.{c}' for c in cols if c != 'id')
    for r in retos:
        sql.append(f"insert into metodo.reto ({', '.join(cols)}) values ({', '.join(q(r[c]) for c in cols)}) "
                   f"on conflict (id) do update set {upd};")
    # Retos que ya no están en el Excel se desactivan (nunca se borran: dia.reto_id los referencia).
    sql.append(f"update metodo.reto set activo = false where id not in ({', '.join(q(r['id']) for r in retos)});")
    OUT_SQL.write_text('\n'.join(sql) + '\n', encoding='utf-8')

    OUT_JSON.write_text(json.dumps({
        'fuente': XLSX.name,
        'disparadores': [{'clave': d['clave'], 'descripcion': d['descripcion'], 'ambito': d['ambito'] or None}
                         for d in catalogo],
        'retos': retos,
    }, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{len(retos)} retos, {len(catalogo)} disparadores → {OUT_SQL.relative_to(ROOT)}, {OUT_JSON.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
