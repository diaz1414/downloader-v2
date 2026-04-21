"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import Link from "next/link"
import { Mail, MessageSquare, X, Globe, ArrowUpRight } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-20">
          
          {/* Header Section */}
          <section className="space-y-8">
            <h1 className="text-5xl md:text-8xl font-serif tracking-tighter leading-none uppercase">
              System <br />
              Support.
            </h1>
            <div className="h-px bg-border opacity-20 w-full" />
            <p className="text-sm md:text-base font-mono uppercase tracking-[0.3em] opacity-60 leading-relaxed max-w-2xl">
              Facing technical difficulties or have inquiries about our extraction protocol? Our support channels are open for institutional and individual queries.
            </p>
          </section>

          {/* Contact Channels Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Electronic Mail",
                value: "support@diaw.io",
                icon: Mail,
                desc: "Official channel for system bug reports and API inquiries."
              },
              {
                title: "Live Terminal",
                value: "t.me/diaw_support",
                icon: MessageSquare,
                desc: "Direct communication for rapid troubleshooting."
              },
              {
                title: "Social Network",
                value: "@diaw_downloader",
                icon: X,
                desc: "Follow us for status updates and protocol upgrades."
              },
              {
                title: "Global Headquarters",
                value: "Jakarta, Indonesia",
                icon: Globe,
                desc: "The heart of our system development."
              }
            ].map((channel, i) => (
              <div key={i} className="doc-container hover:bg-accent/5 transition-colors group">
                <div className="flex items-start justify-between mb-8">
                  <div className="p-3 bg-accent/10 border border-accent/20">
                    <channel.icon className="w-5 h-5 text-accent" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-[0.4em] opacity-40">{channel.title}</h3>
                  <p className="text-xl font-serif">{channel.value}</p>
                  <p className="text-[10px] font-mono opacity-50 pt-4 leading-loose">{channel.desc}</p>
                </div>
              </div>
            ))}
          </section>

          {/* FAQ Link or Contact Form Suggestion */}
          <section className="p-12 border border-border/20 text-center space-y-6">
            <p className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-40">Operational Status: 24/7 Active</p>
            <p className="text-sm font-mono opacity-60 max-w-lg mx-auto">
              Our automated systems handle millions of extractions daily. For real-time status updates, please check our GitHub repository.
            </p>
          </section>
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
