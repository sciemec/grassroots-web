import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";

export const metadata: Metadata = {
  title: "Privacy Policy — Grassroots Sports Pro",
  description:
    "Learn how Grassroots Sports Pro collects, uses, and protects your personal information, including video and AI-generated performance data.",
};

const EFFECTIVE_DATE = "September 23, 2026";
const CONTACT_EMAIL  = "info@grassrootssports.live";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-green-950 text-white">
      <PublicNavbar />

      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-green-400 hover:text-white transition-colors mb-6"
          >
            &larr; Back to home
          </Link>
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-3 text-green-400">Effective date: {EFFECTIVE_DATE}</p>
          <p className="mt-2 text-sm text-green-500">Last updated: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-green-200">

          {/* Intro */}
          <p>
            Grassroots Sports Pro (&quot;GRS,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the platform available at
            grassrootssports.live (the &quot;Platform&quot;), including our website, mobile experience, and connected
            services such as THUTO AI and Match Eye. This Privacy Policy explains what information we collect,
            how we use it, and the choices you have.
          </p>
          <p>
            By using the Platform, you agree to the collection and use of information in accordance with this
            policy. If you are a parent or guardian registering a child or minor player, please read the
            &quot;Children and Minor Players&quot; section carefully.
          </p>

          {/* 1 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">1. Who We Are</h2>
            <p>
              Grassroots Sports Pro is Zimbabwe&apos;s AI-powered football talent identification and development
              platform, connecting players, coaches, clubs, schools, and scouts. GRS is based in Harare, Zimbabwe.
            </p>
            <p className="mt-2">
              <strong className="text-white">Contact:</strong>{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">2. Information We Collect</h2>
            <div className="space-y-4">

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">2.1 Account and registration information</h3>
                <p>
                  When you register, we collect information such as your name, date of birth, gender,
                  contact details (email, phone number), location/province, sport, playing position, and
                  role (player, coach, club/academy, school, business, scout).
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">2.2 Video and performance data</h3>
                <p>
                  When you upload video footage — including skill clips, drill recordings, or match footage —
                  we collect and process that video, along with any AI-generated analysis derived from it
                  (performance ratings, weakness/strength identification, drill recommendations, biomechanics
                  data, and, where applicable, tactical or tracking data such as heatmaps, possession
                  statistics, or player movement data).
                </p>
                <p className="mt-2">
                  Video may show you and, in the case of match or team footage, other identifiable individuals
                  (teammates, opponents, coaches) who are visible in frame.
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">2.3 AI chat data (THUTO)</h3>
                <p>
                  If you interact with THUTO, our AI assistant, we collect your messages and the context
                  needed to generate helpful responses, which may include your profile information and recent
                  performance data, so THUTO can give relevant guidance.
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">2.4 WhatsApp messages</h3>
                <p>
                  If you interact with us via WhatsApp Business messaging, we collect the content of those
                  messages and associated metadata (phone number, timestamps) in order to respond to you
                  and provide platform notifications.
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">2.5 Payment information</h3>
                <p>
                  If you make payments through the Platform (e.g. subscriptions, verification fees),
                  payment processing is handled by Paynow, our payment processor. We do not store your
                  full payment card details ourselves.
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">2.6 Usage and technical data</h3>
                <p>
                  We automatically collect certain technical information, such as device type, browser type,
                  IP address, and general usage patterns, to maintain and improve the Platform.
                </p>
              </div>

            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>Provide, operate, and maintain the Platform and its features (player passports, drill libraries, coaching tools, THUTO AI, Match Eye analysis)</li>
              <li>Analyze uploaded video using third-party AI providers to generate performance feedback, drill recommendations, and tactical insights</li>
              <li>Personalize your experience, including THUTO&apos;s responses and drill/coaching recommendations</li>
              <li>Facilitate connections between players, coaches, clubs, schools, and scouts (e.g. through The Arena, scouting funnels, recruitment features)</li>
              <li>Send notifications, including via WhatsApp and email, about your account, performance updates, or platform activity</li>
              <li>Process payments for applicable services</li>
              <li>Maintain platform safety, including safeguarding measures for players under 18</li>
              <li>Improve and develop new features</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">4. Children and Minor Players</h2>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="mb-3 font-semibold text-amber-300">Special protections for players under 18</p>
              <ul className="ml-4 list-disc space-y-2">
                <li>Registration of a player under 18 requires appropriate parental or guardian involvement/consent as designed into our registration flow.</li>
                <li>We apply safeguarding practices consistent with expectations for youth sport platforms in Zimbabwe, including limiting how minors&apos; data and imagery are shared, displayed, or made public.</li>
                <li>Video footage or performance data involving a minor is used only for the purposes described in this policy (talent development, coaching feedback, platform functionality) and is not used for unrelated commercial purposes without appropriate consent.</li>
                <li>
                  Parents/guardians who wish to review, correct, or request deletion of their child&apos;s data
                  may contact us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">
                    {CONTACT_EMAIL}
                  </a>.
                </li>
              </ul>
            </div>
            <p className="mt-3">
              If you believe a minor has provided us with information without appropriate consent, please
              contact us so we can take appropriate action.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">5. How We Share Information</h2>
            <p className="mb-4">We do not sell your personal information. We share information in the following circumstances:</p>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">5.1 Third-party service providers</h3>
                <p className="mb-3">We use trusted third-party providers to operate the Platform, including:</p>
                <ul className="ml-4 list-disc space-y-2">
                  <li><strong className="text-white">Google Gemini, GROQ</strong> — to analyze video and generate AI feedback and chat responses. Video and text you submit for analysis is transmitted to these providers for processing.</li>
                  <li><strong className="text-white">Meta / WhatsApp Business Platform</strong> — to deliver WhatsApp messages and notifications.</li>
                  <li><strong className="text-white">Paynow</strong> — to process payments.</li>
                  <li><strong className="text-white">Resend</strong> — to deliver transactional emails.</li>
                  <li><strong className="text-white">Cloudflare</strong> — for content delivery, email routing, and storage infrastructure (including video storage).</li>
                  <li><strong className="text-white">Render (and successor infrastructure)</strong> — to host and run the Platform.</li>
                </ul>
                <p className="mt-3">
                  These providers process data on our behalf and are expected to handle it in accordance with
                  applicable data protection obligations.
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">5.2 Other users</h3>
                <p>
                  Certain profile information, performance data, or achievements may be visible to other
                  users depending on your role and privacy settings (for example, a player&apos;s passport may
                  be visible to scouts or clubs as part of the Platform&apos;s talent-discovery purpose). Full
                  match or team video, if used for tracking/tactical analysis, may reveal other players&apos;
                  data within a shared context (e.g. a coach or team).
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">5.3 Legal and safety reasons</h3>
                <p>
                  We may disclose information if required by law, to protect the rights, safety, or property
                  of GRS or others, or to investigate potential violations of our terms, including safeguarding
                  concerns.
                </p>
              </div>

              <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-white">5.4 Business transfers</h3>
                <p>
                  If GRS is involved in a merger, acquisition, or sale of assets, information may be
                  transferred as part of that transaction, subject to standard protections.
                </p>
              </div>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">6. Data Storage and Security</h2>
            <p>
              We use reasonable technical and organizational measures to protect your information, including
              encrypted storage and transmission where applicable. However, no method of transmission or
              storage is 100% secure, and we cannot guarantee absolute security.
            </p>
            <p className="mt-2">
              Video and data may be stored and processed on servers located outside Zimbabwe, depending on
              our infrastructure and AI providers.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the
              Platform&apos;s services. We may retain certain information for longer periods where required for
              legal, safeguarding, or legitimate business purposes (e.g. dispute resolution). You may request
              deletion of your account and associated data as described in Section 8.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">8. Your Rights</h2>
            <p className="mb-3">Depending on your circumstances, you may have the right to:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Access", "Request the personal information we hold about you."],
                ["Correction", "Request that inaccurate information be corrected."],
                ["Deletion", "Request deletion of your information and account."],
                ["Object / Restrict", "Object to or restrict certain processing activities."],
                ["Withdraw consent", "Withdraw consent where processing is based on consent."],
              ].map(([right, desc]) => (
                <div key={right} className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-3">
                  <p className="font-semibold text-white">{right}</p>
                  <p className="mt-0.5 text-green-300">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              To exercise these rights, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">
                {CONTACT_EMAIL}
              </a>. We will respond within a reasonable timeframe.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version on this
              page with a revised &quot;Last updated&quot; date. Continued use of the Platform after changes take
              effect constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-white">10. Contact Us</h2>
            <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Grassroots Sports Pro</p>
              <p className="mt-1">Harare, Zimbabwe</p>
              <p className="mt-1">
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[#f0b429]/10 pt-8 text-sm text-green-500">
          <Link href="/terms" className="hover:text-green-300 transition-colors">&larr; Terms of Service</Link>
          <Link href="/privacy-policy" className="hover:text-green-300 transition-colors">Canonical URL &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
