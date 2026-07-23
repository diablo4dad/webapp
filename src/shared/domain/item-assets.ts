import { CharacterClass, Zone } from "../../services/data";
import { MasterGroup } from "./catalog";
import barbarian from "../../assets/images/classes/barbarian.webp";
import druid from "../../assets/images/classes/druid.webp";
import necromancer from "../../assets/images/classes/necromancer.webp";
import paladin from "../../assets/images/classes/paladin.png";
import rogue from "../../assets/images/classes/rogue.webp";
import sorceress from "../../assets/images/classes/sorcerer.webp";
import spiritborn from "../../assets/images/classes/spiritborn.webp";
import warlock from "../../assets/images/classes/warlock.webp";
import challengeCollection from "../../assets/images/icons/dungeon.webp";
import generalCollection from "../../assets/images/icons/goblin.webp";
import promotionalCollection from "../../assets/images/icons/chest.webp";
import salvage from "../../assets/images/icons/salvage.webp";
import seasonCollection from "../../assets/images/icons/season.webp";
import shopCollection from "../../assets/images/icons/purse.webp";
import universalCollection from "../../assets/images/icons/wardrobe.webp";
import unobtainable from "../../assets/images/miniico/mystery.webp";
import premium from "../../assets/images/miniico/purse.webp";
import season from "../../assets/images/miniico/season.webp";
import series from "../../assets/images/miniico/series.webp";
import outOfRotation from "../../assets/images/miniico/skull.webp";
import wardrobe from "../../assets/images/miniico/wardrobe.webp";
import expansion from "../../assets/images/logo/d4ico_x1.png";
import drySteppes from "../../assets/images/region/dry_steppes.webp";
import fracturedPeaks from "../../assets/images/region/fractured_peaks.webp";
import hawezar from "../../assets/images/region/hawezar.webp";
import kehjistan from "../../assets/images/region/kehjistan.webp";
import nahantu from "../../assets/images/region/nahantu.webp";
import scosglen from "../../assets/images/region/scosglen.webp";

const classIconMap = new Map<CharacterClass, string>([
  [CharacterClass.BARBARIAN, barbarian],
  [CharacterClass.DRUID, druid],
  [CharacterClass.ROGUE, rogue],
  [CharacterClass.SORCERER, sorceress],
  [CharacterClass.NECROMANCER, necromancer],
  [CharacterClass.SPIRITBORN, spiritborn],
  [CharacterClass.PALADIN, paladin],
  [CharacterClass.WARLOCK, warlock],
]);

const regionIconMap = new Map<Zone, string>([
  [Zone.FRACTURED_PEAKS, fracturedPeaks],
  [Zone.SCOSGLEN, scosglen],
  [Zone.HAWEZAR, hawezar],
  [Zone.KEHJISTAN, kehjistan],
  [Zone.DRY_STEPPES, drySteppes],
  [Zone.NAHANTU, nahantu],
]);

const collectionGroupIconMap = new Map<MasterGroup, string>([
  [MasterGroup.GENERAL, generalCollection],
  [MasterGroup.SHOP_ITEMS, shopCollection],
  [MasterGroup.PROMOTIONAL, promotionalCollection],
  [MasterGroup.SEASONS, seasonCollection],
  [MasterGroup.CHALLENGE, challengeCollection],
  [MasterGroup.UNIVERSAL, universalCollection],
]);

const itemTagIcons = {
  expansion,
  outOfRotation,
  premium,
  salvage,
  season,
  series,
  unobtainable,
  wardrobe,
};

export { classIconMap, collectionGroupIconMap, itemTagIcons, regionIconMap };
