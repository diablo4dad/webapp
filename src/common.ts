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