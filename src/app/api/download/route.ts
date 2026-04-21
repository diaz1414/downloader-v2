import { NextResponse } from "next/server";

export const runtime = "edge";

// Fast timeout for Vercel (4-5 seconds max per attempt)
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 4500 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isTiktok = url.includes("tiktok.com");

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // 1. TIKTOK PRIORITY (TikWM is extremely fast)
    if (isTiktok) {
      try {
        const twmRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers });
        const twmData = await twmRes.json();
        if (twmData?.data) {
          const d = twmData.data;
          return NextResponse.json({
            status: "stream",
            url: d.play,
            title: d.title,
            thumbnail: d.cover,
            source: "TikTok",
            picker: [
              { url: d.play, type: "video", quality: "HD (NO-WM)", extension: "mp4" },
              { url: d.music, type: "audio", quality: "AUDIO", extension: "mp3" }
            ]
          });
        }
      } catch (e) { /* fallback */ }
    }

    // 2. GLOBAL FAST PRIORITY: COBALT (Fastest for YT/IG/TW)
    const COBALT_INSTANCES = [
      "https://cobalt.canine.tools/api/json",
      "https://cobalt-api.meowing.de/api/json",
      "https://api.cobalt.tools/api/json"
    ];

    for (const instance of COBALT_INSTANCES) {
      try {
        const cRes = await fetchWithTimeout(instance, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ url, vQuality: "720", isNoTTWatermark: true })
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData.url || cData.picker) {
            return NextResponse.json({
              status: cData.picker ? "picker" : "stream",
              url: cData.url,
              title: "Archive Record",
              source: "Global Protocol",
              picker: cData.picker ? cData.picker.map((p: any) => ({
                url: p.url, type: "video", quality: "Standard", extension: "mp4"
              })) : [{ url: cData.url, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e) { continue; }
    }

    // 3. FINAL FALLBACK: RYZUMI (Only if Cobalt fails, use short timeout)
    try {
      const ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, { headers, timeout: 4000 });
      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data?.medias?.length > 0) {
          return NextResponse.json({
            status: "stream",
            url: data.medias[0].url,
            title: data.title,
            thumbnail: data.thumbnail,
            source: data.source,
            picker: data.medias.map((m: any) => ({
              url: m.url, type: m.type, quality: m.quality || m.extension, extension: m.extension
            }))
          });
        }
      }
    } catch (err: any) { /* final fail */ }

    return NextResponse.json({
      status: "error",
      text: "Maaf, protokol sedang sibuk. Silakan coba lagi nanti."
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: "Protokol Error." }, { status: 500 });
  }
}