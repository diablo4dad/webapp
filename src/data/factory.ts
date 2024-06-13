import { DadDb } from "./index";

function createEmptyDb(): DadDb {
  return {
    collections: [],
  };
}

export { createEmptyDb };
