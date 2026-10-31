import unicodedata


def normalizar(texto: str) -> str:
    """Minúsculas y sin tildes/diacríticos ("Begoña" -> "begona")."""
    descompuesto = unicodedata.normalize("NFD", texto.casefold())
    return "".join(c for c in descompuesto if not unicodedata.combining(c))


def normalizar_con_mapa(texto: str) -> tuple[str, list[int]]:
    """Normaliza `texto` y devuelve, para cada carácter normalizado, su índice
    en el original. Permite buscar en el texto normalizado y sustituir en el
    original sin perder posiciones."""
    salida: list[str] = []
    mapa: list[int] = []
    for i, c in enumerate(texto):
        for n in normalizar(c):
            salida.append(n)
            mapa.append(i)
    return "".join(salida), mapa
