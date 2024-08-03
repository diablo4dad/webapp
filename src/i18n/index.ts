import { CharacterClass, CharacterGender } from "../data";

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
  },
};

export default I18N;
