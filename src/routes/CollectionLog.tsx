import { DadDb } from "../data";
import { fetchDb } from "../server";
import { MasterGroup } from "../common";
import { strapiToDad } from "../data/transforms";
import React from "react";
import Application from "../Application";
import { capitialize } from "../common/strings";

export type Params = {
  params: {
    collectionId?: string;
  };
};

export type LoaderPayload = {
  db: DadDb;
  masterGroup: MasterGroup;
};

export async function loader({ params }: Params): Promise<LoaderPayload> {
  const masterGroup = params.collectionId
    ? (capitialize(params.collectionId) as MasterGroup)
    : MasterGroup.GENERAL;

  const db = strapiToDad(await fetchDb(masterGroup));

  return {
    db,
    masterGroup,
  };
}

export function CollectionView() {
  return <Application />;
}
