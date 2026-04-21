"use client"

import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

const steps = [
  { id: "01", key: "step1" },
  { id: "02", key: "step2" },
  { id: "03", key: "step3" },
]
export function TutorialSection() {
  const tutorialSteps = [
    {
      id: "01",
      title: "Copy Link from Social Media.",
      description: "Open the social media app and copy the URL of the video or image you wish to download.",
    },
    {
      id: "02",
      title: "Paste URL into the input field.",
      description: "Go back to HINDIA and paste the link into the search bar at the top of the page.",
    },
    {
      id: "03",
      title: "Select quality and start downloading.",
      description: "Choose your preferred quality and format, then click download to save the media to your device.",
    },
  ]

  return (
    <section className="py-32 px-6 bg-background relative overflow-hidden">
      {/* Decorative Text background */}
      <div className="absolute top-20 right-0 text-[20vw] font-serif font-bold opacity-[0.02] select-none pointer-events-none">
        GUIDE
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="space-y-24 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[2.2rem] md:left-[3.2rem] top-10 bottom-10 w-px bg-border opacity-20" />

          {tutorialSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.2 }}
              className="relative flex items-start gap-8 md:gap-16 group"
            >
              {/* Step Number */}
              <div className="relative z-10 shrink-0">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-none border border-border bg-background flex items-center justify-center group-hover:bg-accent transition-all duration-700">
                  <span className="text-3xl md:text-5xl font-serif group-hover:text-white transition-colors">
                    {step.id}
                  </span>
                </div>
              </div>

              {/* Step Content */}
              <div className="pt-4 md:pt-8 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-[0.4em] opacity-40">
                  Tutorial Step {step.id}
                </h3>
                <h4 className="text-2xl md:text-4xl font-serif max-w-md leading-tight">
                  {step.title}
                </h4>
                <p className="text-sm md:text-base font-mono opacity-60 leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
