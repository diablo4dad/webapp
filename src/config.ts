import {DadBase, DadCollectionItem, DEFAULT_ITEM} from "./db";

const SERVER_ADDR = process.env.NODE_ENV === 'production' ? 'https://db.diablo4.dad' : 'http://localhost:1337';
const SITE_VERSION = '1.4.2'
const VERSION = {major: 1, minor: 4, revision: 2}
const LAST_UPDATED = 'April 5th, 2024'
const DISCORD_INVITE_LINK = 'https://discord.gg/mPRBrU2kYT'
const MODE = 'static'

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
