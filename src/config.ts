import {Item, StrapiHit} from "./db";

const SERVER_ADDR = 'http://localhost:1337'
const D4_BUILD = '1.2.3.47954'
const SITE_VERSION = '1.0.0'

function getCollectionUri(): string {
    if (process.env.NODE_ENV === 'production') {
        return '/collection.json';
    } else {
        return SERVER_ADDR + '/api/collections?populate[items][populate][0]=icon&sort[0]=order';
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
    SITE_VERSION,
    SERVER_ADDR,
    getCollectionUri,
    getImageUri,
}