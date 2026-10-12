import { getContent } from '@virtus/content';

import { useVirtus } from '@/store/virtus';

/** Contenido del idioma activo. En el piloto se incluyen los borradores. */
export const INCLUDE_DRAFTS = true;

export function useContent() {
  const locale = useVirtus((s) => s.locale);
  return getContent(locale);
}
