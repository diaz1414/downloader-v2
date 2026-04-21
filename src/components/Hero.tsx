"use client"

import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { SmartSearchBar } from "@/components/SmartSearchBar"

export function Hero({ onResult }: { onResult: (data: any) => void }) {
  const { t } = useTranslation()

  return (
    <section className="relative pt-32 pb-20 px-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span className="text-gradient">{t("hero.title")}</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10">
          {t("hero.subtitle")}
        </p>

        <SmartSearchBar onResult={onResult} />
      </motion.div>
    </section>
  )
}
