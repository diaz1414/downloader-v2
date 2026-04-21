"use client"

import { motion, Variants, useScroll, useTransform } from "framer-motion"
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
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 100])

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 md:px-6 overflow-hidden">
      {/* Background Video Layer with Parallax */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-40 scale-110"
        >
          <source src="/videos/bg.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />
        <div className="absolute inset-0 bg-black/50 z-10" />
      </motion.div>

      <div className="max-w-6xl mx-auto text-center space-y-8 md:space-y-12 relative z-20 pt-20">
        
        {/* Editorial Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-7xl font-serif tracking-tight leading-[1.1] uppercase">
            {t("hero.title").split("//")[0]} // <br className="md:hidden" />
            <span className="opacity-50">{t("hero.title").split("//")[1]?.split(" ")[1]}</span> <br />
            {t("hero.title").split(" ").slice(-2).join(" ")}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xs md:text-sm font-mono uppercase tracking-[0.2em] opacity-60 max-w-2xl mx-auto leading-relaxed"
          >
            {t("hero.subtitle")}
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
