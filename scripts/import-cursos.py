#!/usr/bin/env python3
"""
Importa los cursos en vídeo de Alex (Vimeo) a packages/content/src/es/cursos.json.

Uso:  python3 scripts/import-cursos.py "~/Downloads/Enlaces videos.xlsx"

El Excel tiene una fila «Curso N» y debajo las lecciones: título y código de inserción de Vimeo.
De Vimeo se leen la duración y la miniatura (oEmbed). Las etiquetas por virtud y
temperamento se deducen de cada curso y del título; revisarlas a mano si cambian los cursos.
"""
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import openpyxl

OUT = Path(__file__).resolve().parent.parent / 'packages/content/src/es/cursos.json'

# Virtudes y temas de cada curso (las del ciclo usan estos nombres: ver WORK_VIRTUES).
COURSES = {
    1: {'virtudes': [], 'temas': ['temperamento', 'caracter']},
    2: {'virtudes': ['magnanimidad'], 'temas': ['virtudes']},
    3: {'virtudes': ['humildad'], 'temas': ['virtudes']},
    4: {'virtudes': ['prudencia', 'fortaleza', 'dominio', 'justicia'], 'temas': ['virtudes']},
    5: {'virtudes': [], 'temas': ['corazon']},
    6: {'virtudes': ['magnanimidad'], 'temas': ['mision']},
    7: {'virtudes': [], 'temas': ['corazon']},
}
# Erratas del Excel de origen.
FIXES = {'Practicar a magnanimidad': 'Practicar la magnanimidad'}
TEMPERAMENTS = {'colérico': 'COL', 'melancólico': 'MEL', 'sanguíneo': 'SAN', 'flemático': 'FLE'}
VIRTUE_WORDS = {'prudencia': 'prudencia', 'fortaleza': 'fortaleza', 'dominio de sí': 'dominio', 'justicia': 'justicia',
                'magnanimidad': 'magnanimidad', 'humildad': 'humildad'}


def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'virtus-import'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def oembed(vimeo_id):
    q = urllib.parse.quote(f'https://vimeo.com/{vimeo_id}', safe='')
    o = get_json(f'https://vimeo.com/api/oembed.json?url={q}&width=640')
    return {'duracion': int(o.get('duration') or 0), 'miniatura': o.get('thumbnail_url')}


def read_rows(xlsx):
    ws = openpyxl.load_workbook(xlsx).active
    course, rows = None, []
    for a, b, c in ws.iter_rows(min_col=1, max_col=3, values_only=True):
        if a and str(a).strip().lower().startswith('curso'):
            course = int(str(a).split()[-1])
        if b and c:
            m = re.match(r'\s*(\d+)\.(\d+)\s+(.*)', str(b))
            vid = re.search(r'player\.vimeo\.com/video/(\d+)', str(c))
            if not (m and vid):
                sys.exit(f'Fila no reconocida: {b!r}')
            rows.append({'course': course, 'n': int(m.group(2)), 'titulo': m.group(3).strip(), 'vimeoId': vid.group(1)})
    return rows


def main():
    xlsx = Path(sys.argv[1] if len(sys.argv) > 1 else '~/Downloads/Enlaces videos.xlsx').expanduser()
    rows = read_rows(xlsx)
    with ThreadPoolExecutor(8) as ex:
        meta = list(ex.map(lambda r: oembed(r['vimeoId']), rows))

    courses = []
    for num in sorted({r['course'] for r in rows}):
        lessons = [(r, m) for r, m in zip(rows, meta) if r['course'] == num]
        lessons.sort(key=lambda x: x[0]['n'])
        intro = lessons[0][0]
        titulo = FIXES.get(intro['titulo'], intro['titulo'])
        out = []
        for r, m in lessons:
            low = unicodedata.normalize('NFC', r['titulo']).lower()
            out.append({
                'id': f"{num}.{r['n']}",
                'titulo': FIXES.get(r['titulo'], r['titulo']) if r['n'] else 'Introducción',
                'vimeoId': r['vimeoId'],
                **m,
                'virtudes': sorted({v for w, v in VIRTUE_WORDS.items() if w in low}),
                'temperamentos': [t for w, t in TEMPERAMENTS.items() if w in low and '4 temperamentos' not in low],
            })
        courses.append({'id': f'curso-{num}', 'numero': num, 'titulo': titulo, **COURSES.get(num, {'virtudes': [], 'temas': []}), 'lecciones': out})

    OUT.write_text(json.dumps(courses, ensure_ascii=False, indent=2) + '\n')
    total = sum(len(c['lecciones']) for c in courses)
    print(f'{len(courses)} cursos, {total} lecciones → {OUT.relative_to(Path.cwd()) if OUT.is_relative_to(Path.cwd()) else OUT}')


if __name__ == '__main__':
    main()
