// Texto de una nota del bloc con su formato. El editor guarda HTML sencillo (<b>, <i>, <u>, <br>,
// <div>); algunas notas, escritas fuera del editor, usan **negrita**, *cursiva* y __subrayado__.
// Se admiten los dos y solo se dejan pasar esas etiquetas (sin atributos).

const PERMITIDAS = new Set(['b', 'strong', 'i', 'em', 'u', 'br', 'div', 'p']);

function escapar(t) {
  // Las entidades que ya trae el HTML del editor (&nbsp;, &amp;…) se respetan.
  return t.replace(/&(?!(?:[a-zA-Z]+|#\d+);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function marcadoAHtml(t) {
  return t
    .replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>')
    .replace(/__([^_]+?)__/g, '<u>$1</u>')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<i>$2</i>');
}

/** HTML seguro para pintar una nota. Exportado para reutilizarlo y para pruebas. */
export function notaAHtml(texto) {
  if (!texto) return '';
  // Se escapa todo y luego se reactivan solo las etiquetas permitidas, sin atributos.
  const seguro = escapar(String(texto)).replace(/&lt;(\/?)([a-zA-Z]+)[^&]*?&gt;/g, (m, cierre, tag) => {
    const t = tag.toLowerCase();
    return PERMITIDAS.has(t) ? `<${cierre}${t}>` : '';
  });
  return marcadoAHtml(seguro).replace(/\n/g, '<br>');
}

/** Texto plano (sin etiquetas ni marcas), para el PDF del cuaderno. */
export function notaATexto(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/<br\s*\/?>|<\/?(div|p)[^>]*>/gi, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\*\*([^*]+?)\*\*/g, '$1').replace(/__([^_]+?)__/g, '$1').replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1$2')
    .trim();
}

export default function NotaTexto({ texto, style, as: Tag = 'div' }) {
  return <Tag style={style} dangerouslySetInnerHTML={{ __html: notaAHtml(texto) }} />;
}
