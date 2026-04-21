import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) {
      return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 });
    }

    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");

    console.log("-----------------------------------");
    console.log(`Processing (${isYoutube ? "YouTube Specialized" : "Social"}):`, url);

    // 1. JIKA YOUTUBE: Gunakan endpoint khusus Ryzumi YTMP4
    if (isYoutube) {
      try {
        console.log("Trying Ryzumi YTMP4 specialized endpoint...");
        // Format: GET https://api.ryzumi.net/api/downloader/ytmp4?url=...
        const ytRes = await axios.get(`https://api.ryzumi.net/api/downloader/ytmp4`, {
          params: { url: url },
          timeout: 15000
        });

        const data = ytRes.data;
        // Ryzumi YTMP4 biasanya mengembalikan { title, videoUrl, thumbnail, duration }
        if (data && data.videoUrl) {
          console.log("✅ YT SUCCESS with Ryzumi YTMP4");
          return NextResponse.json({
            status: "stream",
            url: data.videoUrl,
            title: data.title || "YouTube Video",
            thumbnail: data.thumbnail,
            source: "YouTube",
            picker: [
              { url: data.videoUrl, type: "video", quality: "720p (Direct)", extension: "mp4" }
            ]
          });
        }
      } catch (err) {
        console.warn("Ryzumi YTMP4 failed, trying Cobalt fallback...");
      }

      // Fallback ke Cobalt jika Ryzumi YTMP4 gagal
      const YT_FALLBACKS = ["https://cobalt.canine.tools/api/json", "https://cobalt-api.meowing.de/api/json"];
      for (const instance of YT_FALLBACKS) {
        try {
          const res = await axios.post(instance, { url, vQuality: "720" }, { timeout: 8000 });
          if (res.data && (res.data.url || res.data.picker)) return NextResponse.json(res.data);
        } catch (e) { continue; }
      }
    }

    // 2. JIKA BUKAN YOUTUBE: Gunakan All-in-One Ryzumi (Sangat stabil untuk IG/TikTok)
    try {
      const ryzumiRes = await axios.get(`https://api.ryzumi.net/api/downloader/all-in-one`, {
        params: { url: url },
        timeout: 15000
      });

      const data = ryzumiRes.data;
      if (data && data.medias && data.medias.length > 0) {
        return NextResponse.json({
          status: "stream",
          url: data.medias[0].url,
          title: data.title,
          thumbnail: data.thumbnail,
          source: data.source,
          author: data.author,
          picker: data.medias.map((m: any) => ({
            url: m.url,
            type: m.type || "video",
            quality: m.quality || m.extension,
            extension: m.extension
          }))
        });
      }
    } catch (err: any) {
      console.error("All methods failed.");
    }

    return NextResponse.json({ 
      status: "error", 
      text: "Maaf, server pengunduh sedang sibuk. Silakan coba lagi nanti." 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ status: "error", text: "Sistem error." }, { status: 500 });
  }
}