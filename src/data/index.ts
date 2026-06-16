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
  SPIRITBORN,
  PALADIN,
  WARLOCK,
}

export enum MagicType {
  COMMON,
  LEGENDARY,
  UNIQUE,
  MAGIC,
  MYTHIC,
}

export enum Zone {
  FRACTURED_PEAKS,
  SCOSGLEN,
  KEHJISTAN,
  DRY_STEPPES,
  HAWEZAR,
  NAHANTU,
  SKOVOS,
}

export enum Chest {
  SILENT,
  HELLTIDE,
  LEGION,
  WORLD_EVENT,
}

export type Entity = {
  id: number;
  filename?: string;
};

export type GenderImagesRef = [number, number];
export type ItemRef = Entity & {
  icon: number;
  itemType: number;
  name: string;
  description?: string;
  series?: string;
  transmogName?: string;
  magicType?: number;
  preferredZone?: number;
  vohItem?: boolean;
  lohItem?: boolean;
  salvageable?: boolean;
  isTransmog?: boolean;
  usableByClass?: number[];
  invImages?: GenderImagesRef[];
  similarItems?: number[];
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
  similarItemsRefs: Item[];
};

export type ItemType = Entity & {
  name: string;
};

type CollectionItemRef = {
  claim: string;
  claimDescription?: string;
  claimZone?: Zone;
  claimChest?: Chest;
  claimMonster?: string;

  outOfRotation?: boolean;
  premium?: boolean;
  promotional?: boolean;
  season?: number;
  unobtainable?: boolean;
  useBaseItemName?: boolean;

  items: number[];
};

export type CollectionItem = Omit<CollectionItemRef, "items"> & {
  id: number;
  items: Item[];
};

type CollectionRef = {
  id: string;
  name: string;
  season?: number;
  outOfRotation?: boolean;
  description?: string;
  category?: string;
  rootCategory?: string;
  premium?: boolean;
  promotional?: boolean;
  claim?: string;
  claimDescription?: string;
  claimZone?: Zone;
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
  usableByClass: [1, 1, 1, 1, 1, 1, 1],
  similarItems: [],
  similarItemsRefs: [],
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
  claim: "missing",
  items: [],
};

const DEFAULT_COLLECTION: Collection = {
  id: "-1",
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
