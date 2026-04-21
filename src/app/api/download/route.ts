import { NextResponse } from "next/server"
import axios from "axios"

// List of community instances for fallback
const COBALT_INSTANCES = [
  "https://api.cobalt.tools/", // Official (Strict)
  "https://cobalt-backend.canine.tools/",
  "https://cobalt-api.meowing.de/",
  "https://capi.3kh0.net/",
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 })
    }

    console.log("Processing URL:", url)

    let lastError = ""

    // Try each instance until one works
    for (const instance of COBALT_INSTANCES) {
      try {
        console.log(`Trying Cobalt instance: ${instance}`)
        const response = await axios.post(instance, {
          url: url,
          vQuality: "720",
          vCodec: "h264",
          filenameStyle: "pretty",
        }, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          timeout: 8000 // 8 second timeout per instance
        })

        if (response.data && (response.data.url || response.data.picker)) {
          console.log(`Success with instance: ${instance}`)
          return NextResponse.json(response.data)
        }

        if (response.data.status === "error") {
          lastError = response.data.text || response.data.message
          console.warn(`Instance ${instance} returned error: ${lastError}`)
        }
      } catch (err: any) {
        lastError = err?.response?.data?.text || err?.response?.data?.message || err.message
        console.warn(`Instance ${instance} failed: ${lastError}`)
        // Continue to next instance
      }
    }

    // If all instances failed
    return NextResponse.json({ 
      status: "error", 
      text: lastError || "All public servers are currently busy or restricted. Please try again later or use a different link." 
    }, { status: 200 })

  } catch (error: any) {
    console.error("Internal Server Error:", error.message)
    return NextResponse.json(
      { status: "error", text: "Internal server error" },
      { status: 500 }
    )
  }
}
