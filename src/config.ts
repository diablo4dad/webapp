import {DadBase, DadCollectionItem, DEFAULT_ITEM} from "./db";
import {MasterGroup} from "./common";

const SERVER_ADDR = process.env.NODE_ENV === 'production' ? 'https://db.diablo4.dad' : 'http://localhost:1337';
const D4_BUILD = '1.2.3.47954'
const SITE_VERSION = '1.2.1'
const VERSION = {major: 1, minor: 2, revision: 0}
const LAST_UPDATED = 'February 9th, 2024'
const DISCORD_INVITE_LINK = 'https://discord.gg/mPRBrU2kYT'

function isScreenSmall(window: Window): boolean {
    return window.innerWidth <= 1200;
}

function getCollectionUri(masterGroup: MasterGroup): string {
    if (process.env.NODE_ENV === 'production') {
        return '/collection.json';
    } else {
        const url = new URL('/api/collections', SERVER_ADDR);
        url.searchParams.append('populate[collectionItems][populate][items][populate][0]', 'icon');
        url.searchParams.append('sort[0]', 'order');
        url.searchParams.append('pagination[pageSize]', '50');
        url.searchParams.append('filters[category][$eq]', encodeURIComponent(masterGroup));
        return url.href;
    }
}

function getImageUri(item: DadBase): string {
    if (process.env.NODE_ENV === 'production') {
        return item.icon?.url ?? 'missing.webp';
    } else {
        return '/icons/' + item.iconId + '.webp';
    }
}

function getDefaultItemFromCollectionItems(collectionItems: DadCollectionItem): DadBase {
    return collectionItems.items[0] ?? DEFAULT_ITEM;
}

export {
    D4_BUILD,
    VERSION,
    SITE_VERSION,
    SERVER_ADDR,
    LAST_UPDATED,
    DISCORD_INVITE_LINK,
    getCollectionUri,
    getImageUri,
    isScreenSmall,
    getDefaultItemFromCollectionItems,
}

export enum ContentType {
    MOBILE_MENU = 'menu',
    LEDGER = 'ledger',
    CONFIG = 'config'
}
