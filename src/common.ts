enum MasterGroup {
    GENERAL = "General",
    SHOP_ITEMS = "Shop",
    PROMOTIONAL = "Promotional",
    SEASONS = "Season",
}

export const locale = {
    [MasterGroup.SHOP_ITEMS]: "Cash Shop",
    [MasterGroup.GENERAL]: "General",
    [MasterGroup.PROMOTIONAL]: "Promotion",
    [MasterGroup.SEASONS]: "Seasons",
}

export { MasterGroup }
