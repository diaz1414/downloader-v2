"use client"

import { Navbar } from "@/components/Navbar"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl font-serif tracking-tighter uppercase">Legal Mandate.</h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-40">Operational Terms // Rev. 2026.04</p>
          </div>

          <div className="h-px bg-border opacity-20" />

          <div className="space-y-12">
            {[
              {
                title: "01 // Acceptable Use",
                content: "By accessing DIAW DOWNLOADER V2, you agree to use this service only for lawful purposes. You are prohibited from using this service to extract content that violates copyright laws or the terms of service of the source platforms."
              },
              {
                title: "02 // Service Warranty",
                content: "Our service is provided 'as-is' without any warranties. We do not guarantee 100% uptime or successful extraction for every link, as source platforms frequently update their security protocols."
              },
              {
                title: "03 // Intellectual Property",
                content: "DIAW DOWNLOADER does not claim ownership of any content extracted through our service. All rights remain with the original creators and source platforms. You are responsible for ensuring you have the right to download and use the content."
              },
              {
                title: "04 // Liability Limitation",
                content: "In no event shall DIAW DOWNLOADER or its developers be liable for any damages arising out of the use or inability to use the services provided."
              }
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-accent">{item.title}</h2>
                <p className="text-sm font-mono opacity-60 leading-loose max-w-3xl">
                  {item.content}
                </p>
              </div>
            ))}
          </div>

          <div className="doc-container border-2 border-dashed border-border opacity-50 p-8 text-center font-mono text-[9px] uppercase tracking-widest">
            Failure to comply with these terms may result in the termination of access to the extraction protocol.
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
