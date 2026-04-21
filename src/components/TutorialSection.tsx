"use client"

import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Copy, Link as LinkIcon, Download } from "lucide-react"

export function TutorialSection() {
  const { t } = useTranslation()

  const steps = [
    {
      id: 1,
      title: t("tutorial.step1.title"),
      desc: t("tutorial.step1.desc"),
      icon: Copy,
      color: "from-blue-500/20 to-blue-500/5",
    },
    {
      id: 2,
      title: t("tutorial.step2.title"),
      desc: t("tutorial.step2.desc"),
      icon: LinkIcon,
      color: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      id: 3,
      title: t("tutorial.step3.title"),
      desc: t("tutorial.step3.desc"),
      icon: Download,
      color: "from-purple-500/20 to-purple-500/5",
    },
  ]

  return (
    <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">{t("tutorial.title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative p-8 rounded-3xl glass-card overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${step.color} blur-2xl -z-10`} />
              
              <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <step.icon className="w-6 h-6 text-blue-500" />
              </div>

              <div className="text-4xl font-bold text-muted-foreground/10 absolute top-8 right-8">
                0{step.id}
              </div>

              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
