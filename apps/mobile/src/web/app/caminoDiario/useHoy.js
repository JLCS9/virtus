// Todo lo que necesita la pantalla Hoy para el reto y el examen: los datos del usuario, el reto y la cita
// del día, las variables ya rellenas y los pasos que le faltan hoy (ver lib/hoyGuiado.js). Un solo sitio para
// que el flujo guiado y la pantalla principal vean lo mismo.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { leerPreferencias } from '../../account/preferencias';
import { useDatos } from '../../account/useDatos';
import biblioteca from '../../data/camino-biblioteca.json';
import { ofrecerAlta, textoDeHabito, virtudDeReto } from '../../lib/habitos.js';
import { HORA_EXAMEN_POR_DEFECTO, aMinutos, examenToca, pasosDeHoy } from '../../lib/hoyGuiado.js';
import {
  citaDelDia, defectosDe, filtrarValidos, partesTemperamento, preguntasIniciales, preguntasPendientes, retoDelDia, sustituir, valoresDe,
} from '../../lib/retos.js';
import { useCaminoDiario } from '../useCaminoDiario';
import { usePersonas } from '../usePersonas';

// En producción solo se enseña lo «Aprobado» en la biblioteca; en desarrollo, también lo «Pendiente».
const CONTENIDO = { incluirPendientes: (process.env.NODE_ENV !== 'production') };
const RETOS = filtrarValidos(biblioteca.retos, CONTENIDO);
const CITAS = filtrarValidos(biblioteca.citas, CONTENIDO);
export const DEFECTOS = defectosDe(biblioteca.variables);
export const VARIABLES = Object.fromEntries(biblioteca.variables.map((v) => [v.id, v]));

export function useHoy(tempClave) {
  const camino = useCaminoDiario();
  const personas = usePersonas();
  const [propuestos, setPropuestos] = useState([]); // retos que se han propuesto hoy y no se han aceptado
  const [params] = useSearchParams();

  // La hora a la que toca el examen es la de reflexión que eligió en sus horarios.
  const horario = useDatos(camino.userId ? `horario:${camino.userId}` : null, async () => (await leerPreferencias()).preferencias.hora_reflexion);
  const horaExamen = horario.listo ? horario.datos : HORA_EXAMEN_POR_DEFECTO;

  // Reloj: se comprueba cada minuto por si llega la hora del examen con la pantalla abierta. En desarrollo,
  // `?hora=22:00` simula la hora para ver el flujo de la noche.
  const [reloj, setReloj] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setReloj(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const simulada = (process.env.NODE_ENV !== 'production') ? aMinutos(params.get('hora')) : null;
  const ahora = simulada === null ? reloj : new Date(2000, 0, 1, Math.floor(simulada / 60), simulada % 60);

  const cargando = camino.cargando || personas.cargando || (!horario.listo && !horario.error);
  const partes = partesTemperamento(tempClave);
  const sinContenido = !partes || !RETOS.length;
  const base = { camino, personas, cargando, error: camino.error, sinContenido, horaExamen };
  if (cargando || camino.error || sinContenido) return { ...base, pasos: [], pendientesIniciales: [], reto: null, cita: null, valores: {}, aceptado: false, examenHecho: false, toca: false };

  const pendientesIniciales = preguntasPendientes(preguntasIniciales(biblioteca.preguntas_iniciales, partes.primario, CONTENIDO), camino.respondidas);
  const reto = retoDelDia({ retos: RETOS, clave: tempClave, historial: camino.dias, fecha: camino.hoy });
  const cita = reto ? citaDelDia({ citas: CITAS, reto, historial: camino.dias, fecha: camino.hoy }) : null;
  const valores = valoresDe(camino.variables, personas.porId);
  const aceptado = Boolean(camino.diaDeHoy?.opcion);
  const examenHecho = Boolean(camino.diaDeHoy?.examen_en);
  const toca = examenToca(ahora, horaExamen);

  // El siguiente reto distinto de los ya propuestos hoy (la fila de hoy no cuenta: fijaría el actual).
  const proponerOtro = () => {
    const ya = [...new Set([...propuestos, reto.id])];
    setPropuestos(ya);
    return retoDelDia({ retos: RETOS, clave: tempClave, historial: camino.dias.filter((d) => d.fecha !== camino.hoy), fecha: camino.hoy, excluir: ya });
  };

  const variable = reto ? VARIABLES[reto.noche.variable] : null;
  const virtud = reto ? virtudDeReto(reto.virtud) : null;
  const ofrece = reto ? ofrecerAlta({ dia: camino.diaDeHoy, reto, habitos: camino.habitos, config: camino.configHabitos }) : false;
  const habito = ofrece && virtud ? { texto: textoDeHabito(sustituir(reto.opciones.habito, valores, DEFECTOS)), virtud } : null;

  return {
    ...base,
    pendientesIniciales, reto, cita, valores, variable, habito, proponerOtro, aceptado, examenHecho, toca,
    pasos: pasosDeHoy({ hayContenido: Boolean(reto), inicialesPendientes: pendientesIniciales.length, hayCita: Boolean(cita), retoAceptado: aceptado, examenHecho, examenToca: toca }),
  };
}
