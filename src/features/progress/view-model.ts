import type { CollectionLog } from "../ledger/type";
import { ItemGroup } from "../../shared/domain";
import type { CollectionGroup } from "../../services/data";
import backTrophyIcon from "../../assets/images/back-trophy@1x.png";
import emblemIcon from "../../assets/images/emblem@1x.png";
import mountIcon from "../../assets/images/mount@1x.png";
import petIcon from "../../assets/images/pet@1x.png";
import portalIcon from "../../assets/images/portal@1x.png";
import shakoIcon from "../../assets/images/shako@1x.png";
import { getProgressStats, type ProgressStats } from "./state";

type ProgressCardConfig = {
  iconSrc: string;
  itemGroups: readonly ItemGroup[];
  title: string;
};

type ProgressCardViewModel = ProgressStats & {
  iconSrc: string;
  title: string;
};

type ProgressViewModel = {
  cards: readonly ProgressCardViewModel[];
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
): ProgressViewModel {
  return {
    cards: progressCards.map((card) => ({
      iconSrc: card.iconSrc,
      title: card.title,
      ...getProgressStats(collectionLog, collections, card.itemGroups),
    })),
  };
}

export { getProgressViewModel };
export type { ProgressCardViewModel, ProgressViewModel };
