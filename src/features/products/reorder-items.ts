type ItemWithId = {
  id: string;
};

export function reorderItemsById<TItem extends ItemWithId>(
  items: TItem[],
  activeItemId: string,
  overItemId: string,
) {
  const activeIndex = items.findIndex((item) => item.id === activeItemId);
  const overIndex = items.findIndex((item) => item.id === overItemId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(activeIndex, 1);

  nextItems.splice(overIndex, 0, movedItem);

  return nextItems;
}
