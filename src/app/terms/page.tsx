import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto glass-card p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-8">Terms of Use</h1>
          
          <div className="prose dark:prose-invert space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">1. Educational Purpose</h2>
              <p>
                Social Downloader is provided for educational and personal use only. We do not encourage or condone the use of our service to download copyrighted material without the owner's permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">2. Responsibility</h2>
              <p>
                The user is solely responsible for the content they download. We do not host any of the media files on our servers; we only provide a technical service to extract media from public URLs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">3. Limitation of Liability</h2>
              <p>
                We are not liable for any misuse of our service or any legal consequences arising from the use of downloaded content. Use this tool at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">4. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time without prior notice.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
