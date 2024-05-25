import {DadBase, DadCollectionItem, DEFAULT_ITEM} from "../data";
import {Configuration, ItemGroup, itemGroups} from "../common";

// const SERVER_ADDR = process.env.NODE_ENV === 'production' ? 'https://db.diablo4.dad' : 'http://localhost:1337';
const SERVER_ADDR = 'https://db.diablo4.dad';
const SITE_VERSION = '1.6.6'
const VERSION = {major: 1, minor: 6, revision: 6}
const LAST_UPDATED = 'May 25th, 2024'
const DISCORD_INVITE_LINK = 'https://discord.gg/mPRBrU2kYT'
const MODE = process.env.NODE_ENV === 'production' ? 'static' : 'live';

function getDefaultItemFromCollectionItems(collectionItems: DadCollectionItem): DadBase {
    return collectionItems.items[0] ?? DEFAULT_ITEM;
}

export {
    VERSION,
    SITE_VERSION,
    SERVER_ADDR,
    LAST_UPDATED,
    DISCORD_INVITE_LINK,
    MODE,
    getDefaultItemFromCollectionItems,
}

export enum ContentType {
    MOBILE_MENU = 'menu',
    LEDGER = 'ledger',
    CONFIG = 'config'
}

export function aggregateItemTypes(config: Configuration): string[] {
    return Array<string>()
        .concat(config.showMounts ? itemGroups.get(ItemGroup.MOUNTS) ?? [] : [])
        .concat(config.showHorseArmor ? itemGroups.get(ItemGroup.HORSE_ARMOR) ?? [] : [])
        .concat(config.showTrophies ? itemGroups.get(ItemGroup.TROPHIES) ?? [] : [])
        .concat(config.showArmor ? itemGroups.get(ItemGroup.ARMOR) ?? [] : [])
        .concat(config.showWeapons ? itemGroups.get(ItemGroup.WEAPONS) ?? [] : [])
        .concat(config.showBody ? itemGroups.get(ItemGroup.BODY) ?? [] : [])
        .concat(config.showEmotes ? itemGroups.get(ItemGroup.EMOTES) ?? [] : [])
        .concat(config.showTownPortals ? itemGroups.get(ItemGroup.TOWN_PORTALS) ?? [] : [])
        .concat(config.showHeadstones ? itemGroups.get(ItemGroup.HEADSTONES) ?? [] : [])
        .concat(config.showEmblems ? itemGroups.get(ItemGroup.EMBLEMS) ?? [] : [])
        .concat(config.showPlayerTitles ? itemGroups.get(ItemGroup.PLAYER_TITLES) ?? [] : []);
}
