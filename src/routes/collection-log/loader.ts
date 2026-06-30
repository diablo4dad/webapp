import type { MasterGroup } from "../../common";
import { slugToGroup } from "./links";

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
    group: slugToGroup(params.collectionId ?? "general"),
  };
}
