import { NextResponse } from "next/server";

// FIX 1: Gunakan Edge Runtime untuk menghindari timeout 10 detik di Vercel (Edge punya 30 detik)
export const runtime = "edge";

// !!! GANTI DENGAN URL CLOUDFLARE WORKER ANDA !!!
const CF_WORKER_PROXY = "https://downloader-v2.ferdiazprasida.workers.dev";

// Fetch dengan timeout yang lebih disiplin
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 8000 } = options; // Default 8 detik
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

// Proxy Wrapper (Cloudflare Worker)
async function fetchWithProxy(url, options = {}) {
  if (!CF_WORKER_PROXY || CF_WORKER_PROXY.includes("URL_WORKER_ANDA")) {
    console.warn("[PROXY] URL Worker belum diisi. Mencoba direct...");
    return fetchWithTimeout(url, options);
  }

  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(url)}`;
  console.log(`[PROXY] Routing via Worker to: ${url}`);
  return fetchWithTimeout(proxyUrl, options);
}

export async function POST(req) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });

    // Sanitize URL
    try {
      if (url.includes("instagram.com") || url.includes("tiktok.com") || url.includes("vt.tiktok")) {
        const urlObj = new URL(url);
        url = `${urlObj.origin}${urlObj.pathname}`;
      }
    } catch (e) {}

    const isTiktok = url.includes("tiktok.com") || url.includes("vt.tiktok");
    const isInstagram = url.includes("instagram.com");

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "X-Forwarded-For": Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join('.'),
    };

    console.log(`[PROCESS] Target: ${url}`);

    // 1. TIKTOK PRIORITY (TikWM)
    if (isTiktok) {
      try {
        console.log("[TIKTOK] Trying TikWM...");
        let tikRes = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers, timeout: 6000 });
        
        if (!tikRes.ok || tikRes.status === 403) {
          console.log("[TIKTOK] TikWM Direct Blocked, trying Proxy...");
          tikRes = await fetchWithProxy(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers });
        }

        const d = await tikRes.json();
        if (d.code === 0 && d.data) {
          return NextResponse.json({
            status: "success",
            url: d.data.play,
            title: d.data.title || "TikTok Video",
            source: "TikWM Protocol",
            picker: [
              { url: d.data.play, type: "video", quality: "HD (No Watermark)", extension: "mp4" },
              { url: d.data.wmplay, type: "video", quality: "Watermark", extension: "mp4" },
              { url: d.data.music, type: "audio", quality: "Music Only", extension: "mp3" }
            ]
          });
        }
      } catch (e) { console.warn("[TIKTOK] TikWM Failed"); }
    }

    // 2. INSTAGRAM PRIORITY (Chocomilk)
    if (isInstagram) {
      try {
        console.log("[INSTAGRAM] Trying Chocomilk...");
        let cocoRes = await fetchWithTimeout(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, { headers, timeout: 6000 });

        if (!cocoRes.ok || cocoRes.status === 403) {
          console.log("[INSTAGRAM] Chocomilk Blocked, trying Proxy...");
          cocoRes = await fetchWithProxy(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, { headers });
        }

        if (cocoRes.ok) {
          const d = await cocoRes.json();
          const data = d.data || d.result || d;
          const mediaUrl = data.url || (Array.isArray(data) ? data[0]?.url : null);
          if (mediaUrl) {
            return NextResponse.json({
              status: "success",
              url: mediaUrl,
              title: data.title || "Instagram Content",
              source: "Chocomilk Protocol",
              picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e) { console.warn("[INSTAGRAM] Chocomilk Failed"); }
    }

    // 3. UNIVERSAL FALLBACK (Ryzumi AIO)
    try {
      console.log("[UNIVERSAL] Trying Ryzumi AIO...");
      let ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
        headers: { ...headers, "Referer": "https://ryzumi.net/" },
        timeout: 8000
      });

      if (!ryzumiRes.ok || ryzumiRes.status === 403) {
        console.log("[UNIVERSAL] Ryzumi Blocked, trying Proxy...");
        ryzumiRes = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
          headers: { ...headers, "Referer": "https://ryzumi.net/" }
        });
      }

      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
          return NextResponse.json({
            status: "success",
            url: data.medias[0].url,
            title: data.title || "Universal Result",
            source: "Ryzumi AIO Protocol",
            picker: data.medias.map(m => ({ 
              url: m.url, 
              type: m.type || "video", 
              quality: m.quality || "HD", 
              extension: m.extension || "mp4" 
            }))
          });
        }
      }
    } catch (e) { console.warn("[UNIVERSAL] Ryzumi Failed"); }

    return NextResponse.json({
      status: "error",
      text: "Maaf, semua protokol gagal mendapatkan data. Link mungkin privat atau server sedang sibuk."
    }, { status: 200 });

  } catch (error) {
    console.error("[CRITICAL_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Terjadi kesalahan internal pada protokol." }, { status: 500 });
  }
}
