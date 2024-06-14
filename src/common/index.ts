type Configuration = {
  showMounts: boolean;
  showHorseArmor: boolean;
  showTrophies: boolean;
  showBackTrophies: boolean;
  showArmor: boolean;
  showWeapons: boolean;
  showBody: boolean;
  showEmotes: boolean;
  showTownPortals: boolean;
  showHeadstones: boolean;
  showEmblems: boolean;
  showPlayerTitles: boolean;
  showPets: boolean;
  showPremium: boolean;
  showPromotional: boolean;
  showOutOfRotation: boolean;
  showHiddenItems: boolean;
  showUnobtainable: boolean;
  showWardrobePlaceholdersOnly: boolean;
  hideCollectedItems: boolean;
  hideCompleteCollections: boolean;
  view: "card" | "list";
  inverseCardLayout: boolean;
  enableProgressBar: boolean;
};

enum MasterGroup {
  GENERAL = "General",
  SHOP_ITEMS = "Shop",
  PROMOTIONAL = "Promotional",
  SEASONS = "Season",
  CHALLENGE = "Challenge",
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
    ],
  ],
  [ItemGroup.ARMOR, ["Chest Armor", "Boots", "Gloves", "Helm", "Pants"]],
  [ItemGroup.BODY, ["Body Marking"]],
  [ItemGroup.EMOTES, ["Emote"]],
  [ItemGroup.TOWN_PORTALS, ["Town Portal"]],
  [ItemGroup.HEADSTONES, ["Headstone"]],
  [ItemGroup.EMBLEMS, ["Emblem"]],
  [ItemGroup.PLAYER_TITLES, ["Player Title (Prefix)", "Player Title (Suffix)"]],
  [ItemGroup.PETS, ["Pet"]],
]);

const wardrobeIcons = [
  ...(itemGroups.get(ItemGroup.ARMOR) ?? []),
  ...(itemGroups.get(ItemGroup.WEAPONS) ?? []),
  ...(itemGroups.get(ItemGroup.BACK_TROPHIES) ?? []),
  ...(itemGroups.get(ItemGroup.TOWN_PORTALS) ?? []),
  ...(itemGroups.get(ItemGroup.HEADSTONES) ?? []),
  ...(itemGroups.get(ItemGroup.PETS) ?? []),
];

const DEFAULT_CONFIG: Configuration = {
  showMounts: true,
  showHorseArmor: true,
  showTrophies: true,
  showBackTrophies: true,
  showArmor: true,
  showWeapons: true,
  showBody: true,
  showEmotes: true,
  showTownPortals: true,
  showHeadstones: true,
  showEmblems: true,
  showPlayerTitles: true,
  showPets: true,
  showPremium: true,
  showPromotional: true,
  showOutOfRotation: true,
  showHiddenItems: false,
  showUnobtainable: false,
  showWardrobePlaceholdersOnly: false,
  hideCollectedItems: false,
  hideCompleteCollections: false,
  view: "card",
  enableProgressBar: true,
  inverseCardLayout: false,
};

function getEnabledItemTypes(config: Configuration): string[] {
  const safeGet = (flag: boolean, itemGroup: ItemGroup): string[] => {
    return flag ? itemGroups.get(itemGroup) ?? [] : [];
  };

  return Array<string>()
    .concat(safeGet(config.showMounts, ItemGroup.MOUNTS))
    .concat(safeGet(config.showHorseArmor, ItemGroup.HORSE_ARMOR))
    .concat(safeGet(config.showTrophies, ItemGroup.TROPHIES))
    .concat(safeGet(config.showBackTrophies, ItemGroup.BACK_TROPHIES))
    .concat(safeGet(config.showArmor, ItemGroup.ARMOR))
    .concat(safeGet(config.showWeapons, ItemGroup.WEAPONS))
    .concat(safeGet(config.showBody, ItemGroup.BODY))
    .concat(safeGet(config.showEmotes, ItemGroup.EMOTES))
    .concat(safeGet(config.showTownPortals, ItemGroup.TOWN_PORTALS))
    .concat(safeGet(config.showHeadstones, ItemGroup.HEADSTONES))
    .concat(safeGet(config.showEmblems, ItemGroup.EMBLEMS))
    .concat(safeGet(config.showPlayerTitles, ItemGroup.PLAYER_TITLES))
    .concat(safeGet(config.showPets, ItemGroup.PETS));
}

export {
  DEFAULT_CONFIG,
  SideBarType,
  ItemGroup,
  ContentType,
  itemGroups,
  wardrobeIcons,
  MasterGroup,
  locale,
  getEnabledItemTypes,
};
export type { Configuration };
