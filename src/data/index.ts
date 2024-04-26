export type Base<IconType> = {
  itemId: string,
  icon?: IconType,
  iconId?: number,
  name: string,
  description: string,
  usableByClass: string[],
  itemType: string,
  series: string,
  transmogName: string,
  magicType: string,
  transMog: boolean,
  dropMinWorldTier: number,
  dropMinLevel: number,
  dropMaxLevel: number,
}

export type StrapiResp = {
  createdAt?: string,
  publishedAt?: string,
  updatedAt?: string,
}

type Item<IconType> = Base<IconType> & StrapiResp;
type Headstone<IconType> = Base<IconType> & StrapiResp;
type Emote<IconType> = Base<IconType> & StrapiResp;
type Portal<IconType> = Base<IconType> & StrapiResp;

type CollectionItem<ItemsType> = StrapiResp & {
  outOfRotation?: boolean,
  premium?: boolean,
  promotional?: boolean,
  season?: number,
  claim?: string,
  claimDescription?: string,
  claimMonster?: string,
  claimZone?: string,
  items: ItemsType,
}

export type StrapiCollectionItem = CollectionItem<StrapiResultSet<StrapiItem>>;

type Collection<CollectionType, CollectionItemsType> = StrapiResp & {
  name: string,
  order: number,
  description: string,
  createdAt: string,
  publishedAt: string,
  updatedAt: string,
  category: string,
  subcollections: CollectionType,
  collectionItems: CollectionItemsType,
}

export type WithStrapiId = {
  strapiId: number
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

export type StrapiResult<T> = {
  data: StrapiHit<T>,
}

type StrapiSearchMeta = {
  pagination: StrapiPagination,
}

type StrapiPagination = {
  page: number,
  pageSize: number,
  pageCount: number,
  total: number,
}

type StrapiResultSet<T> = {
  data: StrapiHit<T>[],
  meta: StrapiSearchMeta,
}

type StrapiHit<T> = {
  id: number,
  attributes: T,
}

export type StrapiItem = Item<StrapiResult<StrapiMedia>>;
type StrapiEmote = Emote<StrapiResult<StrapiMedia>>;
type StrapiHeadstone = Headstone<StrapiResult<StrapiMedia>>;
type StrapiPortal = Portal<StrapiResult<StrapiMedia>>;
// @ts-ignore
export type StrapiCollection = Collection<StrapiResultSet<StrapiCollection> | undefined, StrapiResultSet<StrapiCollectionItem> | undefined>;

type DadBase = Base<string> & WithStrapiId;
type DadItem = Item<string> & WithStrapiId;
type DadEmote = Emote<string> & WithStrapiId;
type DadHeadstone = Headstone<string> & WithStrapiId;
type DadPortal = Portal<string> & WithStrapiId;
type DadCollectionItem = CollectionItem<Array<DadItem | DadEmote | DadHeadstone | DadPortal>> & WithStrapiId;
type DadCollection = Collection<DadCollection[], DadCollectionItem[]> & WithStrapiId;
type DadDb = { collections: DadCollection[] }

const DEFAULT_ITEM: DadItem = {
  strapiId: -1,
  itemId: "missing",
  itemType: 'missing',
  magicType: "missing",
  icon: undefined,
  iconId: undefined,
  name: "missing",
  description: "missing",
  transMog: false,
  usableByClass: [],
  series: "missing",
  transmogName: "missing",
  dropMinWorldTier: 0,
  dropMinLevel: 1,
  dropMaxLevel: 100,
}

const DEFAULT_COLLECTION_ITEM: DadCollectionItem = {
  strapiId: -1,
  outOfRotation: false,
  premium: false,
  promotional: false,
  season: undefined,
  claim: "missing",
  claimDescription: "missing",
  claimMonster: "missing",
  claimZone: "missing",
  items: [],
}

const DEFAULT_COLLECTION: DadCollection = {
  strapiId: -1,
  name: "missing",
  order: 0,
  description: "missing",
  category: "missing",
  createdAt: '2023-12-01T10:00:00.000Z',
  publishedAt: '2023-12-01T10:00:00.000Z',
  updatedAt: '2023-12-01T10:00:00.000Z',
  collectionItems: [],
  subcollections: [],
}

export { DEFAULT_ITEM, DEFAULT_COLLECTION_ITEM, DEFAULT_COLLECTION };
export type {
  Item,
  Headstone,
  Portal,
  Emote,
  Collection,
  CollectionItem,
  StrapiHit,
  StrapiResultSet,
  StrapiMedia,
  StrapiMediaFormat,
  StrapiMediaFormats,
  DadItem,
  DadCollectionItem,
  DadCollection,
  DadDb,
  DadBase,
};

