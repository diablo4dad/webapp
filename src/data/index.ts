export enum CharacterGender {
  MALE,
  FEMALE,
}
export enum CharacterClass {
  SORCERER = 0,
  DRUID,
  BARBARIAN,
  ROGUE,
  NECROMANCER,
}

export enum MagicType {
  COMMON,
  LEGENDARY,
  UNIQUE,
  MAGIC,
  MYTHIC,
}

export type Entity = {
  id: number;
  filename?: string;
};

export type GenderImagesRef = [number, number];
export type ItemRef = Entity & {
  icon: number;
  itemType: number;
  magicType?: number;
  isTransmog?: boolean;
  usableByClass?: number[];
  invImages?: GenderImagesRef[];
  name: string;
  description?: string;
  transmogName?: string;
  series?: string;
};

export type GenderImages = [string | null, string | null];
export type Item = Omit<
  ItemRef,
  "itemType" | "icon" | "invImages" | "usableByClass"
> & {
  itemType: ItemType;
  icon: string;
  invImages: GenderImages[];
  usableByClass: number[];
};

export type ItemType = Entity & {
  name: string;
};

type CollectionItemRef = {
  id: number;
  name: string; // debug only

  claim: string;
  claimDescription?: string;
  claimZone?: string;
  claimMonster?: string;

  outOfRotation?: boolean;
  premium?: boolean;
  promotional?: boolean;
  season?: number;
  unobtainable?: boolean;

  items: number[];
};

export type CollectionItem = Omit<CollectionItemRef, "items"> & {
  items: Item[];
};

type CollectionRef = {
  id: number;
  name: string;
  season?: number;
  outOfRotation?: boolean;
  description?: string;
  category?: string;
  premium?: boolean;
  claim?: string;
  claimDescription?: string;
  bundleId?: number;
  subcollections?: CollectionRef[];
  collectionItems: CollectionItemRef[];
};

export type Collection = Omit<
  CollectionRef,
  "subcollections" | "collectionItems"
> & {
  subcollections: Collection[];
  collectionItems: CollectionItem[];
};

export type CollectionGroup = Collection[];

export type DadDbRef = {
  collections: CollectionRef[];
  itemTypes: ItemType[];
  items: ItemRef[];
};

type DadDb = Omit<DadDbRef, "collections" | "items"> & {
  collections: Collection[];
  items: Item[];
};

const DEFAULT_ITEM_TYPE: ItemType = {
  id: -1,
  name: "missing",
};

const DEFAULT_ITEM: Item = {
  id: -1,
  itemType: DEFAULT_ITEM_TYPE,
  icon: "/icons/0.webp",
  name: "missing",
  usableByClass: [1, 1, 1, 1, 1],
  invImages: [
    [null, null],
    [null, null],
    [null, null],
    [null, null],
    [null, null],
  ],
};

const DEFAULT_COLLECTION_ITEM: CollectionItem = {
  id: -1,
  name: "missing",
  claim: "missing",
  items: [],
};

const DEFAULT_COLLECTION: Collection = {
  id: -1,
  name: "missing",
  collectionItems: [],
  subcollections: [],
};

export {
  DEFAULT_ITEM_TYPE,
  DEFAULT_ITEM,
  DEFAULT_COLLECTION_ITEM,
  DEFAULT_COLLECTION,
};
export type { CollectionItemRef, CollectionRef, DadDb };
export { getDefaultItem } from "./getters";
