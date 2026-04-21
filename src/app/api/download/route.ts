import { NextResponse } from "next/server";

export const runtime = "edge";

const CF_WORKER_PROXY = "https://raspy-limit-7890.ferdiazprasida.workers.dev";

async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 8000 } = options;
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

// Fungsi Cerdas: Mencoba lewat Proxy, jika gagal/timeout, sistem lanjut ke API berikutnya
async function tryFetch(targetUrl: string) {
  const proxyUrl = `${CF_WORKER_PROXY}/?url=${encodeURIComponent(targetUrl)}&t=${Date.now()}`;
  return fetchWithTimeout(proxyUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
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

    // --- 1. JALUR COBALT (MESIN PALING STABIL) ---
    const cobaltMirrors = ["https://api.cobalt.tools/api/json", "https://cobalt-api.meowing.de/api/json"];
    for (const mirror of cobaltMirrors) {
      try {
        const res = await fetchWithTimeout(mirror, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ url, vQuality: "720", isNoTTWatermark: true })
        });
        const d = await res.json();
        if (d.url) return NextResponse.json({
          status: "success", url: d.url, title: "Media Result", source: "Cobalt Engine",
          picker: [{ url: d.url, type: "video", quality: "HD", extension: "mp4" }]
        });
      } catch (e) { }
    }

    // --- 2. JALUR TIKTOK (TikWM via Cloudflare) ---
    if (isTiktok) {
      try {
        const res = await tryFetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const d = await res.json();
        if (d.data) return NextResponse.json({
          status: "success", url: d.data.play, title: d.data.title, source: "TikTok Engine",
          picker: [{ url: d.data.play, type: "video", quality: "HD", extension: "mp4" }]
        });
      } catch (e) { }
    }

    // --- 3. JALUR INSTAGRAM (Chocomilk via Cloudflare) ---
    if (isInstagram) {
      try {
        const res = await tryFetch(`https://chocomilk.amira.us.kg/v1/download/instagram?url=${encodeURIComponent(url)}`);
        const d = await res.json();
        const data = d.data || d.result;
        const mediaUrl = data?.url || (Array.isArray(data) ? data[0]?.url : null);
        if (mediaUrl) return NextResponse.json({
          status: "success", url: mediaUrl, title: "Instagram Content", source: "IG Engine",
          picker: [{ url: mediaUrl, type: "video", quality: "HD", extension: "mp4" }]
        });
      } catch (e) { }
    }

    // --- 4. JALUR CADANGAN TERAKHIR (Ryzumi AIO via Cloudflare) ---
    try {
      const res = await tryFetch(`https://api.ryzumi.net/api/downloader/all-in-one?url=${encodeURIComponent(url)}`);
      const d = await res.json();
      if (d.medias && d.medias.length > 0) return NextResponse.json({
        status: "success", url: d.medias[0].url, title: d.title, source: "Universal Engine",
        picker: d.medias.map((m: any) => ({ url: m.url, type: m.type, quality: m.quality, extension: m.extension }))
      });
    } catch (e) { }

    return NextResponse.json({
      status: "error",
      text: "Semua mesin (Cobalt, TikWM, Chocomilk, Ryzumi) sedang sibuk. Link mungkin privat atau server sedang membatasi akses."
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: "Protokol Error." }, { status: 500 });
  }
}
