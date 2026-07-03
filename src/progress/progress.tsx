import { useMemo } from "react";
import { useCollection } from "../ledger/context";
import { ItemGroup } from "../shared/domain";
import { useData } from "../data/context";
import { filterDb } from "../data/filters";
import backTrophyIcon from "../image/back-trophy@1x.png";
import emblemIcon from "../image/emblem@1x.png";
import mountIcon from "../image/mount@1x.png";
import petIcon from "../image/pet@1x.png";
import portalIcon from "../image/portal@1x.png";
import shakoIcon from "../image/shako@1x.png";
import { useSettings } from "../settings";
import { getProgressStats } from "./state";
import { ProgressView, type ProgressViewProps } from "./view";

type ProgressCardConfig = {
  iconSrc?: string;
  itemGroups: readonly ItemGroup[];
  title: string;
};

type Props = Pick<ProgressViewProps, "className" | "layout">;

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

function Progress(props: Props) {
  const collectionLog = useCollection();
  const settings = useSettings();
  const { db, group } = useData();
  const countedDb = useMemo(
    () => filterDb(db.collections, settings, collectionLog, group, null, true),
    [collectionLog, db.collections, group, settings],
  );
  const cards = useMemo(
    () =>
      progressCards.map((card) => ({
        ...card,
        ...getProgressStats(collectionLog, countedDb, card.itemGroups),
      })),
    [collectionLog, countedDb],
  );

  return <ProgressView {...props} cards={cards} />;
}

export { Progress };
