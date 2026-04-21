"use client"

import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { SiInstagram, SiTiktok, SiYoutube, SiX, SiPinterest, SiSoundcloud } from "@icons-pack/react-simple-icons"

const platforms = [
  { icon: SiInstagram, name: "Instagram", color: "#E4405F" },
  { icon: SiTiktok, name: "TikTok", color: "#000000" },
  { icon: SiYoutube, name: "YouTube", color: "#FF0000" },
  { icon: SiX, name: "Twitter/X", color: "#000000" },
  { icon: SiPinterest, name: "Pinterest", color: "#BD081C" },
  { icon: SiSoundcloud, name: "SoundCloud", color: "#FF3300" },
]

export function FeatureGrid() {
  const { t } = useTranslation()

  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-serif leading-none">Supported Platforms.</h2>
            <p className="text-sm font-mono uppercase tracking-[0.3em] opacity-50">Universal High-Speed Extraction Ready</p>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-30 text-right">
            Total Integrated Systems: 06 // Active
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-border p-8 flex flex-col items-center justify-center gap-6 group hover:bg-accent hover:text-white transition-all duration-500 cursor-help"
            >
              <platform.icon 
                className="w-10 h-10 grayscale group-hover:grayscale-0 transition-all group-hover:scale-110" 
              />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">{platform.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
