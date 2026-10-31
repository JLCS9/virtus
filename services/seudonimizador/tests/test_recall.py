import re

from app.normalizacion import normalizar

from .frases import FRASES_PERSONAS, FRASES_SIN_PERSONAS

RECALL_MINIMO = 0.95


def queda(fragmento: str, salida: str) -> bool:
    """¿Sigue alguna palabra de `fragmento` en `salida`? (sin tildes ni mayúsculas)"""
    normal = normalizar(salida)
    return any(re.search(rf"(?<!\w){re.escape(normalizar(p))}(?!\w)", normal)
               for p in fragmento.split())


def test_conjunto_suficiente():
    assert len(FRASES_PERSONAS) >= 60


def test_recall_personas(seudonimizar):
    total, fallos = 0, []
    for frase, nombres in FRASES_PERSONAS:
        salida = seudonimizar(frase)["texto"]
        for nombre in nombres:
            total += 1
            if queda(nombre, salida):
                fallos.append(f"{nombre!r} en {salida!r}")
    recall = 1 - len(fallos) / total
    print(f"\nrecall PER = {recall:.3f} ({total - len(fallos)}/{total})")
    for f in fallos:
        print("  fallo:", f)
    assert recall >= RECALL_MINIMO, "\n".join(fallos)


def test_no_destroza_texto_sin_personas(seudonimizar):
    perdidas = []
    for frase, palabras in FRASES_SIN_PERSONAS:
        salida = seudonimizar(frase)["texto"]
        perdidas += [f"{p!r} en {salida!r}" for p in palabras if not queda(p, salida)]
    assert not perdidas, "\n".join(perdidas)
