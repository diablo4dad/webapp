import { BooleanOption, Option, Settings } from "../settings/type";
import { isEnabled } from "../settings/predicate";

enum MasterGroup {
  GENERAL = "General",
  SHOP_ITEMS = "Shop",
  PROMOTIONAL = "Promotional",
  SEASONS = "Season",
  CHALLENGE = "Challenge",
  UNIVERSAL = "Universal",
}

enum ItemGroup {
  MOUNTS = "mounts",
  HORSE_ARMOR = "horse_armor",
  TROPHIES = "trophies",
  BACK_TROPHIES = "back_trophies",
  ARMOR = "armor",
  WEAPONS = "weapons",
  BODY = "body",
  EMOTES = "emotes",
  TOWN_PORTALS = "town_portals",
  HEADSTONES = "headstones",
  EMBLEMS = "emblems",
  PLAYER_TITLES = "player_titles",
  PETS = "pets",
}

enum SideBarType {
  ITEM = "item",
  CONFIG = "config",
}

enum ContentType {
  MOBILE_MENU = "menu",
  LEDGER = "ledger",
  CONFIG = "config",
}

const locale = {
  [MasterGroup.SHOP_ITEMS]: "Cash Shop",
  [MasterGroup.GENERAL]: "General",
  [MasterGroup.PROMOTIONAL]: "Promotion",
  [MasterGroup.SEASONS]: "Seasons",
  [MasterGroup.CHALLENGE]: "Challenge",
};

const itemGroups = new Map([
  [ItemGroup.MOUNTS, ["Mount"]],
  [ItemGroup.HORSE_ARMOR, ["Horse Armor", "Cat Armor"]],
  [ItemGroup.TROPHIES, ["Trophy"]],
  [ItemGroup.BACK_TROPHIES, ["Back Trophy"]],
  [
    ItemGroup.WEAPONS,
    [
      "Axe",
      "Dagger",
      "Focus",
      "Mace",
      "Scythe",
      "Shield",
      "Sword",
      "Totem",
      "Wand",
      "Two-Handed Axe",
      "Bow",
      "Crossbow",
      "Two-Handed Mace",
      "Polearm",
      "Two-Handed Scythe",
      "Staff",
      "Two-Handed Sword",
      "Quarterstaff",
      "Glaive",
    ],
  ],
  [ItemGroup.ARMOR, ["Chest Armor", "Boots", "Gloves", "Helm", "Pants"]],
  [ItemGroup.BODY, ["Body Marking"]],
  [ItemGroup.EMOTES, ["Emote"]],
  [ItemGroup.TOWN_PORTALS, ["Town Portal"]],
  [ItemGroup.HEADSTONES, ["Headstone"]],
  [ItemGroup.EMBLEMS, ["Emblem"]],
  [ItemGroup.PETS, ["Pet"]],
  [ItemGroup.PLAYER_TITLES, ["Player Title (Prefix)", "Player Title (Suffix)"]],
]);

const wardrobeIcons = [
  ...(itemGroups.get(ItemGroup.ARMOR) ?? []),
  ...(itemGroups.get(ItemGroup.WEAPONS) ?? []),
  ...(itemGroups.get(ItemGroup.BACK_TROPHIES) ?? []),
  ...(itemGroups.get(ItemGroup.TOWN_PORTALS) ?? []),
  ...(itemGroups.get(ItemGroup.HEADSTONES) ?? []),
  ...(itemGroups.get(ItemGroup.PETS) ?? []),
];

function getEnabledItemTypes(settings: Settings): string[] {
  const safeGet = (option: BooleanOption, itemGroup: ItemGroup): string[] => {
    return isEnabled(settings, option) ? itemGroups.get(itemGroup) ?? [] : [];
  };

  return Array<string>()
    .concat(safeGet(Option.SHOW_MOUNTS, ItemGroup.MOUNTS))
    .concat(safeGet(Option.SHOW_HORSE_ARMOR, ItemGroup.HORSE_ARMOR))
    .concat(safeGet(Option.SHOW_TROPHIES, ItemGroup.TROPHIES))
    .concat(safeGet(Option.SHOW_BACK_TROPHIES, ItemGroup.BACK_TROPHIES))
    .concat(safeGet(Option.SHOW_ARMOR, ItemGroup.ARMOR))
    .concat(safeGet(Option.SHOW_WEAPONS, ItemGroup.WEAPONS))
    .concat(safeGet(Option.SHOW_MARKINGS, ItemGroup.BODY))
    .concat(safeGet(Option.SHOW_EMOTES, ItemGroup.EMOTES))
    .concat(safeGet(Option.SHOW_PORTALS, ItemGroup.TOWN_PORTALS))
    .concat(safeGet(Option.SHOW_HEADSTONES, ItemGroup.HEADSTONES))
    .concat(safeGet(Option.SHOW_EMBLEMS, ItemGroup.EMBLEMS))
    .concat(safeGet(Option.SHOW_TITLES, ItemGroup.PLAYER_TITLES))
    .concat(safeGet(Option.SHOW_PETS, ItemGroup.PETS));
}

export {
  SideBarType,
  ItemGroup,
  ContentType,
  itemGroups,
  wardrobeIcons,
  MasterGroup,
  locale,
  getEnabledItemTypes,
};
