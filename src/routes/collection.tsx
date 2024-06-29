import { DadDb } from "../data";
import { fetchDb } from "../server";
import { MasterGroup } from "../common";
import { strapiToDad } from "../data/transforms";

export type Params = {
  collectionId: MasterGroup;
};

export type Payload = {
  collection: DadDb;
};

export async function loader({ collectionId }: Params): Promise<Payload> {
  const collection = strapiToDad(await fetchDb(collectionId));

  return {
    collection,
  };
}
