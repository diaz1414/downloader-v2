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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 100 }}
      className="mt-20 w-full max-w-5xl mx-auto px-6 pb-24"
    >
      <div className="doc-container border-2">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* Media Identification */}
          <div className="w-full md:w-80 shrink-0">
            <div className="relative aspect-square border border-border group overflow-hidden">
              {data.thumbnail ? (
                <img 
                  src={data.thumbnail} 
                  alt="Archive Preview" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                />
              ) : (
                <div className="w-full h-full bg-border/10 flex items-center justify-center">
                  <Film className="w-12 h-12 opacity-20" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  Source: {data.source || "External Archive"}
                </span>
              </div>
            </div>
          </div>

          {/* Document Details */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-serif leading-tight">
                {data.title || "Unidentified Media Record"}
              </h2>
              {data.author && (
                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] opacity-50">
                  <User className="w-4 h-4" />
                  Creator: {data.author.name || data.author.username}
                </div>
              )}
            </div>

            <div className="h-px bg-border opacity-10" />

            {/* Retrieval Options */}
            <div className="space-y-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-accent">Output Protocols</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.picker ? (
                  data.picker.map((item, index) => (
                    <Button 
                      key={index}
                      asChild
                      variant="outline"
                      className="cursor-download h-16 rounded-none justify-between px-6 border-border hover:bg-accent hover:text-white transition-all duration-500 group"
                    >
                      <a href={item.url} target="_blank" rel="noreferrer" download>
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-bold uppercase tracking-widest">{item.quality || "Archive"}</span>
                          <span className="text-[9px] opacity-50 uppercase">{item.extension || item.type} format</span>
                        </div>
                        {item.type === "audio" ? <Music className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      </a>
                    </Button>
                  ))
                ) : data.url ? (
                  <Button 
                    asChild
                    className="cursor-download h-16 w-full rounded-none bg-accent text-white hover:bg-accent/90"
                  >
                    <a href={data.url} target="_blank" rel="noreferrer" download>
                      <Download className="w-4 h-4 mr-3" />
                      FETCH DATA STREAM
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Footer of the Card */}
        <div className="mt-12 pt-6 border-t border-border border-dashed flex flex-wrap gap-6 text-[9px] font-mono uppercase opacity-30 tracking-[0.2em]">
          <span>Record ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
          <span>Integrity: Verified</span>
          <span>Access Level: Universal</span>
          <span className="ml-auto flex items-center gap-2">
            Proceed to Save <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}
