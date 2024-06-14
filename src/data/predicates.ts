import { DadItem } from "./index";
import { wardrobeIcons } from "../common";

export function doesHaveWardrobePlaceholder(item: DadItem): boolean {
  return item.transMog && wardrobeIcons.includes(item.itemType);
}
