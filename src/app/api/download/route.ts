import { NextResponse } from "next/server";

export const runtime = "edge";

const CF_WORKER_PROXY = "https://raspy-limit-7890.ferdiazprasida.workers.dev"; 

// Fungsi Proxy yang Benar (Hanya encode sekali saja)
async function fetchWithProxy(targetUrl: string) {
  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(targetUrl)}`;
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

    // 1. JALUR COBALT (PRIORITAS UTAMA - PALING SAKTI)
    // Cobalt biasanya langsung jalan di Vercel tanpa butuh proxy
    try {
      const res = await fetch("https://cobalt-api.meowing.de/api/json", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Accept": "application/json" 
        },
        body: JSON.stringify({ url, vQuality: "720", isNoTTWatermark: true })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.url) return NextResponse.json({
          status: "success",
          url: d.url,
          title: "Digital Archive Result",
          source: "Cobalt Global Engine",
          picker: [{ url: d.url, type: "video", quality: "HD", extension: "mp4" }]
        });
      }
    } catch (e) {
      console.warn("Cobalt Engine failed, switching to proxies...");
    }

    // 2. JALUR TIKTOK (TikWM via Proxy)
    if (url.includes("tiktok.com") || url.includes("vt.tiktok")) {
      try {
        const res = await fetchWithProxy(`https://www.tikwm.com/api/?url=${url}`);
        const d = await res.json();
        if (d.data) return NextResponse.json({
          status: "success",
          url: d.data.play,
          title: d.data.title,
          source: "TikTok Engine V3",
          picker: [
            { url: d.data.play, type: "video", quality: "HD", extension: "mp4" },
            { url: d.data.music, type: "audio", quality: "Music Only", extension: "mp3" }
          ]
        });
      } catch (e) {}
    }

    // 3. JALUR INSTAGRAM (ReelSaver via Proxy)
    if (url.includes("instagram.com")) {
      try {
        const res = await fetchWithProxy(`https://api.reelsaver.net/api/instagram/download?url=${url}`);
        const d = await res.json();
        if (d.data?.media_url) return NextResponse.json({
          status: "success",
          url: d.data.media_url,
          title: "Instagram Media",
          source: "Instagram Engine V3",
          picker: [{ url: d.data.media_url, type: "video", quality: "HD", extension: "mp4" }]
        });
      } catch (e) {}
    }

    // 4. JALUR CADANGAN TERAKHIR (Ryzumi)
    try {
      const res = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/all-in-one?url=${url}`);
      const d = await res.json();
      if (d.medias?.[0]?.url) return NextResponse.json({
        status: "success",
        url: d.medias[0].url,
        title: d.title || "Archive Media",
        source: "Universal Engine V3",
        picker: d.medias.map((m: any) => ({ url: m.url, type: m.type, quality: m.quality, extension: m.extension }))
      });
    } catch (e) {}

    return NextResponse.json({ 
      status: "error", 
      text: "Semua mesin sedang overload. Gunakan link lain atau coba lagi nanti." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL]", error);
    return NextResponse.json({ status: "error", text: "Terjadi kesalahan internal pada protokol." }, { status: 500 });
  }
}
