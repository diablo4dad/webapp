import type { CollectionLog } from "../ledger/type";
import { ItemGroup } from "../../shared/domain";
import type { CollectionGroup } from "../../services/data";
import backTrophyIcon from "../../assets/images/back-trophy@1x.png";
import emblemIcon from "../../assets/images/emblem@1x.png";
import mountIcon from "../../assets/images/mount@1x.png";
import petIcon from "../../assets/images/pet@1x.png";
import portalIcon from "../../assets/images/portal@1x.png";
import shakoIcon from "../../assets/images/shako@1x.png";
import {
  getAllProgressStats,
  getProgressStats,
  type ProgressStats,
} from "./state";

type ProgressCardConfig = {
  iconSrc: string;
  itemGroups: readonly ItemGroup[];
  title: string;
};

type ProgressScopeSource = {
  collections: CollectionGroup;
  iconSrc?: string;
  id: string;
  title: string;
};

type ProgressCardViewModel = ProgressStats & {
  iconSrc: string;
  title: string;
};

type ProgressSummaryViewModel = ProgressStats & {
  title: string;
};

type ProgressScopeViewModel = ProgressSummaryViewModel & {
  iconSrc?: string;
  id: string;
  positionLabel: string;
};

type ProgressViewModel = {
  cards: readonly ProgressCardViewModel[];
  grandTotal: ProgressSummaryViewModel;
  selectedScope: ProgressScopeViewModel;
};

type ProgressViewModelOptions = {
  scopeSources?: readonly ProgressScopeSource[];
  selectedScopeId?: string;
};

const progressCards: readonly ProgressCardConfig[] = [
  {
    title: "Armor & Weapons",
    itemGroups: [ItemGroup.ARMOR, ItemGroup.WEAPONS],
    iconSrc: shakoIcon,
  },
  {
    title: "Mounts, Armor & Trophies",
    itemGroups: [ItemGroup.MOUNTS, ItemGroup.HORSE_ARMOR, ItemGroup.TROPHIES],
    iconSrc: mountIcon,
  },
  {
    title: "Town Portals & Headstones",
    itemGroups: [ItemGroup.TOWN_PORTALS, ItemGroup.HEADSTONES],
    iconSrc: portalIcon,
  },
  {
    title: "Back Trophies",
    itemGroups: [ItemGroup.BACK_TROPHIES],
    iconSrc: backTrophyIcon,
  },
  {
    title: "Pets",
    itemGroups: [ItemGroup.PETS],
    iconSrc: petIcon,
  },
  {
    title: "Other",
    iconSrc: emblemIcon,
    itemGroups: [
      ItemGroup.BODY,
      ItemGroup.EMOTES,
      ItemGroup.EMBLEMS,
      ItemGroup.PLAYER_TITLES,
    ],
  },
] as const;

function getProgressViewModel(
  collectionLog: CollectionLog,
  collections: CollectionGroup,
  options: ProgressViewModelOptions = {},
): ProgressViewModel {
  const cards = progressCards.map((card) => ({
    iconSrc: card.iconSrc,
    title: card.title,
    ...getProgressStats(collectionLog, collections, card.itemGroups),
  }));
  const grandTotal = {
    title: "Grand Total",
    ...getAllProgressStats(collectionLog, collections),
  };
  const selectedScope = getSelectedScopeViewModel(
    collectionLog,
    grandTotal,
    options,
  );

  return {
    cards,
    grandTotal,
    selectedScope,
  };
}

function getSelectedScopeViewModel(
  collectionLog: CollectionLog,
  grandTotal: ProgressSummaryViewModel,
  {
    scopeSources = [],
    selectedScopeId,
  }: ProgressViewModelOptions,
): ProgressScopeViewModel {
  const scopeViewModels = scopeSources.map((source, index) => ({
    iconSrc: source.iconSrc,
    id: source.id,
    positionLabel: `${index + 1} of ${scopeSources.length}`,
    title: source.title,
    ...getAllProgressStats(collectionLog, source.collections),
  }));
  const selectedScope = scopeViewModels.find(
    (scope) => scope.id === selectedScopeId,
  );

  return selectedScope ?? {
    id: "current",
    positionLabel: "1 of 1",
    ...grandTotal,
  };
}

export { getProgressViewModel };
export type {
  ProgressCardViewModel,
  ProgressScopeSource,
  ProgressScopeViewModel,
  ProgressSummaryViewModel,
  ProgressViewModel,
};
