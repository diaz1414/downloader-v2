import { NextResponse } from "next/server";

// FIX 1: Gunakan Edge Runtime (Penting untuk Vercel)
export const runtime = "edge";

// FIX 2: Masukkan URL Worker Anda di sini
const CF_WORKER_PROXY = "https://raspy-limit-7890.ferdiazprasida.workers.dev"; 

// Helper Fetch dengan Timeout disiplin
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// FIX 3: Fungsi Proxy dengan Forwarding Header yang Benar
async function fetchWithProxy(targetUrl: string, referer: string = "https://www.google.com/") {
  // Jika URL Worker belum diisi, pakai cara direct
  if (!CF_WORKER_PROXY || CF_WORKER_PROXY.includes("URL_WORKER")) {
    return fetchWithTimeout(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Referer": referer
      }
    });
  }

  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(targetUrl)}`;
  console.log(`[ROUTING] via Cloudflare: ${targetUrl}`);
  
  return fetchWithTimeout(proxyUrl);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });

    // FIX 4: Pembersihan URL (Hapus parameter tracking yang sering bikin API error)
    try {
      const urlObj = new URL(url);
      if (url.includes("instagram.com") || url.includes("tiktok.com")) {
        url = `${urlObj.origin}${urlObj.pathname}`;
      }
    } catch (e) {}

    const isTiktok = url.includes("tiktok.com") || url.includes("vt.tiktok");
    const isInstagram = url.includes("instagram.com");
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");

    console.log(`[PROCESS] Target: ${url}`);

    // 1. TIKTOK PROTOCOL (TikWM via Proxy)
    if (isTiktok) {
      try {
        const res = await fetchWithProxy(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, "https://www.tikwm.com/");
        const d = await res.json();
        if (d.code === 0 && d.data) {
          return NextResponse.json({
            status: "success",
            url: d.data.play,
            title: d.data.title || "TikTok Video",
            source: "TikTok Cloud Engine",
            picker: [
              { url: d.data.play, type: "video", quality: "HD (No Watermark)", extension: "mp4" },
              { url: d.data.wmplay, type: "video", quality: "Watermark", extension: "mp4" },
              { url: d.data.music, type: "audio", quality: "Audio Only", extension: "mp3" }
            ]
          });
        }
      } catch (e) { console.warn("[TIKTOK] Failed"); }
    }

    // 2. INSTAGRAM PROTOCOL (Chocomilk via Proxy)
    if (isInstagram) {
      try {
        const res = await fetchWithProxy(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, "https://chocomilk.amira.us.kg/");
        if (res.ok) {
          const d = await res.json();
          const data = d.data || d.result || d;
          const mediaUrl = data.url || (Array.isArray(data) ? data[0]?.url : null);
          if (mediaUrl) {
            return NextResponse.json({
              status: "success",
              url: mediaUrl,
              title: data.title || "Instagram Media",
              source: "Instagram Cloud Engine",
              picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e) { console.warn("[INSTAGRAM] Failed"); }
    }

    // 3. YOUTUBE PROTOCOL (Ryzumi Specialized via Proxy)
    if (isYoutube) {
      try {
        const res = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}`, "https://ryzumi.net/");
        if (res.ok) {
          const d = await res.json();
          if (d.videoUrl) {
            return NextResponse.json({
              status: "success",
              url: d.videoUrl,
              title: d.title || "YouTube Video",
              source: "YouTube Cloud Engine",
              picker: [
                { url: d.videoUrl, type: "video", quality: "720p", extension: "mp4" },
                { url: d.audioUrl, type: "audio", quality: "Audio", extension: "mp3" }
              ]
            });
          }
        }
      } catch (e) { console.warn("[YOUTUBE] Failed"); }
    }

    // 4. UNIVERSAL FALLBACK (Ryzumi AIO via Proxy)
    try {
      const res = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, "https://ryzumi.net/");
      if (res.ok) {
        const d = await res.json();
        if (d.medias && d.medias.length > 0) {
          return NextResponse.json({
            status: "success",
            url: d.medias[0].url,
            title: d.title || "Universal Result",
            source: "Universal Cloud Engine",
            picker: d.medias.map((m: any) => ({
              url: m.url, type: m.type || "video", quality: m.quality || "HD", extension: m.extension || "mp4"
            }))
          });
        }
      }
    } catch (e) { console.warn("[UNIVERSAL] Failed"); }

    return NextResponse.json({ 
      status: "error", 
      text: "Maaf, semua jalur cloud gagal. Link mungkin privat atau server sedang sibuk." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL]", error);
    return NextResponse.json({ status: "error", text: "Terjadi kesalahan internal pada protokol." }, { status: 500 });
  }
}
