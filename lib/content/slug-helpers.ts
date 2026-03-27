type Slugged<TSlug extends string> = {
  slug: TSlug;
};

export function createSlugLookup<
  TSlug extends string,
  TItem extends Slugged<TSlug>,
>(items: readonly TItem[]) {
  const bySlug = new Map<TSlug, TItem>(
    items.map((item) => [item.slug, item] as const),
  );
  const slugs = items.map((item) => item.slug) as TSlug[];

  return {
    items,
    slugs,
    hasSlug(slug: string): slug is TSlug {
      return bySlug.has(slug as TSlug);
    },
    getBySlug(slug: string) {
      return bySlug.get(slug as TSlug);
    },
    getOtherItems(slug: TSlug) {
      return items.filter((item) => item.slug !== slug);
    },
  };
}
