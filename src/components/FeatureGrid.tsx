"use client"

import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { 
  SiTiktok, 
  SiYoutube, 
  SiInstagram, 
  SiX, 
  SiFacebook 
} from "@icons-pack/react-simple-icons"

const platforms = [
  { name: "TikTok", icon: SiTiktok, color: "#000000" },
  { name: "YouTube", icon: SiYoutube, color: "#FF0000" },
  { name: "Instagram", icon: SiInstagram, color: "#E4405F" },
  { name: "Twitter/X", icon: SiX, color: "#000000" },
  { name: "Facebook", icon: SiFacebook, color: "#1877F2" },
]

export function FeatureGrid() {
  const { t } = useTranslation()

  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">{t("features.title")}</h2>
        <p className="text-muted-foreground">{t("features.description")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="glass-card p-8 flex flex-col items-center justify-center gap-4 group cursor-pointer"
          >
            <platform.icon 
              className="w-12 h-12 transition-transform duration-300 group-hover:scale-110" 
              style={{ color: "currentColor" }}
            />
            <span className="font-semibold">{platform.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
