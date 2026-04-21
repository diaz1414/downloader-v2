import { NextResponse } from "next/server";

export const runtime = "edge";

// CLOUDFLARE WORKER PROXY (BYPASS BLOKIR VERCEL)
const CF_WORKER_PROXY = "https://raspy-limit-7890.ferdiazprasida.workers.dev"; 

// Fetch dengan timeout dan dukungan Proxy
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 10000 } = options;
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

// Fungsi utama untuk menembus blokir IP Vercel lewat Cloudflare
async function fetchWithProxy(url: string, options: any = {}) {
  if (!CF_WORKER_PROXY || CF_WORKER_PROXY.includes("URL_WORKER")) {
    console.warn("[PROXY] URL Worker belum diisi. Mencoba direct...");
    return fetchWithTimeout(url, options);
  }

  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(url)}`;
  console.log(`[PROXY] Routing via Cloudflare: ${url}`);
  
  // Kirim ke proxy dengan header yang bersih
  return fetchWithTimeout(proxyUrl, {
    method: options.method || "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
    body: options.body
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });

    // Sanitasi URL (Hapus tracking)
    try {
      if (url.includes("instagram.com") || url.includes("tiktok.com")) {
        const urlObj = new URL(url);
        url = `${urlObj.origin}${urlObj.pathname}`;
      }
    } catch (e) {}

    const isTiktok = url.includes("tiktok.com") || url.includes("vt.tiktok");
    const isInstagram = url.includes("instagram.com");
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    };

    console.log(`[PROCESS] Hybrid Extraction: ${url}`);

    // 1. TIKTOK PRIORITY (TikWM via Proxy)
    if (isTiktok) {
      try {
        const res = await fetchWithProxy(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { headers });
        const d = await res.json();
        if (d.code === 0 && d.data) {
          return NextResponse.json({
            status: "success",
            url: d.data.play,
            title: d.data.title || "TikTok Video",
            source: "TikWM Cloud Protocol",
            picker: [
              { url: d.data.play, type: "video", quality: "HD (No Watermark)", extension: "mp4" },
              { url: d.data.wmplay, type: "video", quality: "Watermark", extension: "mp4" },
              { url: d.data.music, type: "audio", quality: "Music Only", extension: "mp3" }
            ]
          });
        }
      } catch (e) { console.warn("[TIKTOK] Failed via Proxy"); }
    }

    // 2. INSTAGRAM PRIORITY (Chocomilk via Proxy)
    if (isInstagram) {
      try {
        const cocoRes = await fetchWithProxy(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, { headers });
        if (cocoRes.ok) {
          const d = await cocoRes.json();
          const data = d.data || d.result || d;
          const mediaUrl = data.url || (Array.isArray(data) ? data[0]?.url : null);
          if (mediaUrl) {
            return NextResponse.json({
              status: "success",
              url: mediaUrl,
              title: data.title || "Instagram Content",
              source: "Chocomilk Cloud Protocol",
              picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e) { console.warn("[INSTAGRAM] Failed via Proxy"); }
    }

    // 3. YOUTUBE PRIORITY (Ryzumi Specialized via Proxy)
    if (isYoutube) {
      try {
        const res = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/ytmp4?url=${encodeURIComponent(url)}`, { headers });
        if (res.ok) {
          const d = await res.json();
          if (d.videoUrl) {
            return NextResponse.json({
              status: "success",
              url: d.videoUrl,
              title: d.title || "YouTube Video",
              source: "Ryzumi YT Cloud Protocol",
              picker: [
                { url: d.videoUrl, type: "video", quality: "720p", extension: "mp4" },
                { url: d.audioUrl, type: "audio", quality: "Audio Only", extension: "mp3" }
              ]
            });
          }
        }
      } catch (e) { console.warn("[YOUTUBE] Failed via Proxy"); }
    }

    // 4. UNIVERSAL FALLBACK (Ryzumi AIO via Proxy)
    try {
      const ryzumiRes = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, { headers });
      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
          return NextResponse.json({
            status: "success",
            url: data.medias[0].url,
            title: data.title || "Universal Result",
            source: "Ryzumi AIO Cloud Protocol",
            picker: data.medias.map((m: any) => ({ 
              url: m.url, 
              type: m.type || "video", 
              quality: m.quality || "HD", 
              extension: m.extension || "mp4" 
            }))
          });
        }
      }
    } catch (e) { console.warn("[UNIVERSAL] Failed via Proxy"); }

    return NextResponse.json({ 
      status: "error", 
      text: "Semua jalur Cloudflare gagal. Coba cek status server atau gunakan link lain." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRITICAL_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Terjadi kesalahan internal pada protokol cloud." }, { status: 500 });
  }
}
