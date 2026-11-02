/**
 * Antes «Círculo»: ahora las fichas de personas del Camino (las mismas que en la web). Lo que hubiera
 * en el Círculo del dispositivo se pasa a fichas al entrar con la cuenta (features/personas.ts).
 */
import { PantallaPersonas } from '@/components/personas/PantallaPersonas';

export default function Circulo() {
  return <PantallaPersonas conVolver={false} />;
}
