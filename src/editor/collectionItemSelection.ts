import { ItemGroup, itemGroups } from "../common";
import { enumKeys } from "../common/enums";
import { CharacterClass, Item } from "../data";

const armorItemTypeNames = new Set(itemGroups.get(ItemGroup.ARMOR) ?? []);

export function isPlayerTitle(item: Item): boolean {
  return (
    item.itemType.name === "Player Title" ||
    item.itemType.name.startsWith("Player Title ")
  );
}

function getSingleUsableClass(item: Item): CharacterClass | undefined {
  const usableClasses = enumKeys(CharacterClass)
    .map((characterClassKey) => CharacterClass[characterClassKey])
    .filter((characterClass) => item.usableByClass?.[characterClass] === 1);

  return usableClasses.length === 1 ? usableClasses[0] : undefined;
}

function getClassSpecificArmorClass(item: Item): CharacterClass | undefined {
  if (!armorItemTypeNames.has(item.itemType.name)) {
    return undefined;
  }

  return getSingleUsableClass(item);
}

function isClassSpecificArmorSelection(items: Item[]): boolean {
  if (items.length === 0) {
    return false;
  }

  const itemType = items[0].itemType.name;
  const selectedClasses = new Set<CharacterClass>();

  return items.every((item) => {
    const characterClass = getClassSpecificArmorClass(item);

    if (
      characterClass === undefined ||
      item.itemType.name !== itemType ||
      selectedClasses.has(characterClass)
    ) {
      return false;
    }

    selectedClasses.add(characterClass);
    return true;
  });
}

function isActiveClassSpecificArmorSet(items: Item[]): boolean {
  return items.length >= 2 && isClassSpecificArmorSelection(items);
}

function canAppendClassSpecificArmor(
  currentItems: Item[],
  candidateItem: Item,
): boolean {
  if (!isClassSpecificArmorSelection(currentItems)) {
    return false;
  }

  const candidateClass = getClassSpecificArmorClass(candidateItem);

  return (
    candidateClass !== undefined &&
    candidateItem.itemType.name === currentItems[0].itemType.name &&
    !currentItems.some(
      (selectedItem) =>
        getClassSpecificArmorClass(selectedItem) === candidateClass,
    )
  );
}

export function canSelectCollectionItem(
  currentItems: Item[],
  candidateItem: Item,
): boolean {
  if (
    currentItems.some((selectedItem) => selectedItem.id === candidateItem.id)
  ) {
    return false;
  }

  if (currentItems.length > 0 && currentItems.every(isPlayerTitle)) {
    return isPlayerTitle(candidateItem);
  }

  if (isActiveClassSpecificArmorSet(currentItems)) {
    return canAppendClassSpecificArmor(currentItems, candidateItem);
  }

  return true;
}

export function selectCollectionItem(
  currentItems: Item[],
  candidateItem: Item,
): Item[] {
  if (
    currentItems.some((selectedItem) => selectedItem.id === candidateItem.id)
  ) {
    return currentItems;
  }

  if (isActiveClassSpecificArmorSet(currentItems)) {
    return canAppendClassSpecificArmor(currentItems, candidateItem)
      ? [...currentItems, candidateItem]
      : currentItems;
  }

  if (
    currentItems.length > 0 &&
    currentItems.every(isPlayerTitle) &&
    !isPlayerTitle(candidateItem)
  ) {
    return currentItems;
  }

  if (isPlayerTitle(candidateItem)) {
    if (currentItems.length === 0 || currentItems.every(isPlayerTitle)) {
      return [...currentItems, candidateItem].slice(-2);
    }

    return [candidateItem];
  }

  if (canAppendClassSpecificArmor(currentItems, candidateItem)) {
    return [...currentItems, candidateItem];
  }

  return [candidateItem];
}
