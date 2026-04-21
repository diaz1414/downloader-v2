import { NextResponse } from "next/server";

export const runtime = "nodejs";

// !!! GANTI DENGAN URL CLOUDFLARE WORKER ANDA !!!
const CF_WORKER_PROXY = "https://codai-proxy.ferdiazprasida.workers.dev";

// Extended timeout
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 30000 } = options;
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

// Proxy Wrapper (Using Personal Cloudflare Worker)
async function fetchWithProxy(url, options = {}) {
  if (!CF_WORKER_PROXY || CF_WORKER_PROXY.includes("URL_WORKER_ANDA")) {
    console.warn("[PROXY_PROTOCOL] Cloudflare Worker URL belum diisi. Mencoba CodeTabs sebagai cadangan...");
    const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
    return fetchWithTimeout(codetabsUrl, options);
  }
  
  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(url)}`;
  console.log(`[PROXY_PROTOCOL] Proxying via Cloudflare Worker to: ${url}`);
  return fetchWithTimeout(proxyUrl, options);
}

export async function POST(req) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });

    // Clean URL
    try {
      if (url.includes("instagram.com") || url.includes("tiktok.com")) {
        const urlObj = new URL(url);
        url = `${urlObj.origin}${urlObj.pathname}`;
      }
    } catch (e) {
      console.warn("URL Parsing failed");
    }

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isTiktok = url.includes("tiktok.com");
    const isInstagram = url.includes("instagram.com");

    // Browser headers + IP Spoofing attempt
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "X-Forwarded-For": Array.from({length: 4}, () => Math.floor(Math.random() * 255)).join('.'),
    };

    console.log(`[HYBRID_PROTOCOL] [JS_VERSION] Processing: ${url}`);

    // 1. INSTAGRAM PRIORITY (Chocomilk)
    if (isInstagram) {
      try {
        console.log("[HYBRID_PROTOCOL] Trying Chocomilk (Direct)...");
        let cocoRes = await fetchWithTimeout(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, { headers, timeout: 10000 });
        
        // Fallback to Proxy if Direct fails or blocks
        if (!cocoRes.ok || cocoRes.status === 403) {
          console.log("[HYBRID_PROTOCOL] Chocomilk Direct Blocked, trying Proxy...");
          cocoRes = await fetchWithProxy(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`, { headers });
        }

        if (cocoRes.ok) {
          const d = await cocoRes.json();
          const data = d.data || d.result || d;
          const mediaUrl = data.url || (Array.isArray(data) ? data[0]?.url : null);
          if (mediaUrl) {
            return NextResponse.json({
              status: "stream",
              url: mediaUrl,
              title: data.title || "Instagram Content",
              source: "Instagram (Chocomilk + Proxy)",
              picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
            });
          }
        }
      } catch (e) { console.warn("Chocomilk Failed even with Proxy"); }
    }

    // 2. COBALT PROTOCOL (Universal)
    try {
      console.log("[HYBRID_PROTOCOL] Trying Cobalt...");
      const cobaltRes = await fetchWithTimeout("https://api.cobalt.tools/api/json", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ url, videoQuality: "720" }),
        timeout: 20000
      });
      if (cobaltRes.ok) {
        const d = await cobaltRes.json();
        if (d.status === "stream" || d.status === "redirect") {
          return NextResponse.json({
            status: "stream",
            url: d.url,
            title: d.filename || "Extracted Media",
            source: "Cobalt Protocol",
            picker: [{ url: d.url, type: "video", quality: "HD", extension: "mp4" }]
          });
        }
      }
    } catch (e) { console.warn("Cobalt Failed"); }

    // 3. RYZUMI AIO (Universal Fallback)
    try {
      console.log("[HYBRID_PROTOCOL] Trying Ryzumi AIO (Direct)...");
      let ryzumiRes = await fetchWithTimeout(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
        headers: { ...headers, "Referer": "https://ryzumi.net/" },
        timeout: 15000
      });

      // Fallback to Proxy for Ryzumi
      if (!ryzumiRes.ok || ryzumiRes.status === 403) {
        console.log("[HYBRID_PROTOCOL] Ryzumi Blocked, trying Proxy...");
        ryzumiRes = await fetchWithProxy(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`, {
          headers: { ...headers, "Referer": "https://ryzumi.net/" }
        });
      }

      if (ryzumiRes.ok) {
        const data = await ryzumiRes.json();
        if (data && data.medias && data.medias.length > 0) {
          return NextResponse.json({
            status: "stream",
            url: data.medias[0].url,
            title: data.title || "Universal Result",
            source: "Ryzumi AIO + Proxy",
            picker: data.medias.map(m => ({ url: m.url, type: m.type || "video", quality: m.quality || "HD", extension: m.extension || "mp4" }))
          });
        }
      }
    } catch (e) { console.warn("Ryzumi Failed even with Proxy"); }

    return NextResponse.json({
      status: "error",
      text: "Maaf, semua protokol (Chocomilk, Cobalt, Ryzumi) gagal. Link mungkin privat atau server sedang sibuk."
    }, { status: 200 });

  } catch (error) {
    console.error("[CRITICAL_ERROR]", error);
    return NextResponse.json({ status: "error", text: "Protokol Kritis Gagal (JS)." }, { status: 500 });
  }
}
