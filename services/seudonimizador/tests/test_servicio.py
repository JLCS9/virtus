import logging
import re

from .conftest import TOKEN
from .test_recall import queda

MARTA = {"valor": "Marta Ruiz", "token": "[P1]", "tipo": "P"}
EMPRESA = {"valor": "Telefónica", "token": "[ORG1]", "tipo": "ORG"}
HIJO = {"valor": "Iñigo", "token": "[P2]", "tipo": "P"}


def test_salud(cliente):
    r = cliente.get("/salud")
    assert r.status_code == 200 and r.json()["estado"] == "ok"


def test_sin_token_401(cliente):
    assert cliente.post("/seudonimizar", json={"texto": "hola"}).status_code == 401


def test_token_incorrecto_401(cliente):
    r = cliente.post("/seudonimizar", json={"texto": "hola"},
                     headers={"Authorization": "Bearer " + "x" * 48})
    assert r.status_code == 401
    r = cliente.post("/seudonimizar", json={"texto": "hola"},
                     headers={"Authorization": "Basic " + TOKEN})
    assert r.status_code == 401


def test_error_de_validacion_no_devuelve_el_texto(cliente):
    r = cliente.post("/seudonimizar", headers={"Authorization": f"Bearer {TOKEN}"},
                     json={"texto": "Marta Ruiz", "conocidos": [{"valor": "Marta", "token": "malo", "tipo": "P"}]})
    assert r.status_code == 422
    assert "Marta" not in r.text


def test_reutiliza_conocidos(seudonimizar):
    r = seudonimizar(
        "marta me dijo que en TELEFONICA no la valoran. Luego Marta Ruiz se fue con iñigo.",
        conocidos=[MARTA, EMPRESA, HIJO],
        siguiente={"P": 3, "ORG": 2, "L": 1},
    )
    assert r["texto"] == "[P1] me dijo que en [ORG1] no la valoran. Luego [P1] se fue con [P2]."
    assert r["nuevos"] == []


def test_conocido_con_apellido_nuevo_reutiliza_token(seudonimizar):
    r = seudonimizar("Hoy comí con Iñigo Zubizarreta.", conocidos=[HIJO], siguiente={"P": 3, "ORG": 1, "L": 1})
    assert r["texto"] == "Hoy comí con [P2]."
    assert r["nuevos"] == []


def test_nuevos_numerados_desde_siguiente_y_estables(seudonimizar):
    r = seudonimizar("Pedro me ayudó. Después Pedro se fue con Lucía.",
                     conocidos=[MARTA], siguiente={"P": 4, "ORG": 1, "L": 1})
    assert r["texto"] == "[P4] me ayudó. Después [P4] se fue con [P5]."
    assert r["nuevos"] == [{"valor": "Pedro", "token": "[P4]", "tipo": "P"},
                           {"valor": "Lucía", "token": "[P5]", "tipo": "P"}]


def test_siguiente_atrasado_no_colisiona(seudonimizar):
    r = seudonimizar("Hablé con Pedro.", conocidos=[MARTA, HIJO], siguiente={"P": 1, "ORG": 1, "L": 1})
    assert r["texto"] == "Hablé con [P3]."


def test_respeta_tokens_existentes(seudonimizar):
    r = seudonimizar("Ayer [P1] y Pedro hablaron.", siguiente={"P": 2, "ORG": 1, "L": 1})
    assert r["texto"] == "Ayer [P1] y [P2] hablaron."


def test_flujo_entre_llamadas(seudonimizar):
    """Lo que devuelve `nuevos` en una llamada, pasado como `conocidos` en la
    siguiente, da los mismos tokens."""
    r1 = seudonimizar("Mi jefe Ramón Gil me gritó en Mercadona.")
    conocidos = r1["nuevos"]
    siguiente = {"P": 1, "ORG": 1, "L": 1}
    for n in conocidos:
        siguiente[n["tipo"]] = max(siguiente[n["tipo"]], int(re.sub(r"\D", "", n["token"])) + 1)
    r2 = seudonimizar("ramón me pidió perdón; mañana vuelvo a mercadona", conocidos, siguiente)
    token_ramon = next(n["token"] for n in conocidos if n["valor"].startswith("Ramón"))
    assert token_ramon in r2["texto"]
    assert r2["nuevos"] == []


def test_salida_sin_nombres_originales(seudonimizar):
    texto = (
        "Hoy fue un día duro. Mi mujer Begoña se enfadó porque llegué tarde de Iberdrola. "
        "En la reunión, Juan Carlos Martínez me dejó en evidencia delante de Lucía y de "
        "Txema. Después llamé a mi madre, que vive en Valladolid, y le conté que el "
        "señor Gutiérrez quiere despedir a paco. Marta Ruiz me escribió por la noche."
    )
    originales = ["Begoña", "Iberdrola", "Juan", "Carlos", "Martínez", "Lucía", "Txema",
                  "Valladolid", "Gutiérrez", "paco", "Marta", "Ruiz"]
    r = seudonimizar(texto, conocidos=[MARTA], siguiente={"P": 2, "ORG": 1, "L": 1})
    restos = [o for o in originales if queda(o, r["texto"])]
    assert not restos, r["texto"]
    for n in r["nuevos"]:
        assert re.fullmatch(r"\[(P|ORG|L)\d+\]", n["token"])


def test_logs_no_contienen_texto(cliente, caplog):
    with caplog.at_level(logging.DEBUG):
        cliente.post("/seudonimizar", headers={"Authorization": f"Bearer {TOKEN}"},
                     json={"texto": "Rigoberta Menchú me llamó."})
        cliente.post("/seudonimizar", headers={"Authorization": f"Bearer {TOKEN}"},
                     json={"texto": "Rigoberta", "conocidos": [{"valor": "Rigoberta"}]})
    assert "Rigoberta" not in caplog.text
    assert "/seudonimizar 200" in caplog.text
