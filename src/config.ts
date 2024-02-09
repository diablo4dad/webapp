import {Item, StrapiHit} from "./db";

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
        return SERVER_ADDR + '/api/collections?populate[items][populate][0]=icon&sort[0]=order&pagination[pageSize]=50';
    }
}

function getImageUri(item: StrapiHit<Item>): string {
    if (process.env.NODE_ENV === 'production') {
        return '/icons/' + item.attributes.iconId + '.webp';
    } else {
        return SERVER_ADDR + item.attributes.icon?.data?.attributes.url ?? 'missing.webp';
    }
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
}

export enum ContentType {
    MOBILE_MENU = 'menu',
    LEDGER = 'ledger',
    CONFIG = 'config'
}
