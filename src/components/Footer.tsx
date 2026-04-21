"use client"

import { useTranslation } from "react-i18next"
import Link from "next/link"

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="py-12 px-4 border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="font-bold">Downloader</span>
        </div>

        <div className="text-sm text-muted-foreground text-center md:text-left">
          © {year} Social Downloader. {t("footer.rights")}
        </div>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/terms" className="hover:text-blue-500 transition-colors">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="hover:text-blue-500 transition-colors">
            {t("footer.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  )
}
