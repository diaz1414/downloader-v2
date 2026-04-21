import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto glass-card p-8 md:p-12">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose dark:prose-invert space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">1. No Data Storage</h2>
              <p>
                We do not store any of the media files you download. The extraction process is performed in real-time, and we do not keep logs of the URLs you process.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">2. Cookies</h2>
              <p>
                We use minimal cookies for essential functionality, such as remembering your theme preference (Dark/Light Mode) and language selection.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">3. Third-Party Services</h2>
              <p>
                We may use third-party APIs (like Cobalt.tools) to process your requests. These services have their own privacy policies which you should review.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">4. User Information</h2>
              <p>
                We do not collect personal information like names, emails, or IP addresses for marketing purposes.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
