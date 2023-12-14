enum SourceType {
  Challenge = "challenge",
  Drop = "drop",
  Shop = "shop",
}

enum ItemType {
  Mount = "Mount",
  MountArmor = "Horse Armor",
  MountTrophy = "Trophy",
}

type Item = {
  id: string,
  type: ItemType,
  icon: string,
  name: string,
  description: string,
}

type ItemDto = {
  id: string,
  type: string,
  icon: string,
  name: string,
  description: string,
  source: string[],
}

type SourceChallenge = {
  type: SourceType.Challenge,
  title: string,
  description: string,
}

type SourceDrop = {
  type: SourceType.Drop,
  boss: string,
  title: string,
}

type SourceShop = {
  type: SourceType.Shop,
  boss: string,
  title: string,
  price: number,
}

type Source = SourceChallenge | SourceDrop | SourceShop;

async function fetchDb(): Promise<Item[]> {
  const resp = await fetch('db.json');
  const data: ItemDto[] = await resp.json();

  return data.map(dto => {
    return {
      ...dto,
      type: dto.type as ItemType,
    }
  });
}

export default fetchDb;
export { ItemType };
export type { Item };
