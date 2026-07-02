import type { SidebarVisibility } from "../../common";

enum Content {
  LEDGER = "ledger",
  CONFIG = "config",
  SEARCH = "search",
}

type ContentState = {
  content: Content;
  history: Content[];
};

type MobileContentVisibility = {
  isMobileConfigOpen: boolean;
  isMobileSearchOpen: boolean;
};

const DEFAULT_CONTENT = Content.LEDGER;
const transientContent = [Content.CONFIG, Content.SEARCH];

function getInitialContentState(): ContentState {
  return {
    content: DEFAULT_CONTENT,
    history: [DEFAULT_CONTENT],
  };
}

function openContent(
  history: Content[],
  content: Content,
): ContentState {
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

function closeContent(history: Content[]): ContentState {
  return {
    content: history[history.length - 1] ?? DEFAULT_CONTENT,
    history: history.slice(0, -1),
  };
}

function toggleContent(
  currentContent: Content,
  history: Content[],
  content: Content,
): ContentState {
  return currentContent === content
    ? closeContent(history)
    : openContent(history, content);
}

function toggleSidebarVisibility(
  sidebarVisibility: SidebarVisibility,
  key: keyof SidebarVisibility,
): SidebarVisibility {
  return {
    ...sidebarVisibility,
    [key]: !sidebarVisibility[key],
  };
}

function getMobileContentVisibility(
  content: Content,
): MobileContentVisibility {
  return {
    isMobileConfigOpen: content === Content.CONFIG,
    isMobileSearchOpen: content === Content.SEARCH,
  };
}

export {
  DEFAULT_CONTENT,
  Content,
  closeContent,
  getInitialContentState,
  getMobileContentVisibility,
  openContent,
  toggleContent,
  toggleSidebarVisibility,
  type MobileContentVisibility,
  type ContentState,
};
