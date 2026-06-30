import type { MasterGroup } from "../../common";
import { DEFAULT_SLUG, slugToGroup } from "./links";

export type Params = {
  params: {
    collectionId?: string;
  };
};

export type LoaderPayload = {
  group: MasterGroup;
};

export async function loader({ params }: Params): Promise<LoaderPayload> {
  return {
    group: slugToGroup(params.collectionId ?? DEFAULT_SLUG),
  };
}
