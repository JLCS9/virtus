"""Pipeline de seudonimización (esquema §4).

1. Valores conocidos del usuario (lista de onboarding + token_map previo).
2. NER local con spaCy (PER, ORG, LOC).
3. Heurísticas: nombres de pila frecuentes, palabras en mayúscula tras indicios
   relacionales ("mi jefe", "con", "a") y extensión a apellidos.
4. Asignación de tokens estables: un valor ya conocido reutiliza su token; uno
   nuevo recibe el siguiente número de su tipo y se devuelve en `nuevos` para que
   el llamador lo guarde cifrado en `identidad.token_map`.

El servicio no guarda estado entre llamadas: todo lo que recuerda llega en
`conocidos` y `siguiente`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from spacy.language import Language
from spacy.tokens import Doc, Token

from .lexico import (
    APELLIDOS,
    INDICIOS_LUGAR,
    INDICIOS_PERSONA,
    NO_ENTIDAD,
    NOMBRES,
    NOMBRES_AMBIGUOS,
    PARTICULAS_NOMBRE,
    RELACIONALES,
)
from .normalizacion import normalizar, normalizar_con_mapa

Tipo = Literal["P", "ORG", "L"]

ETIQUETAS_SPACY: dict[str, Tipo] = {"PER": "P", "ORG": "ORG", "LOC": "L"}
RE_TOKEN = re.compile(r"\[(?:P|ORG|L)\d+\]")
FIN_DE_FRASE = {".", "!", "?", "¡", "¿", ":", ";", "\n", "\"", "«", "»", "(", "-", "—"}


@dataclass(frozen=True)
class Entidad:
    valor: str
    token: str
    tipo: Tipo


@dataclass
class _Tramo:
    inicio: int
    fin: int
    tipo: Tipo
    token: str | None = None  # fijado si viene de un valor conocido


def _clave(valor: str) -> str:
    return " ".join(normalizar(valor).split())


class _Registro:
    """Correspondencia valor normalizado -> token para esta petición."""

    def __init__(self, conocidos: list[Entidad], siguiente: dict[str, int]):
        self.siguiente = {t: max(1, siguiente.get(t, 1)) for t in ("P", "ORG", "L")}
        self.por_clave: dict[str, Entidad] = {}
        self.nuevos: list[Entidad] = []
        usados: dict[str, int] = {"P": 0, "ORG": 0, "L": 0}

        for c in conocidos:
            self.por_clave.setdefault(_clave(c.valor), c)
            m = re.fullmatch(r"\[(P|ORG|L)(\d+)\]", c.token)
            if m:
                usados[m.group(1)] = max(usados[m.group(1)], int(m.group(2)))

        # Nunca reutilizar un número ya asignado aunque `siguiente` venga atrasado.
        for t in self.siguiente:
            self.siguiente[t] = max(self.siguiente[t], usados[t] + 1)

        # Alias por nombre de pila ("Marta Ruiz" -> "Marta") solo si no es ambiguo.
        alias: dict[str, list[Entidad]] = {}
        for c in conocidos:
            partes = _clave(c.valor).split()
            if c.tipo == "P" and len(partes) > 1 and len(partes[0]) >= 3:
                alias.setdefault(partes[0], []).append(c)
        for nombre, candidatos in alias.items():
            if nombre not in self.por_clave and len({c.token for c in candidatos}) == 1:
                self.por_clave[nombre] = candidatos[0]

    def patrones_conocidos(self) -> list[tuple[str, Entidad]]:
        return sorted(self.por_clave.items(), key=lambda kv: -len(kv[0]))

    def token_para(self, valor: str, tipo: Tipo) -> str:
        clave = _clave(valor)
        if clave in self.por_clave:
            return self.por_clave[clave].token
        partes = clave.split()
        if tipo == "P" and len(partes) > 1:
            previo = self.por_clave.get(partes[0])
            if previo and previo.tipo == "P":
                return previo.token
        token = f"[{tipo}{self.siguiente[tipo]}]"
        self.siguiente[tipo] += 1
        entidad = Entidad(valor=valor, token=token, tipo=tipo)
        self.por_clave[clave] = entidad
        if tipo == "P" and len(partes) > 1 and len(partes[0]) >= 3:
            self.por_clave.setdefault(partes[0], entidad)
        self.nuevos.append(entidad)
        return token


class Seudonimizador:
    def __init__(self, nlp: Language):
        self.nlp = nlp

    def seudonimizar(
        self,
        texto: str,
        conocidos: list[Entidad],
        siguiente: dict[str, int],
    ) -> tuple[str, list[Entidad]]:
        registro = _Registro(conocidos, siguiente)
        ocupado = [False] * len(texto)
        tramos: list[_Tramo] = []

        def libre(i: int, f: int) -> bool:
            return not any(ocupado[i:f])

        def marcar(t: _Tramo) -> None:
            for k in range(t.inicio, t.fin):
                ocupado[k] = True
            tramos.append(t)

        # 0. Tokens ya presentes en el texto se respetan tal cual.
        for m in RE_TOKEN.finditer(texto):
            for k in range(m.start(), m.end()):
                ocupado[k] = True

        # 1. Valores conocidos (insensible a mayúsculas y tildes).
        normal, mapa = normalizar_con_mapa(texto)
        for clave, entidad in registro.patrones_conocidos():
            patron = r"(?<!\w)" + r"\s+".join(re.escape(p) for p in clave.split()) + r"(?!\w)"
            for m in re.finditer(patron, normal):
                i, f = mapa[m.start()], mapa[m.end() - 1] + 1
                if libre(i, f):
                    marcar(_Tramo(i, f, entidad.tipo, entidad.token))

        doc = self.nlp(texto)

        # 2. NER.
        for ent in doc.ents:
            tipo = ETIQUETAS_SPACY.get(ent.label_)
            if tipo is None:
                continue
            recorte = _recortar(doc, ent.start, ent.end)
            if recorte is None:
                continue
            ini, fin = recorte
            if tipo != "P" and normalizar(doc[ini].text) in NOMBRES:
                tipo = "P"  # spaCy confunde a veces nombres de pila con ORG/LOC
            i, f = doc[ini].idx, doc[fin - 1].idx + len(doc[fin - 1])
            if libre(i, f):
                marcar(_Tramo(i, f, tipo))
                continue
            # Una entidad que contiene un conocido ("Marta Ruiz" con "Marta"
            # conocida) se queda con el token del conocido.
            for t in tramos:
                if t.token and t.tipo == "P" and tipo == "P" and i <= t.inicio and t.fin <= f:
                    if all(not ocupado[k] or t.inicio <= k < t.fin for k in range(i, f)):
                        for k in range(i, f):
                            ocupado[k] = True
                        t.inicio, t.fin = i, f
                    break

        # 3. Heurísticas sobre tokens no cubiertos.
        for tok in doc:
            i, f = tok.idx, tok.idx + len(tok)
            if not libre(i, f):
                continue
            tipo = _heuristica(doc, tok)
            if tipo:
                marcar(_Tramo(i, f, tipo))

        # Extensión a apellidos / nombres compuestos para todos los tramos de persona.
        for t in tramos:
            if t.tipo == "P":
                t.fin = _extender(doc, texto, t.fin, ocupado)

        # 4. Tokens y reconstrucción.
        salida: list[str] = []
        cursor = 0
        for t in sorted(tramos, key=lambda t: t.inicio):
            token = t.token or registro.token_para(texto[t.inicio : t.fin], t.tipo)
            salida.append(texto[cursor : t.inicio])
            salida.append(token)
            cursor = t.fin
        salida.append(texto[cursor:])
        return "".join(salida), registro.nuevos


def _es_mayuscula(tok: Token) -> bool:
    return tok.text[:1].isupper() and tok.is_alpha


def _inicio_de_frase(doc: Doc, tok: Token) -> bool:
    if tok.i == 0 or tok.is_sent_start:
        return True
    previo = doc[tok.i - 1]
    return previo.text in FIN_DE_FRASE or "\n" in previo.whitespace_ or previo.is_space


def _es_nombre(norm: str, mayuscula: bool, inicio: bool, tras_relacional: bool) -> bool:
    if norm in NOMBRES_AMBIGUOS:
        return (mayuscula and not inicio) or tras_relacional
    return norm in NOMBRES


def _recortar(doc: Doc, ini: int, fin: int) -> tuple[int, int] | None:
    """Quita de los bordes de una entidad de spaCy lo que no es nombre
    ("Ayer Marta" -> "Marta", "Marta me" -> "Marta")."""

    def sobra(tok: Token) -> bool:
        norm = normalizar(tok.text)
        if norm in NOMBRES or norm in NOMBRES_AMBIGUOS:
            return False
        if not tok.text[:1].isupper() and not tok.text[:1].isdigit():
            return True
        return norm in NO_ENTIDAD or tok.is_punct or (
            tok.pos_ in {"VERB", "AUX", "ADV", "PRON", "DET", "ADP", "SCONJ", "CCONJ", "INTJ"}
            and _inicio_de_frase(doc, tok)
        )

    while ini < fin and sobra(doc[ini]):
        ini += 1
    while fin > ini and (doc[fin - 1].is_punct or not doc[fin - 1].text[:1].isupper()
                         and normalizar(doc[fin - 1].text) not in NOMBRES):
        fin -= 1
    if ini >= fin:
        return None
    if fin - ini == 1 and normalizar(doc[ini].text) in NO_ENTIDAD:
        return None
    return ini, fin


def _tras_relacional(doc: Doc, tok: Token) -> bool:
    if tok.i == 0:
        return False
    previo = normalizar(doc[tok.i - 1].text.rstrip("."))
    return previo in RELACIONALES


def _heuristica(doc: Doc, tok: Token) -> Tipo | None:
    if not tok.is_alpha or len(tok.text) < 2:
        return None
    norm = normalizar(tok.text)
    mayuscula = tok.text[:1].isupper()
    inicio = _inicio_de_frase(doc, tok)
    relacional = _tras_relacional(doc, tok)

    if _es_nombre(norm, mayuscula, inicio, relacional):
        return "P"
    if norm in NO_ENTIDAD:
        return None
    if relacional and (mayuscula or tok.pos_ == "PROPN"):
        return "P"
    if mayuscula and not inicio:
        # Palabra en mayúscula a mitad de frase que el NER no reconoció: ante la
        # duda se seudonimiza (un falso positivo cuesta legibilidad; un falso
        # negativo es un incidente de datos).
        if tok.text.isupper() and len(tok.text) > 1:
            return "ORG"
        previo = normalizar(doc[tok.i - 1].text) if tok.i else ""
        if previo in INDICIOS_LUGAR:
            return "L"
        return "P"
    if inicio and mayuscula and tok.pos_ == "PROPN" and tok.i + 1 < len(doc):
        siguiente = doc[tok.i + 1]
        if siguiente.pos_ in {"VERB", "AUX"} or normalizar(siguiente.text) in INDICIOS_PERSONA:
            return "P"
    return None


def _extender(doc: Doc, texto: str, fin: int, ocupado: list[bool]) -> int:
    """Alarga un tramo de persona con apellidos y segundos nombres contiguos:
    "María" + " José López de la Fuente"."""
    i = next((t.i for t in doc if t.idx >= fin), len(doc))
    while i < len(doc):
        tok = doc[i]
        if ocupado[tok.idx] or tok.is_punct or "\n" in texto[fin:tok.idx]:
            break
        norm = normalizar(tok.text)
        if (_es_mayuscula(tok) and norm not in NO_ENTIDAD) or norm in APELLIDOS or norm in NOMBRES:
            nuevo_fin = tok.idx + len(tok)
            i += 1
        elif norm in PARTICULAS_NOMBRE and norm != "y":
            # "de la Fuente": solo si tras las partículas viene una mayúscula.
            j = i
            while j < len(doc) and normalizar(doc[j].text) in PARTICULAS_NOMBRE:
                j += 1
            if j < len(doc) and _es_mayuscula(doc[j]) and not ocupado[doc[j].idx]:
                nuevo_fin = doc[j].idx + len(doc[j])
                i = j + 1
            else:
                break
        else:
            break
        for k in range(fin, nuevo_fin):
            ocupado[k] = True
        fin = nuevo_fin
    return fin
