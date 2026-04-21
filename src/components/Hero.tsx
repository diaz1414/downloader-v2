"use client"

import { motion, Variants } from "framer-motion"
import { useTranslation } from "react-i18next"
import { SmartSearchBar } from "./SmartSearchBar"

const staggeredVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1] as const,
    },
  }),
}

export function Hero({ onResult }: { onResult: (data: any) => void }) {
  const { t } = useTranslation()
  const title = "Professional Media Downloader"

  return (
    <section className="relative pt-40 pb-20 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center space-y-12">
        
        {/* Editorial Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-7xl font-serif tracking-tight leading-[1.1] uppercase">
            HINDIA // <br className="md:hidden" />
            <span className="opacity-50">High-Speed</span> <br />
            Media Downloader
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xs md:text-sm font-mono uppercase tracking-[0.2em] opacity-60 max-w-2xl mx-auto leading-relaxed"
          >
            All-in-One Social Media Downloader. <br />
            Extract high-quality videos and images from TikTok, Instagram, YouTube, and more with zero tracking.
          </motion.p>
        </div>

        {/* Search Field */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <SmartSearchBar onResult={onResult} />
        </motion.div>
      </div>
    </section>
  )
}
