import { NextResponse } from "next/server"
import axios from "axios"

// List of community instances for fallback - Updated with high health instances
const COBALT_INSTANCES = [
  "https://cobalt-backend.canine.tools/",
  "https://cobalt-api.meowing.de/",
  "https://capi.3kh0.net/",
  "https://api.cobalt.tools/", // Official (Strict - as last resort)
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ status: "error", text: "URL is required" }, { status: 400 })
    }

    console.log("-----------------------------------")
    console.log("Processing URL:", url)

    let lastError = ""

    // Try each instance until one works
    for (const instance of COBALT_INSTANCES) {
      try {
        console.log(`Trying: ${instance}`)
        
        // Using a cleaner payload (only essential fields)
        const response = await axios.post(instance, {
          url: url,
          vQuality: "720",
          // Removed vCodec as some older instances might throw 400
        }, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          timeout: 10000 // 10 second timeout
        })

        if (response.data && (response.data.url || response.data.picker)) {
          console.log(`✅ SUCCESS with instance: ${instance}`)
          return NextResponse.json(response.data)
        }

        if (response.data.status === "error") {
          lastError = response.data.text || response.data.message || "Unknown error"
          console.warn(`⚠️ Instance ${instance} returned API error: ${lastError}`)
        }
      } catch (err: any) {
        lastError = err?.response?.data?.text || err?.response?.data?.message || err.message
        console.warn(`❌ Instance ${instance} failed: ${lastError}`)
        // Continue to next if it's a 400 or timeout
      }
    }

    // If all instances failed
    console.log("All instances exhausted.")
    return NextResponse.json({ 
      status: "error", 
      text: "Sorry, all download servers are currently busy or this link is restricted. Please try another link or platform." 
    }, { status: 200 })

  } catch (error: any) {
    console.error("Critical Internal Error:", error.message)
    return NextResponse.json(
      { status: "error", text: "Internal server error" },
      { status: 500 }
    )
  }
}
