import season13 from "../../assets/images/season13@1x.webp";
import season14 from "../../assets/images/season14.webp";

type SeasonViewModel = {
  image: string;
  name: string;
  title: string;
};

const seasonsByNumber: Array<SeasonViewModel | undefined> = [];

seasonsByNumber[13] = {
  image: season13,
  name: "Season of Reckoning",
  title: "Season 13",
};

seasonsByNumber[14] = {
  image: season14,
  name: "Season of Death Awakening",
  title: "Season 14",
};

function getSeasonViewModel(seasonNumber: number): SeasonViewModel | undefined {
  return seasonsByNumber[seasonNumber];
}

export { getSeasonViewModel };
export type { SeasonViewModel };
