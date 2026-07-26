const ROOT_SCROLL_CONTAINER_SELECTOR = "[data-root-scroll-container='true']";

function scrollRootToTop() {
  if (typeof document === "undefined") {
    return;
  }

  const scrollContainer = document.querySelector<HTMLElement>(
    ROOT_SCROLL_CONTAINER_SELECTOR,
  );

  if (scrollContainer) {
    scrollContainer.scrollLeft = 0;
    scrollContainer.scrollTop = 0;
  }
}

export { scrollRootToTop };
