
export const platformsList = ["instagram", "youtube", "x", "tiktok", "snapchat"] as const;

export type PlatformKey = typeof platformsList[number];