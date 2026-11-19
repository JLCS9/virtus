-- Copia de virtuous-leadership-web/supabase-migraciones/20261117_contenido_m5-05b.sql (la web manda en el esquema).
-- Ya aplicada en el Supabase de producción (qyuxmqvqmgqcsduzljkd); comprobado el 2026-11-19.

-- Curso 5 · Módulo 3: el texto del triángulo blanco pasa de ir antes del vídeo (intro de m5-05)
-- a una lectura propia después del vídeo (m5-05b). Sin esta fila, respuestas.contenido_id
-- (FK → contenidos.id) rechaza el progreso de la lectura.
-- Pendiente de revisión y aplicación por Infra/BD.

insert into contenidos (id, tipo, titulo, locale, estado, orden, visible, curso, modulo, datos)
values (
  'm5-05b', 'lectura', 'El triángulo blanco', 'es', 'activo', 7, false, 5, 1,
  '{"lecturas":[[{"columnas":{"imagen":"c5-triangulo-blanco","textos":[{"enfasis":"Contempla este diagrama"},"El triángulo blanco es el lugar de encuentro de mis facultades espirituales. Mientras permanezco en el triángulo blanco, mis facultades espirituales interactúan entre ellas."]}}],["No tengo que estar necesariamente en el centro mismo del triángulo blanco.","Puede ser que mi razón (si estoy cerca del ángulo superior izquierdo), mi voluntad (si estoy cerca del ángulo superior derecho) o mi corazón (si estoy cerca del ángulo inferior) desempeñe el papel más importante, pero esta prioridad no afecta a la armonía de mi ser."],[{"enfasis":"La diversidad espiritual, como la biológica (los temperamentos),\nes algo excelente y necesario.","grande":true},"Si salgo del triángulo blanco, **mi facultad dominante queda aislada y corrompida**: deja de interactuar con las otras dos facultades o, al menos, con una de ellas."]]}'::jsonb
)
on conflict (id) do nothing;
