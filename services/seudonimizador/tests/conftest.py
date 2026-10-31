import os

import pytest
from fastapi.testclient import TestClient

TOKEN = "t" * 48
os.environ["SEUDONIMIZADOR_TOKEN"] = TOKEN


@pytest.fixture(scope="session")
def cliente():
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def seudonimizar(cliente):
    def _llamar(texto, conocidos=(), siguiente=None):
        r = cliente.post(
            "/seudonimizar",
            headers={"Authorization": f"Bearer {TOKEN}"},
            json={"texto": texto, "conocidos": list(conocidos),
                  "siguiente": siguiente or {"P": 1, "ORG": 1, "L": 1}},
        )
        assert r.status_code == 200, r.text
        return r.json()

    return _llamar
