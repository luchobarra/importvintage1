const DEFAULT_SITE_URL = "https://oldtimesvintage.vercel.app";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = configuredUrl || DEFAULT_SITE_URL;
  const normalizedUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

  try {
    return new URL(normalizedUrl);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function createSiteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}
