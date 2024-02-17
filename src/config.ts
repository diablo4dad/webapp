import {DadCollectionItem, DadItem, DEFAULT_ITEM} from "./db";

const SERVER_ADDR = 'http://localhost:1337'
const D4_BUILD = '1.2.3.47954'
const SITE_VERSION = '1.2.1'
const VERSION = {major: 1, minor: 2, revision: 0}
const LAST_UPDATED = 'February 9th, 2024'
const DISCORD_INVITE_LINK = 'https://discord.gg/mPRBrU2kYT'

function isScreenSmall(window: Window): boolean {
    return window.innerWidth <= 1200;
}

function getCollectionUri(): string {
    if (process.env.NODE_ENV === 'production') {
        return '/collection.json';
    } else {
        return SERVER_ADDR + '/api/collections?populate[collectionItems][populate][items][populate][0]=icon&sort[0]=order&pagination[pageSize]=50';
    }
}

function getImageUri(item: DadItem): string {
    if (process.env.NODE_ENV === 'production') {
        return '/icons/' + item.iconId + '.webp';
    } else {
        return SERVER_ADDR + item.icon?.url ?? 'missing.webp';
    }
}

function getDefaultItemFromCollectionItems(collectionItems: DadCollectionItem): DadItem {
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
