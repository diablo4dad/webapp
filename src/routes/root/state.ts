import { ContentType } from "../../common";

type RootContentState = {
  content: ContentType;
  history: ContentType[];
};

const DEFAULT_ROOT_CONTENT = ContentType.LEDGER;
const transientContent = [ContentType.CONFIG, ContentType.SEARCH];

function getInitialRootContentState(): RootContentState {
  return {
    content: DEFAULT_ROOT_CONTENT,
    history: [DEFAULT_ROOT_CONTENT],
  };
}

function openRootContent(
  history: ContentType[],
  content: ContentType,
): RootContentState {
  if (transientContent.includes(content)) {
    return {
      content,
      history,
    };
  }

  if (history[history.length - 1] === content) {
    return {
      content,
      history,
    };
  }

  return {
    content,
    history: [...history, content],
  };
}

function closeRootContent(history: ContentType[]): RootContentState {
  return {
    content: history[history.length - 1] ?? DEFAULT_ROOT_CONTENT,
    history: history.slice(0, -1),
  };
}

function toggleRootContent(
  currentContent: ContentType,
  history: ContentType[],
  content: ContentType,
): RootContentState {
  return currentContent === content
    ? closeRootContent(history)
    : openRootContent(history, content);
}

export {
  DEFAULT_ROOT_CONTENT,
  closeRootContent,
  getInitialRootContentState,
  openRootContent,
  toggleRootContent,
};
export type { RootContentState };
