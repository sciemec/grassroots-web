import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";

const EFFECTIVE_DATE = "1 March 2026";
const CONTACT_EMAIL = "support@grassrootssports.live";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-green-950 text-white">
      <PublicNavbar />

      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-green-400 hover:text-white transition-colors mb-6">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-3 text-green-400">Effective date: {EFFECTIVE_DATE}</p>
          <p className="mt-2 text-sm text-green-500">
            We believe privacy is a right, not a feature. Here is exactly what we collect, why, and how we protect it.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-green-200">

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">1. Who This Policy Applies To</h2>
            <p>
              This Privacy Policy applies to all users of the Grassroots Sport Pro platform — players, coaches, scouts, fans,
              and administrators — whether using the web platform at grassrootssports.live or the Android mobile application.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">2. What Data We Collect</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">Account Information</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Full name, email address, phone number</li>
                  <li>Date of birth and age group</li>
                  <li>Sex, province (not GPS coordinates)</li>
                  <li>Role (player, coach, scout, fan)</li>
                  <li>Password (stored as a bcrypt hash — never readable)</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">Player Profile Data</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Playing position, school or club, preferred foot</li>
                  <li>Height and weight (optional)</li>
                  <li>Identity verification document type and AI confidence score (not the document image itself — images are deleted immediately after processing)</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">Training and Performance Data</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Session logs: drill scores, duration, focus area, overall performance score</li>
                  <li>Milestones achieved and XP earned</li>
                  <li>AI coaching conversation history (text only)</li>
                  <li>Pose detection data processed on-device — never uploaded to our servers</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">Video Uploads (Video Studio)</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Videos uploaded for AI analysis are sent to our secure Laravel backend</li>
                  <li>Videos are deleted from our servers within 24 hours of analysis</li>
                  <li>AI analysis results (text) are stored in your account</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">Usage Data</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Pages visited and features used (for improving the Platform)</li>
                  <li>Device type and operating system (for bug fixing)</li>
                  <li>Session timestamps and offline sync events</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">3. What We Do NOT Collect</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong className="text-white">GPS coordinates.</strong> We store province only — never precise location.</li>
              <li><strong className="text-white">Identity document images.</strong> We extract data from them and delete the image immediately.</li>
              <li><strong className="text-white">Camera frames.</strong> Pose detection runs fully on-device. Camera data is never sent to our servers.</li>
              <li><strong className="text-white">Payment card details.</strong> Payments are handled by EcoCash and InnBucks — we receive a transaction reference only.</li>
              <li><strong className="text-white">Biometric data.</strong> Pose landmarks are used for joint angle calculations only, then discarded.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">4. How We Use Your Data</h2>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-white">Purpose</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Legal basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {[
                    ["Running your account and providing platform features", "Contract performance"],
                    ["Generating AI coaching feedback from your training data", "Contract performance"],
                    ["Anonymised player profiles visible to approved scouts", "Legitimate interest + consent"],
                    ["Sending notifications about your sessions and achievements", "Consent"],
                    ["Improving AI models and platform features (aggregated, anonymised)", "Legitimate interest"],
                    ["Complying with ZIFA safeguarding reporting requirements", "Legal obligation"],
                    ["Fraud prevention and platform security", "Legitimate interest"],
                  ].map(([purpose, basis]) => (
                    <tr key={purpose} className="hover:bg-white/5">
                      <td className="px-4 py-3">{purpose}</td>
                      <td className="px-4 py-3 text-green-400">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">5. Who We Share Data With</h2>
            <p className="mb-3">We do not sell your data. We share it only in the following limited circumstances:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong className="text-white">Anthropic (Claude AI).</strong> Video and text content sent for AI analysis is processed by Claude. Anthropic&apos;s privacy policy applies. We do not send your name or identity to Claude — only anonymised content.</li>
              <li><strong className="text-white">ZIFA / Governing bodies.</strong> Aggregated, anonymised performance statistics may be shared with national sports governing bodies for talent development purposes. No personally identifiable data is shared without explicit consent.</li>
              <li><strong className="text-white">Approved scouts.</strong> Scouts who have been approved through our contact request process may view limited player profile data (initials, region, position, sport scores). Full identity is only shared after explicit player consent.</li>
              <li><strong className="text-white">Legal requirements.</strong> We will disclose data where required by Zimbabwean law or court order.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">6. Children&apos;s Privacy (Under 13 and Under 18)</h2>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="mb-2 font-semibold text-amber-300">Special protections for minors</p>
              <ul className="ml-4 list-disc space-y-2">
                <li>Users under 13 must have verifiable parental/guardian consent to register.</li>
                <li>Players under 18 are shown to scouts as initials + region only until admin-approved contact.</li>
                <li>We never display the school name, club, or precise location of minors publicly.</li>
                <li>Guardians may request deletion of a minor&apos;s account and all associated data at any time by emailing <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a>.</li>
                <li>We log all scout contact requests involving minors for safeguarding audit purposes.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">7. Data Retention</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong className="text-white">Active accounts:</strong> Data retained for the life of the account.</li>
              <li><strong className="text-white">Deleted accounts:</strong> Personal data deleted within 30 days. Anonymised aggregated data (e.g. &quot;a player in Harare scored 72% in U17 sessions&quot;) may be retained for platform improvement.</li>
              <li><strong className="text-white">Video uploads:</strong> Deleted within 24 hours of AI analysis.</li>
              <li><strong className="text-white">Identity document scans:</strong> Deleted immediately after data extraction.</li>
              <li><strong className="text-white">Session logs:</strong> Retained for 3 years unless deletion is requested.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">8. Security</h2>
            <p className="mb-3">We take the following measures to protect your data:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>All data in transit is encrypted via HTTPS/TLS.</li>
              <li>Passwords are hashed using bcrypt — we cannot read your password.</li>
              <li>Authentication tokens are stored in secure, encrypted storage on your device.</li>
              <li>Our backend runs regular dependency audits and penetration testing.</li>
              <li>Access to production data is restricted to authorised personnel only.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">9. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Access", "Request a copy of all data we hold about you."],
                ["Correction", "Request that incorrect data be corrected."],
                ["Deletion", "Request deletion of your account and personal data."],
                ["Portability", "Receive your data in a machine-readable format."],
                ["Object", "Object to processing for marketing or AI model training."],
                ["Withdraw consent", "Withdraw consent at any time (e.g. for scout visibility)."],
              ].map(([right, desc]) => (
                <div key={right} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold text-white">{right}</p>
                  <p className="mt-0.5 text-green-300">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              To exercise any right, email <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a> with &quot;Privacy Request&quot; in the subject. We will respond within 14 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">10. Cookies and Tracking</h2>
            <p>
              We use minimal cookies — only those necessary for authentication (session token) and basic analytics
              (anonymous page view counts). We do not use third-party advertising cookies or tracking pixels.
              You can disable cookies in your browser but this may prevent login from working.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">11. Changes to This Policy</h2>
            <p>
              We will notify active users by email at least 14 days before any material changes to this policy.
              The updated policy will also be posted here with a new effective date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">12. Contact and Data Controller</h2>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Grassroots Sport Pro</p>
              <p className="mt-1">Zimbabwe 🇿🇼</p>
              <p className="mt-1">
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a>
              </p>
              <p className="mt-3 text-xs text-green-500">
                For ZIFA safeguarding concerns, contact the ZIFA Child Protection Officer directly.
              </p>
            </div>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-green-500">
          <Link href="/terms" className="hover:text-green-300 transition-colors">← Terms of Service</Link>
          <Link href="/" className="hover:text-green-300 transition-colors">Back to home →</Link>
        </div>
      </div>
    </div>
  );
}
