import {
  CharacterClass,
  CharacterGender,
  Chest,
  CollectionItem,
  MagicType,
  Zone,
} from "../data";

const I18N = {
  characterGender: {
    [CharacterGender.MALE]: "Male",
    [CharacterGender.FEMALE]: "Female",
  },
  characterClass: {
    [CharacterClass.BARBARIAN]: "Barbarian",
    [CharacterClass.ROGUE]: "Rogue",
    [CharacterClass.SORCERER]: "Sorcerer",
    [CharacterClass.DRUID]: "Druid",
    [CharacterClass.NECROMANCER]: "Necromancer",
    [CharacterClass.SPIRITBORN]: "Spiritborn",
  },
  region: {
    [Zone.FRACTURED_PEAKS]: "Fractured Peaks",
    [Zone.SCOSGLEN]: "Scosglen",
    [Zone.KEHJISTAN]: "Kehjistan",
    [Zone.DRY_STEPPES]: "Dry Steppes",
    [Zone.HAWEZAR]: "Hawezar",
    [Zone.NAHANTU]: "Nahantu",
  },
  chest: {
    [Chest.HELLTIDE]: "Helltide Chests",
    [Chest.LEGION]: "Legion Chests",
    [Chest.WORLD_EVENT]: "World Event Chests",
    [Chest.SILENT]: "Silent Chests",
  },
};

export function getItemDescription(item: CollectionItem): string {
  // setting a description overrides inferred/default
  if (item.claimDescription) {
    return item.claimDescription;
  }

  // unique items
  if (item.items.length) {
    const baseItem = item.items[0];
    if (baseItem.transmogName) {
      return `Salvaged from ${baseItem.name}.`;
    }

    if (baseItem.magicType) {
      if ([MagicType.UNIQUE, MagicType.MYTHIC].includes(baseItem.magicType)) {
        return `Salvaged from ${baseItem.name}.`;
      }
    }
  }

  const claimChest =
    item.claimChest !== undefined ? I18N.chest[item.claimChest] : "chest";
  const claimZone =
    item.claimZone !== undefined ? I18N.region[item.claimZone] : "unknown zone";

  switch (item.claim) {
    case "Cash Shop":
      return "Purchased from the cash shop.";
    case "Accelerated Battle Pass":
    case "Battle Pass":
      return `Season ${item.season} Battle Pass reward.`;
    case "Monster Drop":
    case "Boss Drop":
    case "World Boss Drop":
    case "Uber Boss Drop":
      return `Dropped by ${item.claimMonster}.`;
    case "Zone Drop":
      return `Looted from ${claimChest} within ${claimZone}.`;
    case "Challenge Reward":
      return "Awarded for completing a challenge.";
    case "Promotional":
      return "This is a limited time promotional item.";
    case "Vendor":
      return "Purchased from a vendor.";
    case "PvP Drop":
      return "Dropped by killing players and looting Baleful Chests.";
    case "World Drop":
      return "Dropped throughout Sanctuary.";
    default:
      return "Description unavailable.";
  }
}

export default I18N;
