enum ItemType {
  Mount = "Mount",
  MountArmor = "Horse Armor",
  MountTrophy = "Trophy",
  BackTrophy = "Back Trophy"
}

type Item = {
  claim?: string,
  claimDescription?: string,
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
  collection: StrapiResult<Collection>,
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
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
  items: StrapiHit<Item[]>,
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

async function fetchDb(): Promise<StrapiResultSet<Item>> {
  const resp = await fetch('http://localhost:1337/api/items?populate=*');
  const data: StrapiResultSet<Item> = await resp.json();
  console.log("Fetched Items", data);
  return data;
}

export default fetchDb;
export { ItemType, fetchDb };
export type { Item, Collection, StrapiHit, StrapiResultSet, StrapiMedia, StrapiMediaFormat, StrapiMediaFormats };
