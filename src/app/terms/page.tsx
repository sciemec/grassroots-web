import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";

const EFFECTIVE_DATE = "1 March 2026";
const CONTACT_EMAIL = "support@grassrootssports.live";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-green-950 text-white">
      <PublicNavbar />

      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-green-400 hover:text-white transition-colors mb-6">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
          <p className="mt-3 text-green-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose-invert space-y-10 text-sm leading-relaxed text-green-200">

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">1. Who We Are</h2>
            <p>
              Grassroots Sport Pro (&quot;we&quot;, &quot;us&quot;, &quot;the Platform&quot;) is an AI-powered sports development platform
              built specifically for Zimbabwe and African grassroots athletes, coaches, scouts, and fans.
              We are incorporated in Zimbabwe and operate in partnership with ZIFA (Zimbabwe Football Association)
              and other national sports governing bodies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">2. Acceptance of Terms</h2>
            <p>
              By creating an account or using any part of this Platform, you agree to be bound by these Terms.
              If you are under 18, a parent or legal guardian must also agree on your behalf. If you are under 13,
              your parent or guardian must complete the guardian consent step during registration.
            </p>
            <p className="mt-2">
              If you do not agree to these Terms, you may not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">3. Eligibility and Accounts</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>You must provide accurate, current, and complete information when registering.</li>
              <li>You are responsible for maintaining the confidentiality of your password.</li>
              <li>One person may not maintain more than one free account.</li>
              <li>You must be at least 8 years old to use this Platform (with guardian consent required under 13).</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">4. User Roles and Permissions</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-green-300">🏃 Players</h3>
                <p>May track training sessions, access AI coaching, and maintain a profile visible to approved scouts. Player profiles under 18 are protected — scouts must submit a contact request approved by platform admins before accessing full details.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-blue-300">📋 Coaches</h3>
                <p>May manage a squad of up to 25 registered players, access tactical tools, and receive AI insights. Coaches are responsible for ensuring players they add to their squad have consented to being tracked.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-purple-300">🔍 Scouts</h3>
                <p>Scout accounts are reviewed and approved within 24 hours of registration. Approved scouts may view anonymised player profiles (initials + region) and submit contact requests. Scouts may not share player data with third parties without written consent from the Platform and the player (or guardian if under 18).</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-2 font-semibold text-amber-300">🎉 Fans</h3>
                <p>May view leaderboards, public profiles, and live match streams. Fans may not contact players directly through the Platform.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">5. Subscriptions and Payments</h2>
            <ul className="ml-4 list-disc space-y-2">
              <li>Free accounts include limited features as described on the Pricing page.</li>
              <li>Pro and Team subscriptions are billed monthly via EcoCash, InnBucks, or card.</li>
              <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
              <li>Refunds are available within 7 days of initial purchase if the Platform has not been materially used.</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice to active subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">6. AI-Generated Content</h2>
            <p>
              The Platform uses Claude AI (Anthropic) and on-device machine learning to generate coaching feedback,
              tactical insights, scouting reports, and training plans. This content is:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-2">
              <li>Advisory only — not a substitute for professional coaching or medical advice.</li>
              <li>Generated based on the data you provide — accuracy depends on the quality of your inputs.</li>
              <li>Not guaranteed to be error-free. Always apply your own judgment.</li>
            </ul>
            <p className="mt-2">
              We are not liable for decisions made based solely on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">7. Prohibited Conduct</h2>
            <p>You must not:</p>
            <ul className="ml-4 mt-2 list-disc space-y-2">
              <li>Use the Platform for any unlawful purpose or to harass, abuse, or harm others.</li>
              <li>Upload false, misleading, or fraudulent information (including false identity documents).</li>
              <li>Attempt to reverse-engineer, scrape, or extract Platform data at scale.</li>
              <li>Share another user&apos;s personal data without their consent.</li>
              <li>Use automated bots, scripts, or tools to access the Platform without permission.</li>
              <li>Attempt to gain unauthorised access to other accounts or the Platform&apos;s infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">8. Intellectual Property</h2>
            <p>
              All Platform content, branding, software, and AI models remain the property of Grassroots Sport Pro.
              User-generated content (training data, session logs, uploaded videos) remains yours — by uploading it,
              you grant us a non-exclusive licence to use it to improve the Platform and generate your AI insights.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">9. Child Safeguarding</h2>
            <p>
              We take child protection seriously. In compliance with ZIFA safeguarding policies:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-2">
              <li>Players under 13 require verified parental/guardian consent to register.</li>
              <li>Players under 18 cannot be contacted by scouts without admin-approved contact requests.</li>
              <li>We do not share the full identity or GPS location of minors with any third party.</li>
              <li>Any safeguarding concerns must be reported to <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Grassroots Sport Pro is not liable for indirect, incidental,
              or consequential damages arising from your use of the Platform, including loss of data, missed
              scouting opportunities, or reliance on AI-generated advice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">11. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these Terms.
              You may delete your account at any time from your profile settings. Upon deletion,
              your personal data will be removed within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Zimbabwe. Disputes shall be resolved through
              the courts of Zimbabwe, or through mediation if both parties agree.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify active users by email
              at least 14 days before significant changes take effect. Continued use of the Platform
              after that date constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-white">14. Contact Us</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-green-500">
          <Link href="/" className="hover:text-green-300 transition-colors">← Back to home</Link>
          <Link href="/privacy" className="hover:text-green-300 transition-colors">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}
