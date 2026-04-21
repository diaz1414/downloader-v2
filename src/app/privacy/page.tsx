"use client"

import { Navbar } from "@/components/Navbar"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl font-serif tracking-tighter uppercase">Privacy Protocol.</h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-40">Last Revised: April 2026 // DIAW-PROTOCOL-001</p>
          </div>

          <div className="h-px bg-border opacity-20" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-accent">01 // Data Collection</h2>
              <p className="text-sm font-mono opacity-60 leading-loose">
                We do not collect personal information. Our system operates on a "Pass-Through" architecture where media is fetched directly from source platforms to your device.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-accent">02 // Log Policy</h2>
              <p className="text-sm font-mono opacity-60 leading-loose">
                No IP addresses, search queries, or extraction links are stored on our servers. The extraction occurs in a stateless environment.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-accent">03 // Third Parties</h2>
              <p className="text-sm font-mono opacity-60 leading-loose">
                We do not share data with third parties because we have no data to share. Your privacy is guaranteed by our system design.
              </p>
            </div>
          </div>

          <div className="doc-container space-y-8 bg-accent/5">
            <h3 className="text-2xl font-serif">Comprehensive Disclosure</h3>
            <div className="space-y-6 text-sm font-mono opacity-50 leading-relaxed">
              <p>
                DIAW DOWNLOADER is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, then you can be assured that it will only be used in accordance with this privacy statement.
              </p>
              <p>
                What we don't do: We don't ask you for personal information unless we truly need it. We don't share your personal information with anyone except to comply with the law, develop our products, or protect our rights. We don't store personal information on our servers unless required for the on-going operation of one of our services.
              </p>
              <p>
                Cookies: Our website may use "cookies" to enhance User experience. User's web browser places cookies on their hard drive for record-keeping purposes and sometimes to track information about them. User may choose to set their web browser to refuse cookies, or to alert you when cookies are being sent. If they do so, note that some parts of the Site may not function properly.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Copy */}
      <footer className="py-20 px-6 border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="space-y-6">
            <h2 className="text-4xl font-serif">DIAW DOWNLOADER V2</h2>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 max-w-xs leading-loose">
              The ultimate tool for high-quality social media content extraction. <br />
              Safe, fast, and private. No tracking. No logs.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-8 text-[10px] font-mono font-bold uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-accent transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-accent transition-colors">Support</Link>
            <span className="opacity-20">© 2026 DIAW DOWNLOADER V2</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
