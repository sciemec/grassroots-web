import Link from "next/link";

export function SchoolPitchSection() {
  return (
    <section className="py-16" style={{ background: "#14532d" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16">

          {/* Left — headline + CTA */}
          <div className="flex-1">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b429]/70">
              For Schools & Headmasters
            </p>
            <h2
              className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Is Your School on the Map?
            </h2>
            <p className="mb-6 text-lg font-semibold text-[#f0b429]">
              Register free. 25 student profiles. AI coaching. Zero cost.
            </p>
            <p className="mb-8 text-base text-white/70 leading-relaxed">
              Grassroots Sports gives your school the same analytics tools that elite academies pay thousands for — at no cost. Every student athlete gets a verified profile visible to international scouts from day one.
            </p>
            <Link
              href="/register?role=coach&school=true"
              className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-3 text-base font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
            >
              Register Your School Free
            </Link>
          </div>

          {/* Right — 3 benefit bullets */}
          <div className="flex-1 space-y-5">
            {[
              {
                check: "✔",
                title: "25 student athlete profiles, boys and girls.",
                detail: "Every player gets a verified digital identity with stats, highlights, and scout visibility.",
              },
              {
                check: "✔",
                title: "THUTO AI coaching in English and Shona.",
                detail: "AI-powered feedback after every training session — no coaching qualification required.",
              },
              {
                check: "✔",
                title: "International scout visibility from day one.",
                detail: "When a scout from Harare, Johannesburg, or London views your student&apos;s profile, the student is notified instantly.",
              },
            ].map(({ check, title, detail }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="mt-0.5 flex-shrink-0 text-xl font-bold text-[#f0b429]">
                  {check}
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm text-white/60">{detail}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
