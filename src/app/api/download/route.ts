import { NextResponse } from "next/server";

export const runtime = "edge";

// URL Worker Anda
const CF_WORKER_PROXY = "https://raspy-limit-7890.ferdiazprasida.workers.dev";

async function fetchWithProxy(targetUrl: string) {
  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(targetUrl)}&t=${Date.now()}`;
  return fetch(proxyUrl, {
    method: "GET",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { url } = body;
    if (!url) return NextResponse.json({ status: "error", text: "URL required" }, { status: 400 });

    // Bersihkan URL
    try {
      const urlObj = new URL(url);
      url = `${urlObj.origin}${urlObj.pathname}`;
    } catch (e) { }

    const isTiktok = url.includes("tiktok.com") || url.includes("vt.tiktok");
    const isInstagram = url.includes("instagram.com");

    // 1. TIKTOK (TiklyDown - Lebih stabil dari TikWM)
    if (isTiktok) {
      try {
        const res = await fetchWithProxy(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const d = await res.json();
        if (d.video || d.data?.video) {
          const videoUrl = d.video?.noWatermark || d.data?.video?.noWatermark || d.url;
          return NextResponse.json({
            status: "success",
            url: videoUrl,
            title: d.title || "TikTok Video",
            source: "TikTok Engine V3",
            picker: [{ url: videoUrl, type: "video", quality: "HD", extension: "mp4" }]
          });
        }
      } catch (e) { }
    }

    // 2. INSTAGRAM (ReelSaver API)
    if (isInstagram) {
      try {
        const res = await fetchWithProxy(`https://api.reelsaver.net/api/instagram/download?url=${encodeURIComponent(url)}`);
        const d = await res.json();
        if (d.data && d.data.media_url) {
          return NextResponse.json({
            status: "success",
            url: d.data.media_url,
            title: "Instagram Media",
            source: "Instagram Engine V3",
            picker: [{ url: d.data.media_url, type: "video", quality: "HD", extension: "mp4" }]
          });
        }
      } catch (e) { }
    }

    // 3. UNIVERSAL FALLBACK (Ryzumi)
    try {
      const res = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`);
      const d = await res.json();
      if (d.medias && d.medias.length > 0) {
        return NextResponse.json({
          status: "success",
          url: d.medias[0].url,
          title: d.title || "Archive Media",
          source: "Universal Engine V3",
          picker: d.medias.map((m: any) => ({
            url: m.url, type: m.type, quality: m.quality || "HD", extension: m.extension
          }))
        });
      }
    } catch (e) { }

    return NextResponse.json({
      status: "error",
      text: "Semua mesin sedang overload. Coba gunakan link lain atau coba lagi beberapa saat lagi."
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: "Protokol Cloud Error." }, { status: 500 });
  }
}
