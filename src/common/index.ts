enum MasterGroup {
    GENERAL = "General",
    SHOP_ITEMS = "Shop",
    PROMOTIONAL = "Promotional",
    SEASONS = "Season",
}

export const locale = {
    [MasterGroup.SHOP_ITEMS]: "Cash Shop",
    [MasterGroup.GENERAL]: "General",
    [MasterGroup.PROMOTIONAL]: "Promotion",
    [MasterGroup.SEASONS]: "Seasons",
}

export { MasterGroup }

export enum ItemGroup {
    MOUNTS = "mounts",
    HORSE_ARMOR = "horse_armor",
    TROPHIES = "trophies",
    ARMOR = "armor",
    WEAPONS = "weapons",
    BODY = "body",
    EMOTES = "emotes",
    TOWN_PORTALS = "town_portals",
    HEADSTONES = "headstones",
    EMBLEMS = "emblems",
    PLAYER_TITLES = "player_titles",
}

export const itemGroups = new Map([
    [ItemGroup.MOUNTS, ["Mount"]],
    [ItemGroup.HORSE_ARMOR, ["Horse Armor"]],
    [ItemGroup.TROPHIES, ["Trophy", "Back Trophy"]],
    [ItemGroup.WEAPONS, ["Axe", "Dagger", "Focus", "Mace", "Scythe", "Shield", "Sword", "Totem", "Wand", "Two-Handed Axe", "Bow", "Crossbow", "Two-Handed Mace", "Polearm", "Two-Handed Scythe", "Staff", "Two-Handed Sword"]],
    [ItemGroup.ARMOR, ["Chest Armor", "Boots", "Gloves", "Helm", "Pants"]],
    [ItemGroup.BODY, ["Body Marking"]],
    [ItemGroup.EMOTES, ["Emote"]],
    [ItemGroup.TOWN_PORTALS, ["Town Portal"]],
    [ItemGroup.HEADSTONES, ["Headstone"]],
    [ItemGroup.EMBLEMS, ["Emblem"]],
    [ItemGroup.PLAYER_TITLES, ["Player Title (Prefix)", "Player Title (Suffix)"]],
]);

export enum SideBarType {
    ITEM = 'item',
    CONFIG = 'config'
}

type Configuration = {
    showMounts: boolean,
    showHorseArmor: boolean,
    showTrophies: boolean,
    showArmor: boolean,
    showWeapons: boolean,
    showBody: boolean,
    showEmotes: boolean,
    showTownPortals: boolean,
    showHeadstones: boolean,
    showEmblems: boolean,
    showPlayerTitles: boolean,
    showPremium: boolean,
    showPromotional: boolean,
    showOutOfRotation: boolean,
    showHiddenItems: boolean,
    showUnobtainable: boolean,
    hideCollectedItems: boolean,
    hideCompleteCollections: boolean,
    view: 'card' | 'list',
    inverseCardLayout: boolean,
    enableProgressBar: boolean,
}

const DEFAULT_CONFIG: Configuration = {
    showMounts: true,
    showHorseArmor: true,
    showTrophies: true,
    showArmor: true,
    showWeapons: true,
    showBody: true,
    showEmotes: true,
    showTownPortals: true,
    showHeadstones: true,
    showEmblems: true,
    showPlayerTitles: true,
    showPremium: false,
    showPromotional: false,
    showOutOfRotation: false,
    showHiddenItems: false,
    showUnobtainable: false,
    hideCollectedItems: false,
    hideCompleteCollections: false,
    view: 'card',
    enableProgressBar: true,
    inverseCardLayout: false,
}

export {DEFAULT_CONFIG};
export type {Configuration};
