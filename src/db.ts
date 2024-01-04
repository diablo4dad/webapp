enum ItemType {
  Mount = "Mount",
  MountArmor = "Horse Armor",
  MountTrophy = "Trophy",
  BackTrophy = "Back Trophy"
}

type Item = {
  claim?: string,
  claimDescription?: string,
  claimMonster?: string,
  claimZone?: string,
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
  itemId: string,
  itemType: ItemType,
  magicType: string,
  icon?: StrapiResult<StrapiMedia>,
  name: string,
  description: string,
  outOfRotation: boolean,
  season?: number,
  transMog: boolean,
  usableByClass: string[],
  collection?: StrapiResult<Collection>,
}

type StrapiMediaFormats = {
  thumbnail?: StrapiMediaFormat,
}

type StrapiMediaFormat = {
  ext: string,
  hash: string,
  height: number,
  mime: string,
  name: string,
  path?: string,
  size: number,
  url: string,
  width: number,
}

type StrapiMedia = {
  alternativeText?: string
  caption?: string,
  createdAt: string,
  ext: string,
  formats: StrapiMediaFormats,
  hash: string,
  height: number,
  mime: string,
  name: string,
  previewUrl?: string,
  provider: string,
  provider_metadata?: string,
  size: number,
  updatedAt: string,
  url: string,
  width: number,
}

type Collection = {
  id: number,
  name: string,
  order: number,
  description: string,
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
  items?: StrapiResultSet<Item>,
}

type StrapiResult<T> = {
  data: StrapiHit<T>,
}

type StrapiResultSet<T> = {
  data: StrapiHit<T>[],
  meta?: {},
}

type StrapiHit<T> = {
  id: number,
  attributes: T,
}

function createEmptyResultSet<T>(): StrapiResultSet<T> {
  return {
    data: []
  }
}

function getDefaultItemIdFromCollection(result: StrapiResultSet<Collection>): number {
  return (result.data[0]?.attributes.items?.data ?? [])[0]?.id ?? -1;
}

async function fetchDb(): Promise<StrapiResultSet<Collection>> {
  const resp = await fetch('http://localhost:1337/api/collections?populate[items][populate][0]=icon&sort[0]=order');
  const data: StrapiResultSet<Collection> = await resp.json();
  console.log("Fetched Items", data);
  return data;
}

export default fetchDb;
export { ItemType, fetchDb, createEmptyResultSet, getDefaultItemIdFromCollection };
export type { Item, Collection, StrapiHit, StrapiResultSet, StrapiMedia, StrapiMediaFormat, StrapiMediaFormats };
