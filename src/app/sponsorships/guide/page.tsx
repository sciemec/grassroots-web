import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { HOW_IT_WORKS_STEPS, FIVE_TIPS, GUIDE_SECTIONS } from "@/data/sponsorship-guide";

export const metadata = {
  title: "Sponsorship Guide — GRS",
  description: "How to build a sponsorship case that supporters want to join.",
};

function renderBody(text: string) {
  // Split paragraphs; bullet items (starting with •) become a list
  const paras = text.split("\n\n");
  return paras.map((para, i) => {
    const lines = para.split("\n");
    const isList = lines.every((l) => l.startsWith("•") || l.trim() === "");
    if (isList) {
      return (
        <ul key={i} className="space-y-1.5 mt-2">
          {lines.filter((l) => l.startsWith("•")).map((l, j) => (
            <li key={j} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
              <span className="text-[#1a5c2a] flex-shrink-0 mt-0.5">•</span>
              <span>{l.slice(1).trim()}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed mt-2 first:mt-0">
        {para}
      </p>
    );
  });
}

export default function SponsorshipGuidePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link href="/sponsorships" className="text-sm text-[#1a5c2a] hover:underline mb-4 block">
          ← Back to Sponsorships
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            How to build a sponsorship case
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            A step-by-step guide to getting your campaign in front of supporters.
          </p>
        </div>

        {/* How it works — numbered steps */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">How sponsorship works on GRS</h2>
          <ol className="space-y-3">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1a5c2a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-500 mt-4 border-t border-gray-100 pt-3">
            For players under 18, surname, school and location stay hidden unless the parent/guardian chooses to show them.
          </p>
        </div>

        {/* 5 things in common */}
        <div className="bg-[#1a5c2a]/5 border border-[#1a5c2a]/20 rounded-2xl p-5 mb-5">
          <h2 className="font-semibold text-[#1a5c2a] mb-3">
            5 things strong campaigns have in common
          </h2>
          <ol className="space-y-2">
            {FIVE_TIPS.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-800">
                <span className="text-base flex-shrink-0">{t.icon}</span>
                <span className="leading-relaxed">{t.tip}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Detail sections — accordion via <details> */}
        <div className="space-y-2">
          {GUIDE_SECTIONS.map((section) => (
            <details
              key={section.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden group"
            >
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none">
                <span className="font-semibold text-sm text-gray-900">{section.title}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </summary>
              <div className="px-5 pb-5">
                {renderBody(section.body)}
              </div>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/sponsorships/new"
            className="inline-block bg-[#1a5c2a] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#145222] transition-colors"
          >
            Start your sponsorship case →
          </Link>
          <p className="text-xs text-gray-400 mt-3">
            Questions? Reply GUIDE on WhatsApp to{" "}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER ?? "263777000000"}`}
              className="text-[#1a5c2a] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              the GRS WhatsApp bot
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
