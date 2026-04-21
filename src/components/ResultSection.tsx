"use client"

import { motion } from "framer-motion"
import { Download, Film, Music, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResultData {
  status: string
  url?: string
  picker?: Array<{ url: string; type: string }>
  text?: string
}

export function ResultSection({ data }: { data: ResultData | null }) {
  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-12 w-full max-w-4xl mx-auto"
    >
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-500" />
          Ready to Download
        </h2>

        {data.url && (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl">
            <div className="w-full md:w-48 aspect-video bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <Film className="w-10 h-10 text-muted-foreground" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <p className="font-semibold text-lg mb-4 truncate max-w-xs">
                Media Content
              </p>
              <div className="flex wrap gap-3 justify-center md:justify-start">
                <Button asChild className="rounded-full px-8 bg-blue-600 hover:bg-blue-700">
                  <a href={data.url} target="_blank" rel="noreferrer">
                    Download HD (MP4)
                  </a>
                </Button>
                <Button variant="outline" className="rounded-full">
                  <Music className="w-4 h-4 mr-2" />
                  MP3 Audio
                </Button>
              </div>
            </div>
          </div>
        )}

        {data.picker && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
            {data.picker.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                  <Button size="sm" variant="secondary" className="rounded-full w-full" asChild>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      Download
                    </a>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
