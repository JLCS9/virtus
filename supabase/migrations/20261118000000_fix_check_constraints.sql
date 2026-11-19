-- Copia de virtuous-leadership-web/supabase-migraciones/20261118_fix_check_constraints.sql (la web manda en el esquema).
-- Ya aplicada en el Supabase de producción (qyuxmqvqmgqcsduzljkd); comprobado el 2026-11-19.

-- Fix CHECK constraints reportados por D1 (2026-11-18)
-- Bug 1: personas.grupo no incluía 'pendiente' → SelectorCirculoOro (test magnanimidad, curso 2)
--         no podía crear personas nuevas
-- Bug 2: persona_observaciones.situacion no incluía 'nota_formacion' → CirculoPersonas
--         fallaba silenciosamente al guardar notas
-- Bug 3: persona_observaciones.palabra y temperamento eran NOT NULL → las observaciones
--         tipo 'otro' (descripción libre, sin palabra/temperamento) no se podían insertar

-- Ya aplicado en producción (Supabase qyuxmqvqmgqcsduzljkd) el 2026-11-18.

-- 1. personas.grupo: añadir 'pendiente'
ALTER TABLE personas DROP CONSTRAINT personas_grupo_check;
ALTER TABLE personas ADD CONSTRAINT personas_grupo_check
  CHECK (grupo = ANY (ARRAY['familia','amigos','trabajo','comunidad','pendiente']));

-- 2. persona_observaciones.situacion: añadir 'nota_formacion'
ALTER TABLE persona_observaciones DROP CONSTRAINT persona_observaciones_situacion_check;
ALTER TABLE persona_observaciones ADD CONSTRAINT persona_observaciones_situacion_check
  CHECK (situacion = ANY (ARRAY['critica','cambio_planes','problema','buena_noticia','desacuerdo','otro','nota_formacion']));

-- 3. persona_observaciones: palabra y temperamento nullable
ALTER TABLE persona_observaciones ALTER COLUMN palabra DROP NOT NULL;
ALTER TABLE persona_observaciones ALTER COLUMN temperamento DROP NOT NULL;

-- 4. temperamento CHECK: permitir NULL
ALTER TABLE persona_observaciones DROP CONSTRAINT persona_observaciones_temperamento_check;
ALTER TABLE persona_observaciones ADD CONSTRAINT persona_observaciones_temperamento_check
  CHECK (temperamento IS NULL OR temperamento = ANY (ARRAY['COL','MEL','SAN','FLE']));
