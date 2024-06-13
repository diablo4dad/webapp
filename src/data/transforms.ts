import {
  Base,
  DadCollection,
  DadCollectionItem,
  DadDb,
  DadItem,
  StrapiCollection,
  StrapiCollectionItem,
  StrapiHit,
  StrapiItem,
  StrapiMedia,
  StrapiResult,
  StrapiResultSet,
  WithStrapiId,
} from "./index";

export function flattenDadDb(db: DadDb): DadCollectionItem[] {
  return db.collections.flatMap((c) => [
    ...c.collectionItems,
    ...c.subcollections.flatMap((sc) => sc.collectionItems),
  ]);
}

function strapiBaseToDadBase(
  hit: StrapiHit<Base<StrapiResult<StrapiMedia>>>,
): Base<StrapiMedia> & WithStrapiId {
  return {
    ...hit.attributes,
    strapiId: hit.id,
    icon: hit.attributes.icon?.data?.attributes,
  };
}

function strapiItemToDadItem(hit: StrapiHit<StrapiItem>): DadItem {
  return {
    ...hit.attributes,
    strapiId: hit.id,
    icon: hit.attributes.icon?.data?.attributes.url,
  };
}

function strapiCollectionItemToDadCollectionItem(
  hit: StrapiHit<StrapiCollectionItem>,
): DadCollectionItem {
  const attributes = hit.attributes;
  const items = [];

  if (attributes.items) {
    items.push(...attributes.items.data.map(strapiItemToDadItem));
  }

  return {
    ...hit.attributes,
    strapiId: hit.id,
    items: items,
  };
}

function strapiCollectionToDadCollection(
  hit: StrapiHit<StrapiCollection>,
): DadCollection {
  return {
    ...hit.attributes,
    strapiId: hit.id,
    collectionItems:
      hit.attributes.collectionItems?.data.map(
        strapiCollectionItemToDadCollectionItem,
      ) ?? [],
    subcollections:
      hit.attributes.subcollections?.data.map(
        strapiCollectionToDadCollection,
      ) ?? [],
  };
}

function strapiToDad(
  strapiCollection: StrapiResultSet<StrapiCollection>,
): DadDb {
  return {
    collections: strapiCollection.data.map(strapiCollectionToDadCollection),
  };
}

export { strapiToDad };
