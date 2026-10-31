"""Servicio HTTP del seudonimizador.

Sin estado y sin registro de contenido: los logs solo llevan método, ruta,
estado y latencia. Nunca se escribe en log el cuerpo de una petición ni el
mensaje de una excepción (podría contener texto del usuario).
"""

from __future__ import annotations

import hmac
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Literal

import spacy
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .seudonimizador import Entidad, Seudonimizador

MODELO = os.environ.get("SEUDONIMIZADOR_MODELO", "es_core_news_md")
MAX_TEXTO = 20_000
MAX_CONOCIDOS = 2_000

log = logging.getLogger("seudonimizador")


class Conocido(BaseModel):
    valor: str = Field(min_length=1, max_length=200)
    token: str = Field(pattern=r"^\[(P|ORG|L)\d+\]$")
    tipo: Literal["P", "ORG", "L"]


class Siguiente(BaseModel):
    P: int = Field(default=1, ge=1)
    ORG: int = Field(default=1, ge=1)
    L: int = Field(default=1, ge=1)


class Peticion(BaseModel):
    texto: str = Field(max_length=MAX_TEXTO)
    conocidos: list[Conocido] = Field(default_factory=list, max_length=MAX_CONOCIDOS)
    siguiente: Siguiente = Field(default_factory=Siguiente)


class Nuevo(BaseModel):
    valor: str
    token: str
    tipo: Literal["P", "ORG", "L"]


class Respuesta(BaseModel):
    texto: str
    nuevos: list[Nuevo]


def _token_esperado() -> bytes:
    token = os.environ.get("SEUDONIMIZADOR_TOKEN", "")
    if len(token) < 32:
        raise RuntimeError("SEUDONIMIZADOR_TOKEN no definido o demasiado corto (mínimo 32 caracteres)")
    return token.encode()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    app.state.token = _token_esperado()
    app.state.motor = Seudonimizador(spacy.load(MODELO))
    yield


app = FastAPI(
    title="seudonimizador",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


def autorizar(request: Request, authorization: str = Header(default="")) -> None:
    esquema, _, credencial = authorization.partition(" ")
    valido = hmac.compare_digest(credencial.encode(), request.app.state.token)
    if esquema.lower() != "bearer" or not valido:
        raise HTTPException(status_code=401, detail="no autorizado")


@app.middleware("http")
async def registrar_latencia(request: Request, call_next):
    inicio = time.perf_counter()
    try:
        respuesta = await call_next(request)
    except Exception as exc:  # noqa: BLE001 - se registra solo el tipo, nunca el mensaje
        log.error("%s %s 500 %.1fms %s", request.method, request.url.path,
                  (time.perf_counter() - inicio) * 1000, type(exc).__name__)
        return JSONResponse({"detail": "error interno"}, status_code=500)
    log.info("%s %s %d %.1fms", request.method, request.url.path, respuesta.status_code,
             (time.perf_counter() - inicio) * 1000)
    return respuesta


@app.exception_handler(RequestValidationError)
async def validacion(_: Request, exc: RequestValidationError):
    # La respuesta por defecto devuelve el `input` recibido; aquí solo la ubicación.
    errores = [{"loc": e.get("loc"), "type": e.get("type")} for e in exc.errors()]
    return JSONResponse({"detail": errores}, status_code=422)


@app.get("/salud")
def salud() -> dict[str, str]:
    return {"estado": "ok", "modelo": MODELO}


@app.post("/seudonimizar", response_model=Respuesta, dependencies=[Depends(autorizar)])
def seudonimizar(peticion: Peticion, request: Request) -> Respuesta:
    texto, nuevos = request.app.state.motor.seudonimizar(
        peticion.texto,
        [Entidad(c.valor, c.token, c.tipo) for c in peticion.conocidos],
        peticion.siguiente.model_dump(),
    )
    return Respuesta(
        texto=texto,
        nuevos=[Nuevo(valor=n.valor, token=n.token, tipo=n.tipo) for n in nuevos],
    )
