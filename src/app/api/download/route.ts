import { NextResponse } from "next/server";

export const runtime = "edge";

const CF_WORKER_PROXY = "https://raspy-limit-7890.ferdiazprasida.workers.dev"; 

async function fetchSmart(targetUrl: string) {
  // Kita coba lewat Proxy Cloudflare
  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(targetUrl)}`;
  return fetch(proxyUrl, {
    method: "GET",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
}

export async function POST(req: Request) {
  const logs: string[] = [];
  
  try {
    const body = await req.json();
    let { url } = body;
    if (!url) return NextResponse.json({ status: "error", text: "URL required" }, { status: 400 });

    logs.push(`Initiating download for: ${url}`);

    // 1. JALUR COBALT (MIRROR HYONSU - LEBIH STABIL)
    try {
      logs.push("Attempting Cobalt (Hyonsu Mirror)...");
      const res = await fetch("https://cobalt.hyonsu.com/api/json", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ url, vQuality: "720", isNoTTWatermark: true })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.url) {
          logs.push("Cobalt Success!");
          return NextResponse.json({
            status: "success", url: d.url, title: d.title || "Media Result", source: "Global Engine",
            picker: [{ url: d.url, type: "video", quality: "HD", extension: "mp4" }],
            debug: logs
          });
        }
      }
    } catch (e) {}

    // 2. JALUR TIKTOK (TiklyDown Direct)
    if (url.includes("tiktok.com") || url.includes("vt.tiktok")) {
      try {
        logs.push("Attempting TiklyDown Direct...");
        const res = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const d = await res.json();
          const videoUrl = d.video?.noWatermark || d.data?.video?.noWatermark;
          if (videoUrl) {
            logs.push("TiklyDown Success!");
            return NextResponse.json({
              status: "success", url: videoUrl, title: d.title || "TikTok", source: "TikTok V3",
              picker: [{ url: videoUrl, type: "video", quality: "No-WM", extension: "mp4" }],
              debug: logs
            });
          }
        }
      } catch (e) {}
    }

    // 3. JALUR INSTAGRAM (SnapInsta API via Smart Proxy)
    if (url.includes("instagram.com")) {
      try {
        logs.push("Attempting Instagram Specialized API...");
        const res = await fetchSmart(`https://api.reelsaver.net/api/instagram/download?url=${encodeURIComponent(url)}`);
        const text = await res.text();
        
        if (text.includes("error code")) {
          logs.push("Cloudflare 1016 detected on API. Skipping...");
        } else {
          try {
            const d = JSON.parse(text);
            if (d.data?.media_url) {
              logs.push("Instagram Success!");
              return NextResponse.json({
                status: "success", url: d.data.media_url, title: "Instagram Content", source: "IG V3",
                picker: [{ url: d.data.media_url, type: "video", quality: "HD", extension: "mp4" }],
                debug: logs
              });
            }
          } catch (jsonErr) {
            logs.push("Invalid JSON response from Instagram API.");
          }
        }
      } catch (e) {}
    }

    // 4. JALUR TERAKHIR (Ryzumi Fallback)
    try {
      logs.push("Final fallback: Ryzumi AIO...");
      const res = await fetchSmart(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.medias?.[0]?.url) {
          logs.push("Ryzumi Success!");
          return NextResponse.json({
            status: "success", url: d.medias[0].url, title: d.title || "Media Result", source: "Universal Engine",
            picker: d.medias.map((m: any) => ({ url: m.url, type: m.type, quality: m.quality, extension: m.extension })),
            debug: logs
          });
        }
      }
    } catch (e) {}

    return NextResponse.json({ 
      status: "error", 
      text: "Maaf, semua jalur sedang mengalami gangguan. Silakan coba link publik lainnya.",
      debug: logs 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: `Server Fatal Error: ${error.message}` }, { status: 500 });
  }
}
