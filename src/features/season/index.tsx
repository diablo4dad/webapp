import { SeasonView } from "./view";
import { getSeasonViewModel } from "./view-model";

const CURRENT_SEASON = 14;

function Season() {
  const season = getSeasonViewModel(CURRENT_SEASON);

  if (season === undefined) {
    return null;
  }

  return <SeasonView season={season} />;
}

export { Season };
