const ITEM_IMPORT_ITEM_QUALITIES = new Map([
  ["transmog", 0],
  ["junk", 1],
  ["common", 2],
  ["rare", 3],
  ["magic", 4],
  ["legendary", 5],
  ["unique", 6],
  ["mythic", 7],
  ["iconic mythic", 8],
]);
const ITEM_IMPORT_CHARACTER_CLASSES = new Map([
  ["sorcerer", 0],
  ["druid", 1],
  ["barbarian", 2],
  ["rogue", 3],
  ["necromancer", 4],
  ["spiritborn", 5],
  ["paladin", 6],
  ["warlock", 7],
]);
const ITEM_IMPORT_IMAGE_HOSTNAMES = new Set(["wow.zamimg.com"]);
const HTML_ENTITY_VALUES = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["lt", "<"],
  ["nbsp", " "],
  ["quot", '"'],
]);

function getImportedItemId(url) {
  const match = /-(\d+)\/?$/.exec(url.pathname);

  return match ? Number(match[1]) : undefined;
}

function decodeHtmlEntities(value) {
  return value
    .replace(
      /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,
      (match, decimal, hexadecimal, namedEntity) => {
        if (decimal) {
          return decodeNumericHtmlEntity(Number(decimal), match);
        }

        if (hexadecimal) {
          return decodeNumericHtmlEntity(
            Number.parseInt(hexadecimal, 16),
            match,
          );
        }

        return HTML_ENTITY_VALUES.get(namedEntity.toLowerCase()) ?? match;
      },
    )
    .trim();
}

function decodeNumericHtmlEntity(codePoint, fallback) {
  return Number.isInteger(codePoint) &&
    codePoint >= 0 &&
    codePoint <= 0x10FFFF
    ? String.fromCodePoint(codePoint)
    : fallback;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMetaContent(html, attribute, value) {
  const attributePattern = escapeRegExp(attribute);
  const valuePattern = escapeRegExp(value);
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attributePattern}=["']${valuePattern}["'][^>]*content=["']([^"']+)["'][^>]*>|` +
      `<meta\\s+[^>]*content=["']([^"']+)["'][^>]*${attributePattern}=["']${valuePattern}["'][^>]*>`,
    "i",
  );
  const match = pattern.exec(html);

  if (!match) {
    return undefined;
  }

  return decodeHtmlEntities(match[1] ?? match[2] ?? "");
}

function getFirstMatch(html, pattern) {
  const match = pattern.exec(html);

  return match ? decodeHtmlEntities(match[1]) : undefined;
}

function getAttributeValue(tag, attribute) {
  const match = new RegExp(`\\s${attribute}\\s*=\\s*(["'])(.*?)\\1`, "i")
    .exec(tag);

  return match ? decodeHtmlEntities(match[2]) : undefined;
}

function getItemTooltipIconUrl(html) {
  const tags = html.match(/<[^>]*\bwhtt-header-icon\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const style = getAttributeValue(tag, "style");
    const match = style
      ? /background-image\s*:\s*url\((["']?)(.*?)\1\)/i.exec(style)
      : undefined;
    const iconUrl = match?.[2]?.trim();

    if (iconUrl) {
      return iconUrl;
    }
  }

  return undefined;
}

function getImportedItemImageUrl(value, baseUrl) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  let url;

  try {
    url = new URL(value.trim(), baseUrl);
  } catch {
    return undefined;
  }

  if (
    url.protocol !== "https:" ||
    !ITEM_IMPORT_IMAGE_HOSTNAMES.has(url.hostname)
  ) {
    return undefined;
  }

  url.hash = "";
  url.password = "";
  url.username = "";

  return url.toString();
}

function getReadablePageText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

function parseItemClassification(text) {
  const match = new RegExp(
    `\\b(${Array.from(ITEM_IMPORT_ITEM_QUALITIES.keys()).join("|")})\\s+` +
      "([A-Z][A-Za-z-]*(?:\\s+[A-Z][A-Za-z-]*){0,3})\\s+" +
      "\\d+\\s+Item\\s+Power\\b",
    "i",
  ).exec(text);

  if (!match) {
    return {};
  }

  const qualityName = match[1].toLowerCase();
  const itemTypeName = match[2].trim();
  const itemQuality = ITEM_IMPORT_ITEM_QUALITIES.get(qualityName);

  return {
    ...(itemQuality === undefined ? {} : { itemQuality }),
    itemTypeName,
  };
}

function parseUsableByClass(text) {
  const classNames = Array.from(ITEM_IMPORT_CHARACTER_CLASSES.keys());
  const classPattern = new RegExp(`\\b(${classNames.join("|")})\\b`, "gi");
  const requiresPattern = /\bRequires\s+Level\s+\d+\s+(.{0,180})/gi;

  for (const requiresMatch of text.matchAll(requiresPattern)) {
    const segment = requiresMatch[1].split(
      /\b(?:Account Bound|Cannot Be|Durability|Requires Level|Sell Value|Unique Equipped)\b/i,
    )[0];
    const usableByClass = Array(ITEM_IMPORT_CHARACTER_CLASSES.size).fill(0);
    let hasClassMatch = false;

    for (const classMatch of segment.matchAll(classPattern)) {
      const characterClass = ITEM_IMPORT_CHARACTER_CLASSES.get(
        classMatch[1].toLowerCase(),
      );

      if (characterClass === undefined) {
        continue;
      }

      usableByClass[characterClass] = 1;
      hasClassMatch = true;
    }

    if (hasClassMatch) {
      return usableByClass;
    }
  }

  return undefined;
}

function normalizeImportedTitle(title) {
  return title
    .replace(/\s+-\s+Diablo\s+4.*$/i, "")
    .replace(/\s+-\s+Diablo\s+IV.*$/i, "")
    .trim();
}

function parseImportedItemPage(html, url) {
  const itemId = getImportedItemId(url);
  const title =
    getMetaContent(html, "property", "og:title") ??
    getFirstMatch(html, /<h1[^>]*>([^<]+)<\/h1>/i) ??
    getFirstMatch(html, /<title[^>]*>([^<]+)<\/title>/i);
  const iconUrl =
    getItemTooltipIconUrl(html) ??
    getMetaContent(html, "property", "og:image") ??
    getFirstMatch(html, /"icon"\s*:\s*"([^"]+)"/i);
  const pageText = getReadablePageText(html);
  const classification = parseItemClassification(pageText);
  const usableByClass = parseUsableByClass(pageText);
  const item = {};

  if (typeof itemId === "number" && Number.isInteger(itemId)) {
    item.id = itemId;
  }

  if (title) {
    item.name = normalizeImportedTitle(title);
  }

  if (classification.itemQuality !== undefined) {
    item.itemQuality = classification.itemQuality;
  }

  if (usableByClass !== undefined) {
    item.usableByClass = usableByClass;
  }

  return {
    iconUrl,
    item,
    itemTypeName: classification.itemTypeName,
  };
}

module.exports = {
  getImportedItemImageUrl,
  parseImportedItemPage,
};
