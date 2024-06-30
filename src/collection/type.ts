import { MasterGroup } from "../common";

export enum ItemFlag {
  COLLECTED,
  HIDDEN,
}

// deprecated:
export type ArtifactMeta = {
  id: number;
  collected: boolean;
  hidden: boolean;
  group: MasterGroup;
  // deprecated:
  flags?: ItemFlag[];
};

// deprecated
export type CollectionLog = {
  collected: number[];
  hidden: number[];
  // deprecated:
  entries?: ArtifactMeta[];
};
