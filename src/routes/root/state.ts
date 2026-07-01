enum RootContent {
  LEDGER = "ledger",
  CONFIG = "config",
  SEARCH = "search",
}

type RootContentState = {
  content: RootContent;
  history: RootContent[];
};

const DEFAULT_ROOT_CONTENT = RootContent.LEDGER;
const transientContent = [RootContent.CONFIG, RootContent.SEARCH];

function getInitialRootContentState(): RootContentState {
  return {
    content: DEFAULT_ROOT_CONTENT,
    history: [DEFAULT_ROOT_CONTENT],
  };
}

function openRootContent(
  history: RootContent[],
  content: RootContent,
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

function closeRootContent(history: RootContent[]): RootContentState {
  return {
    content: history[history.length - 1] ?? DEFAULT_ROOT_CONTENT,
    history: history.slice(0, -1),
  };
}

function toggleRootContent(
  currentContent: RootContent,
  history: RootContent[],
  content: RootContent,
): RootContentState {
  return currentContent === content
    ? closeRootContent(history)
    : openRootContent(history, content);
}

export {
  DEFAULT_ROOT_CONTENT,
  RootContent,
  closeRootContent,
  getInitialRootContentState,
  openRootContent,
  toggleRootContent,
  type RootContentState,
};
