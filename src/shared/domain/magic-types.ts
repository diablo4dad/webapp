import { MagicType } from "../../services/data";

const MAGIC_TYPE_NOT_SET = -1;
const MAGIC_TYPE_NOT_SET_FILTER_VALUE = String(MAGIC_TYPE_NOT_SET);
type NotSetMagicType = typeof MAGIC_TYPE_NOT_SET;
const magicTypeSortOrder = new Map<MagicType, number>([
  [MagicType.COMMON, 0],
  [MagicType.MAGIC, 1],
  [MagicType.RARE, 2],
  [MagicType.LEGENDARY, 3],
  [MagicType.UNIQUE, 4],
  [MagicType.MYTHIC, 5],
]);

function isMagicTypeNotSet(
  magicType?: number,
): magicType is NotSetMagicType | undefined {
  return magicType === undefined || magicType === MAGIC_TYPE_NOT_SET;
}

function getMagicTypeSortRank(magicType?: number): number {
  return isMagicTypeNotSet(magicType)
    ? Number.MAX_SAFE_INTEGER
    : magicTypeSortOrder.get(magicType as MagicType) ??
        Number.MAX_SAFE_INTEGER;
}

export {
  MAGIC_TYPE_NOT_SET,
  MAGIC_TYPE_NOT_SET_FILTER_VALUE,
  getMagicTypeSortRank,
  isMagicTypeNotSet,
};
