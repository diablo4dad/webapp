import { CharacterClass, CharacterGender } from "../data";

export enum Option {
  // types
  SHOW_MOUNTS = "show_mounts",
  SHOW_HORSE_ARMOR = "show_horse_armor",
  SHOW_TROPHIES = "show_trophies",
  SHOW_BACK_TROPHIES = "show_back_trophies",
  SHOW_ARMOR = "show_armor",
  SHOW_WEAPONS = "show_weapons",
  SHOW_MARKINGS = "show_markings",
  SHOW_EMOTES = "show_emotes",
  SHOW_PORTALS = "show_portals",
  SHOW_HEADSTONES = "show_headstones",
  SHOW_EMBLEMS = "show_emblems",
  SHOW_TITLES = "show_titles",
  SHOW_PETS = "show_pets",
  // filters
  SHOW_PREMIUM = "show_premium",
  SHOW_OUT_OF_ROTATION = "show_out_of_rotation",
  SHOW_HIDDEN = "show_hidden",
  SHOW_UNOBTAINABLE = "show_unobtainable",
  SHOW_WARDROBE_ONLY = "show_wardrobe_only",
  HIDE_COLLECTED = "hide_collected",
  // collectables
  SHOW_SHOP = "show_shop",
  SHOW_BATTLE_PASS = "show_battle_pass",
  SHOW_BATTLE_PASS_ACCELERATED = "show_battle_pass_plus",
  SHOW_PROMOTIONAL = "show_promotional",
  // display
  LEDGER_VIEW = "ledger_view",
  LEDGER_INVERSE = "ledger_inverse",
  PREFERRED_CLASS = "preferred_class",
  PREFERRED_GENDER = "preferred_gender",
  DEBUG = "debug",
}

export enum LedgerView {
  CARD = "card",
  LIST = "list",
}

export type Settings = {
  // types
  [Option.SHOW_MOUNTS]: boolean;
  [Option.SHOW_HORSE_ARMOR]: boolean;
  [Option.SHOW_TROPHIES]: boolean;
  [Option.SHOW_BACK_TROPHIES]: boolean;
  [Option.SHOW_ARMOR]: boolean;
  [Option.SHOW_WEAPONS]: boolean;
  [Option.SHOW_MARKINGS]: boolean;
  [Option.SHOW_EMOTES]: boolean;
  [Option.SHOW_PORTALS]: boolean;
  [Option.SHOW_HEADSTONES]: boolean;
  [Option.SHOW_EMBLEMS]: boolean;
  [Option.SHOW_TITLES]: boolean;
  [Option.SHOW_PETS]: boolean;
  // filters
  [Option.SHOW_PREMIUM]: boolean;
  [Option.SHOW_OUT_OF_ROTATION]: boolean;
  [Option.SHOW_HIDDEN]: boolean;
  [Option.SHOW_UNOBTAINABLE]: boolean;
  [Option.SHOW_WARDROBE_ONLY]: boolean;
  [Option.HIDE_COLLECTED]: boolean;
  // collectables
  [Option.SHOW_SHOP]: boolean;
  [Option.SHOW_BATTLE_PASS]: boolean;
  [Option.SHOW_BATTLE_PASS_ACCELERATED]: boolean;
  [Option.SHOW_PROMOTIONAL]: boolean;
  // display
  [Option.LEDGER_VIEW]: LedgerView;
  [Option.LEDGER_INVERSE]: boolean;
  [Option.PREFERRED_CLASS]: CharacterClass;
  [Option.PREFERRED_GENDER]: CharacterGender;
  [Option.DEBUG]: boolean;
};

export type NumberOption = Option.PREFERRED_CLASS | Option.PREFERRED_GENDER;
export type StringOption = Option.LEDGER_VIEW;
export type BooleanOption = Exclude<Option, NumberOption | StringOption>;
