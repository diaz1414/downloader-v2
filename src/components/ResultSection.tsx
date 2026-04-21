"use client"

import { motion } from "framer-motion"
import { Download, Film, Music, Globe, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResultData {
  status: string
  url?: string
  title?: string
  thumbnail?: string
  source?: string
  author?: { name?: string; username?: string }
  picker?: Array<{ url: string; type: string; quality?: string; extension?: string }>
}

export function ResultSection({ data }: { data: ResultData | null }) {
  if (!data) return null

  // Find if there is a video URL in the picker for preview
  const videoPreviewUrl = data.picker?.find(item => item.type === "video")?.url || (data.status === "stream" ? data.url : null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mt-12 md:mt-20 w-full max-w-5xl mx-auto px-4 md:px-6 pb-24"
    >
      <div className="doc-container border-2 relative overflow-hidden p-4 md:p-12">
        {/* Subtle Background Mark */}
        <div className="absolute top-0 right-0 p-4 font-mono text-[8px] opacity-10 pointer-events-none select-none">
          SYSTEM_RESULT_LOG // {new Date().toISOString()}
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
          
          {/* Media Identification (Left Side) */}
          <div className="w-full lg:w-96 shrink-0 space-y-4">
            <div className="relative aspect-[3/4] md:aspect-square bg-black border border-border group overflow-hidden shadow-2xl">
              {videoPreviewUrl ? (
                <video 
                  src={videoPreviewUrl}
                  poster={data.thumbnail}
                  controls
                  className="w-full h-full object-contain"
                  controlsList="nodownload"
                />
              ) : data.thumbnail ? (
                <img 
                  src={data.thumbnail} 
                  alt="Archive Preview" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                />
              ) : (
                <div className="w-full h-full bg-accent/5 flex flex-col items-center justify-center gap-4">
                  <Film className="w-12 h-12 opacity-20" />
                  <span className="text-[10px] font-mono opacity-30 uppercase tracking-widest">No Visual Stream</span>
                </div>
              )}
              
              <div className="absolute top-4 left-4 p-2 bg-background/90 backdrop-blur-sm border border-border z-10">
                <p className="text-[8px] font-mono font-bold uppercase tracking-widest leading-none">Preview Mode</p>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
                <Globe className="w-3 h-3" />
                {data.source || "External Platform"}
              </span>
              <div className="h-px bg-border flex-1 mx-4 opacity-20" />
              <span className="text-[10px] font-mono opacity-40">INTEGRITY: 100%</span>
            </div>
          </div>

          {/* Document Details (Right Side) */}
          <div className="flex-1 space-y-10 w-full">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-serif leading-[1.1] tracking-tight">
                {data.title || "Unidentified Media Record"}
              </h2>
              
              <div className="flex flex-wrap gap-6 items-center">
                {data.author && (
                  <div className="flex items-center gap-3 py-2 px-4 bg-accent/5 border border-border/50 text-[10px] font-mono uppercase tracking-[0.2em]">
                    <User className="w-3.5 h-3.5 text-accent" />
                    <span className="opacity-50">Creator:</span>
                    <span className="font-bold">{data.author.name || data.author.username || "Anonymous"}</span>
                  </div>
                )}
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Ready for Download</span>
              </div>
            </div>

            <div className="h-px bg-border opacity-20" />

            {/* Retrieval Options */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-accent font-bold">Output Protocols</p>
                <div className="h-px bg-accent/30 flex-1" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.picker ? (
                  data.picker.map((item, index) => (
                    <Button 
                      key={index}
                      asChild
                      variant="outline"
                      className="cursor-download h-20 rounded-none justify-between px-8 border-border hover:border-accent hover:bg-accent/5 transition-all duration-300 group relative overflow-hidden"
                    >
                      <a href={item.url} target="_blank" rel="noreferrer" download>
                        <div className="flex flex-col items-start gap-1 relative z-10">
                          <span className="text-xs font-bold uppercase tracking-widest group-hover:text-accent transition-colors">
                            {item.quality || "Archive Stream"}
                          </span>
                          <span className="text-[9px] opacity-40 uppercase font-mono group-hover:opacity-60">
                            {item.extension || item.type} • Protocol Secured
                          </span>
                        </div>
                        {item.type === "audio" ? 
                          <Music className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-accent transition-all" /> : 
                          <Download className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:text-accent transition-all" />
                        }
                        <div className="absolute inset-y-0 left-0 w-1 bg-accent transform -translate-x-full group-hover:translate-x-0 transition-transform" />
                      </a>
                    </Button>
                  ))
                ) : data.url ? (
                  <Button 
                    asChild
                    className="cursor-download h-20 w-full rounded-none bg-accent text-white hover:bg-accent/90 shadow-xl shadow-accent/20"
                  >
                    <a href={data.url} target="_blank" rel="noreferrer" download>
                      <Download className="w-5 h-5 mr-4" />
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-sm font-bold tracking-widest uppercase">Fetch Stream</span>
                        <span className="text-[9px] opacity-60 uppercase mt-1">Direct Extraction Protocol</span>
                      </div>
                    </a>
                  </Button>
                ) : (
                  <div className="col-span-full py-8 text-center border border-dashed border-border opacity-40 font-mono text-xs">
                    ARCHIVE_FETCH_ERROR: NO_STREAMS_FOUND
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Footer of the Card */}
        <div className="mt-16 pt-8 border-t border-border border-dashed flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-mono uppercase opacity-30 tracking-[0.2em]">
          <div className="flex flex-wrap justify-center gap-6">
            <span>Record ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
            <span>Integrity: Verified</span>
            <span>Access Level: Universal</span>
          </div>
          <div className="flex items-center gap-2 text-accent opacity-100 font-bold bg-accent/5 py-1 px-3 border border-accent/20">
            PROCEED TO LOCAL STORAGE <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
