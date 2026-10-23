import type { PublicProviderListItem } from '@smomo/shared';

import { CATEGORY_SLUG_LIST } from '@/lib/catalog';
import { getCategoryHub } from '@/lib/public-api';

export type TalentPreview = {
  items: PublicProviderListItem[];
  /** True when every request failed, so the UI can say so instead of claiming "no creators". */
  failed: boolean;
};

/**
 * A mixed-craft preview of real, listed providers from the public API (the same
 * source as the category pages; only providers the platform lists publicly).
 * Round-robins across crafts so one category doesn't dominate. Deliberately NOT sorted
 * by rating: ratings aren't shown here (see TalentSection).
 */
export async function getTalentPreview(limit = 6): Promise<TalentPreview> {
  const hubs = await Promise.all(CATEGORY_SLUG_LIST.map((c) => getCategoryHub(c, limit)));
  const failed = hubs.every((h) => h === null);

  const seen = new Set<string>();
  const items: PublicProviderListItem[] = [];
  for (let i = 0; items.length < limit; i++) {
    let any = false;
    for (const h of hubs) {
      const p = h?.items[i];
      if (!p) continue;
      any = true;
      if (!seen.has(p.id) && items.length < limit) {
        seen.add(p.id);
        items.push(p);
      }
    }
    if (!any) break;
  }
  return { items, failed };
}
