import { MasterGroup } from "./common";
import { MODE, SERVER_ADDR } from "./config";
import { DadCollection, StrapiCollection, StrapiResultSet } from "./data";

function countTotalInCollectionUri(
  masterGroup: MasterGroup,
  mode: "live" | "static" = "static",
) {
  switch (mode) {
    case "live":
      const url = new URL("/api/collection-items", SERVER_ADDR);
      url.searchParams.append(
        "filters[collection][category][$eq]",
        masterGroup,
      );
      url.searchParams.append(
        "filters[collection][publishedAt][$notNull]",
        String(true),
      );
      url.searchParams.append("pagination[page]", String(1));
      return url.href;
    default:
      return masterGroup.toLowerCase() + ".json";
  }
}

function getCollectionUri(
  masterGroup: MasterGroup,
  page: number = 0,
  pageSize: number = 15,
  mode: "live" | "static" = "static",
): string {
  switch (mode) {
    case "live":
      const url = new URL("/api/collections", SERVER_ADDR);
      url.searchParams.append("populate[0]", "subcollection");
      url.searchParams.append(
        "populate[collectionItems][populate][items][populate][0]",
        "icon",
      );
      url.searchParams.append(
        "populate[subcollections][populate][collectionItems][populate][items][populate][0]",
        "icon",
      );
      url.searchParams.append("sort[0]", "order");
      url.searchParams.append("pagination[page]", String(page));
      url.searchParams.append("pagination[pageSize]", String(pageSize));
      url.searchParams.append(
        "filters[category][$eq]",
        encodeURIComponent(masterGroup),
      );
      url.searchParams.append("filters[subcollection][id][$null]", "true");
      return url.href;
    default:
      return masterGroup.toLowerCase() + ".json";
  }
}

export function generateEditCategoryUrl(collection: DadCollection): string {
  return (
    SERVER_ADDR +
    "/admin/content-manager/collectionType/api::collection.collection/" +
    collection.strapiId
  );
}

async function fetchDb(
  masterGroup: MasterGroup,
  page: number = 0,
): Promise<StrapiResultSet<StrapiCollection>> {
  return (await (
    await fetch(getCollectionUri(masterGroup, page, 50, MODE))
  ).json()) as Promise<StrapiResultSet<StrapiCollection>>;
}

export { getCollectionUri };
export { countTotalInCollectionUri };

export { fetchDb };
