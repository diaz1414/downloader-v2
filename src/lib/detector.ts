export type Platform = "tiktok" | "youtube" | "instagram" | "twitter" | "facebook" | "unknown";

export function detectPlatform(url: string): Platform {
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes("tiktok.com")) return "tiktok";
  if (lowercaseUrl.includes("youtube.com") || lowercaseUrl.includes("youtu.be")) return "youtube";
  if (lowercaseUrl.includes("instagram.com")) return "instagram";
  if (lowercaseUrl.includes("twitter.com") || lowercaseUrl.includes("x.com")) return "twitter";
  if (lowercaseUrl.includes("facebook.com") || lowercaseUrl.includes("fb.watch")) return "facebook";
  
  return "unknown";
}
