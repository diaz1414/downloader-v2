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
  const title = "Digital Extraction Document."

  return (
    <section className="relative pt-40 pb-20 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center space-y-12">
        
        {/* Editorial Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-8xl font-serif tracking-tight leading-[0.9]">
            {title.split(" ").map((word, wordIdx) => (
              <span key={wordIdx} className="inline-block whitespace-nowrap mr-4">
                {word.split("").map((char, charIdx) => (
                  <motion.span
                    key={charIdx}
                    custom={wordIdx * 5 + charIdx}
                    initial="hidden"
                    animate="visible"
                    variants={staggeredVariants}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-sm md:text-base font-mono uppercase tracking-[0.3em] opacity-60"
          >
            Universal Media Protocol // v10.4
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
