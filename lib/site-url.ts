export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.thetruthpill.org"
  ).replace(/\/+$/, "");
}

export function getCanonical(path: string): string {
  return (
    getSiteUrl() + (path === "/" ? "/" : "/" + path.replace(/^\/+/, ""))
  );
}
