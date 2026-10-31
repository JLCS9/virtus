/**
 * `{{razon_temperamento}}` del modo MAÑANA (02 §2): tabla fija por (temperamento, virtud).
 * BORRADOR para revisión editorial: redactado a partir de los «puntos débiles clave» de la hoja
 * Catálogo (Del temperamento al carácter). El ejemplo del 02 está en colérico + humildad fundamental.
 */
import type { Temperamento, VirtudClave } from './tipos.ts';

export const RAZON_TEMPERAMENTO: Record<Temperamento, Record<VirtudClave, string>> = {
  colerico: {
    prudencia: 'decides antes de deliberar y sin escuchar del todo',
    fortaleza_audacia: 'la audacia te sale sola; el riesgo es confundirla con imponerte',
    fortaleza_resistencia: 'te cuesta sostener lo que no avanza a tu ritmo',
    dominio_de_si: 'tu primera reacción es la ira o la impaciencia',
    justicia: 'tu impulso de avanzar puede pasar por encima de los demás',
    magnanimidad: 'sueñas en grande, pero tiendes a hacerlo para ti',
    humildad_fundamental: 'tiendes a decidir solo y a no pedir consejo',
    humildad_fraternal: 'tiendes a mandar más que a servir y a hacerlo todo tú',
  },
  melancolico: {
    prudencia: 'deliberas mucho y te cuesta llegar a decidir',
    fortaleza_audacia: 'temes la acción y el riesgo, y esperas a tenerlo todo claro',
    fortaleza_resistencia: 'aguantas, pero el pesimismo te desgasta por dentro',
    dominio_de_si: 'las nimiedades te inquietan más de la cuenta',
    justicia: 'la crítica y la susceptibilidad te alejan de los demás',
    magnanimidad: 'tu ideal se frena por miedo a no estar a la altura',
    humildad_fundamental: 'te miras con dureza y confundes exigencia con perfeccionismo',
    humildad_fraternal: 'te cuesta trabajar en equipo y ceder tu forma de hacer',
  },
  sanguineo: {
    prudencia: 'decides por la impresión del momento sin detenerte a pensar',
    fortaleza_audacia: 'te lanzas con facilidad, pero buscas más agradar que acertar',
    fortaleza_resistencia: 'empiezas con entusiasmo y te cuesta terminar',
    dominio_de_si: 'los sentidos y las novedades te arrastran con facilidad',
    justicia: 'quieres caer bien y eso te hace callar lo que debes',
    magnanimidad: 'te dispersas en muchas cosas y pierdes de vista lo grande',
    humildad_fundamental: 'vives hacia fuera y te cuesta mirarte por dentro',
    humildad_fraternal: 'te gusta ser visto, y servir sin que se note te cuesta',
  },
  flematico: {
    prudencia: 'aplazas las decisiones por miedo a equivocarte',
    fortaleza_audacia: 'prefieres que nada cambie y evitas el riesgo',
    fortaleza_resistencia: 'eres constante, pero sin una meta propia la constancia se apaga',
    dominio_de_si: 'la comodidad y la apatía te frenan más que las pasiones',
    justicia: 'evitas el conflicto aunque haya algo justo que defender',
    magnanimidad: 'te cuesta soñar en grande y te conformas con lo que hay',
    humildad_fundamental: 'tu calma puede esconder poca exigencia contigo mismo',
    humildad_fraternal: 'sirves bien cuando te lo piden, pero te cuesta tomar la iniciativa',
  },
};

export function razonTemperamento(t: Temperamento, v: VirtudClave): string {
  return RAZON_TEMPERAMENTO[t][v];
}
