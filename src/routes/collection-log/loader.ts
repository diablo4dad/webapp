import type { MasterGroup } from "../../shared/domain";
import { DEFAULT_SLUG, slugToGroup } from "./links";

type Params = {
  params: {
    collectionId?: string;
  };
};

type LoaderPayload = {
  group: MasterGroup;
};

async function loader({ params }: Params): Promise<LoaderPayload> {
  return {
    group: slugToGroup(params.collectionId ?? DEFAULT_SLUG),
  };
}

export { loader, type LoaderPayload, type Params };
