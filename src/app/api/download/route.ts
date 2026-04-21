import { NextResponse } from "next/server";

export const runtime = "edge";

const CF_WORKER_PROXY = "https://raspy-limit-7890.ferdiazprasida.workers.dev"; 

async function fetchWithProxy(targetUrl: string) {
  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(targetUrl)}&t=${Date.now()}`;
  return fetch(proxyUrl, {
    method: "GET",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
}

export async function POST(req: Request) {
  let lastError = "Semua jalur cloud gagal.";
  
  try {
    const body = await req.json();
    let { url } = body;
    if (!url) return NextResponse.json({ status: "error", text: "URL required" }, { status: 400 });

    // 1. JALUR COBALT (Coba 3 Mirror Sekaligus)
    const cobaltMirrors = [
      "https://cobalt-api.meowing.de/api/json",
      "https://cobalt.hyonsu.com/api/json",
      "https://api.cobalt.tools/api/json"
    ];

    for (const mirror of cobaltMirrors) {
      try {
        const res = await fetch(mirror, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Accept": "application/json",
            "Referer": mirror.replace("/api/json", "")
          },
          body: JSON.stringify({ url, vQuality: "720", isNoTTWatermark: true })
        });
        
        if (res.ok) {
          const d = await res.json();
          if (d.url) return NextResponse.json({
            status: "success",
            url: d.url,
            title: d.title || "Media Result",
            source: "Global Engine",
            picker: [{ url: d.url, type: "video", quality: "HD", extension: "mp4" }]
          });
          if (d.text) lastError = d.text;
        }
      } catch (e: any) {
        lastError = `Cobalt Mirror Error: ${e.message}`;
      }
    }

    // 2. JALUR TIKTOK (TikWM via Proxy)
    if (url.includes("tiktok.com") || url.includes("vt.tiktok")) {
      try {
        const res = await fetchWithProxy(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const d = await res.json();
        if (d.data) return NextResponse.json({
          status: "success",
          url: d.data.play,
          title: d.data.title,
          source: "TikTok Engine",
          picker: [
            { url: d.data.play, type: "video", quality: "HD", extension: "mp4" },
            { url: d.data.music, type: "audio", quality: "Music Only", extension: "mp3" }
          ]
        });
      } catch (e: any) {
        lastError = `TikTok Error: ${e.message}`;
      }
    }

    // 3. JALUR INSTAGRAM (ReelSaver via Proxy)
    if (url.includes("instagram.com")) {
      try {
        const res = await fetchWithProxy(`https://api.reelsaver.net/api/instagram/download?url=${encodeURIComponent(url)}`);
        const d = await res.json();
        if (d.data?.media_url) return NextResponse.json({
          status: "success",
          url: d.data.media_url,
          title: "Instagram Media",
          source: "Instagram Engine",
          picker: [{ url: d.data.media_url, type: "video", quality: "HD", extension: "mp4" }]
        });
      } catch (e: any) {
        lastError = `Instagram Error: ${e.message}`;
      }
    }

    // FINAL ERROR (Menampilkan kenapa dia gagal)
    return NextResponse.json({ 
      status: "error", 
      text: `Gagal: ${lastError}. Silakan coba link lain.` 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: `Fatal: ${error.message}` }, { status: 500 });
  }
}
