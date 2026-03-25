import { useState } from "react";

const C = {
  dark: "#080F0A",
  card: "#0E1A10",
  surface: "#111D13",
  border: "#1A2E1E",
  green: "#1E6B3C",
  greenLight: "#2D7D46",
  gold: "#D4900A",
  goldLight: "#F5A623",
  red: "#B5261E",
  text: "#EDF2EE",
  muted: "#6B8F72",
  white: "#FFFFFF",
};

const chevron = `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L20 0 L40 20' fill='none' stroke='%231E6B3C' stroke-width='1' opacity='0.13'/%3E%3C/svg%3E")`;

/* ── DATA ──────────────────────────────────────────────────────── */

const PAGE_BIO = {
  name: "Grassroots Sports Zimbabwe",
  handle: "@grassrootssportszw",
  category: "Sports Technology · Youth Development",
  bio: "🌿 Zimbabwe's first digital sports development platform.\n\nTrack players. Develop coaches. Grow the game — from school pitches to national squads.\n\n⚽ Football · 🏐 Netball · More sports coming\n📲 Register free at grassrootssports.live\n🇿🇼 Built for Zimbabwe. Built for our players.",
  website: "grassrootssports.live",
  cta: "Sign Up",
  tip: "Set your CTA button to 'Sign Up' pointing to grassrootssports.live. Pin your launch post to the top of the page.",
};

const POSTS = [
  {
    id: "launch",
    audience: "Everyone",
    audienceColor: C.greenLight,
    label: "Launch post",
    emoji: "🚀",
    caption: `🌿 Grassroots Sports is here — and it's FREE.

Zimbabwe finally has a platform built for our players, our coaches, and our game.

Whether you're a player trying to get noticed, a coach building the next generation, a parent watching your child grow, or a school with talented kids — this is for you.

✅ Create your player profile
✅ Log your stats and development
✅ Get seen by coaches and scouts
✅ Track your journey from school pitch to elite level

This isn't a foreign app. This was built right here, for Zimbabwe. 🇿🇼

📲 Register FREE today → grassrootssports.live

Tag a player, coach, or school that needs to see this 👇`,
    hashtags: "#GrassrootsSports #ZimbabweFootball #ZimbabweNetball #ZimSports #YoungLions #GemsOfZimbabwe #SportZW",
    tip: "Boost this post with $3–$5. Target: Zimbabwe, ages 16–45, interests: football, netball, sports.",
  },
  {
    id: "coaches",
    audience: "Coaches & Trainers",
    audienceColor: C.gold,
    label: "Coach Hub post",
    emoji: "📋",
    caption: `Coaches — your players deserve better than a notebook. 📋

How do you track which player improved this month? Who needs more work? Who is ready to move up?

Grassroots Sports gives every coach in Zimbabwe a digital Coach Hub:

🏃 Track every player's development over time
📊 Log match stats and training attendance
🎯 Get AI-powered drill recommendations
📱 Works on your phone, even with poor internet

You built them. Now you can prove it — with data. 

Stop losing talent because there's no record of it.

Join free → grassrootssports.live/coach

Tag a coach who needs this 👇`,
    hashtags: "#ZimbabweCoaches #FootballCoach #NetballCoach #CoachZW #GrassrootsSports #SportsDevelopment",
    tip: "Target Facebook groups: Zimbabwe football coaches, Harare sports, school sports teachers.",
  },
  {
    id: "parents",
    audience: "Parents",
    audienceColor: C.goldLight,
    label: "Parent post",
    emoji: "👨‍👩‍👧",
    caption: `Parents — your child's talent deserves to be seen. 👀

Your son scores every weekend. Your daughter is the best on the netball court. But who knows? Who is tracking it?

With Grassroots Sports, your child gets:

🪪 A verified digital player profile
📈 A performance record that grows with them
🔍 Visibility to coaches and scouts across Zimbabwe
🏅 A pathway — from school sport to elite level

We built this so no talented child in Zimbabwe is ever overlooked again because they came from the wrong school or the wrong area.

Every child deserves a chance. 🇿🇼

Register your child FREE → grassrootssports.live

Share this with every sports parent you know 👇`,
    hashtags: "#ZimbabweParents #SportingKids #ZimYouth #GrassrootsSports #FootballZW #NetballZW #TalentZW",
    tip: "Run this as a boosted post targeting parents aged 28–50 in all provinces of Zimbabwe.",
  },
  {
    id: "schools",
    audience: "Schools & Teachers",
    audienceColor: "#4FC3F7",
    label: "Schools post",
    emoji: "🏫",
    caption: `Schools — your students are Zimbabwe's next sporting heroes. 🏫

But without a system to track them, their talent disappears when they leave your gates.

Grassroots Sports is now partnering with schools across Zimbabwe:

✅ Register your school's football and netball teams FREE
✅ Every student gets a digital player profile
✅ Track development from Form 1 through to A-Level
✅ Your school appears on Zimbabwe's first sports development map

This costs your school nothing. It could change everything for your students.

We are starting school registrations now — limited spots per province.

Register your school → grassrootssports.live/schools

Tag a sports teacher or headmaster who should see this 👇`,
    hashtags: "#ZimbabweSchools #SchoolSports #ZimSports #GrassrootsSports #FootballZW #NetballZW #Education",
    tip: "Share directly in Facebook groups for Zimbabwe teachers, headmasters, and school sports coordinators.",
  },
];

const CANVA_SCRIPT = [
  { time: "0–5s", slide: "Logo reveal", text: "Grassroots Sports", sub: "Zimbabwe's Sports Development Platform", bg: "Dark green, gold chevron pattern", tip: "Use Canva's 'zoom in' animation on the logo" },
  { time: "5–15s", slide: "The problem", text: "Zimbabwe has talent.", sub: "But talent without a platform goes unnoticed.", bg: "Dark background, bold white text", tip: "Use 'typewriter' text animation" },
  { time: "15–30s", slide: "The solution", text: "Grassroots Sports changes that.", sub: "Player profiles · Coach tools · League tracking", bg: "Green with gold accents", tip: "Show 3 icons appearing one by one" },
  { time: "30–50s", slide: "Who it's for", text: "For players. Coaches. Parents. Schools.", sub: "All of Zimbabwe. All sports. One platform.", bg: "Split into 4 colour blocks", tip: "Use Canva's grid layout, each block fades in" },
  { time: "50–65s", slide: "How it works", text: "Register FREE in 2 minutes.", sub: "Build your profile · Get seen · Go further", bg: "Phone mockup on dark background", tip: "Show a screen recording of the app if possible" },
  { time: "65–80s", slide: "CTA", text: "Join Zimbabwe's sports revolution.", sub: "grassrootssports.live · Register FREE today", bg: "Gold on dark, logo centred", tip: "End with logo + website URL held for 5 seconds" },
];

const AD_COPY = {
  headline: "Zimbabwe's First Sports Development Platform — Register FREE",
  primary: "🌿 Are you a player, coach, parent or school in Zimbabwe?\n\nGrassroots Sports gives every young athlete in Zimbabwe a digital profile, tracks their development, and connects them with coaches and scouts — completely free.\n\n⚽ Football · 🏐 Netball · More sports coming\n\nRegister FREE today at grassrootssports.live 🇿🇼",
  cta: "Sign Up",
  targeting: "Location: Zimbabwe (all provinces)\nAge: 16–50\nInterests: Football, Netball, Sports, Youth development, Schools\nBudget: $3–$5/day for 7 days = $21–$35 total\nBest time to run: Thursday–Sunday",
};

/* ── COMPONENTS ─────────────────────────────────────────────────── */

function Tab({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 16px", border: "none", cursor: "pointer",
      background: active ? `${color}22` : "transparent",
      borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
      color: active ? color : C.muted,
      fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
      fontFamily: "Georgia, serif", flexShrink: 0,
      transition: "all 0.15s",
    }}>{label}</button>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      padding: "6px 14px", border: `1px solid ${C.border}`,
      background: copied ? `${C.greenLight}22` : C.surface,
      color: copied ? C.greenLight : C.muted,
      borderRadius: 6, cursor: "pointer", fontSize: 11,
      fontFamily: "Georgia, serif", letterSpacing: 0.5,
      transition: "all 0.2s",
    }}>{copied ? "✓ Copied" : "Copy"}</button>
  );
}

function TipBadge({ text }) {
  return (
    <div style={{
      marginTop: 12, padding: "10px 14px",
      background: `${C.gold}11`, border: `1px solid ${C.gold}33`,
      borderLeft: `3px solid ${C.gold}`, borderRadius: 6,
      fontSize: 12, color: C.muted, lineHeight: 1.6,
      fontFamily: "Georgia, serif",
    }}>
      <span style={{ color: C.goldLight, fontWeight: 700 }}>💡 Tip: </span>{text}
    </div>
  );
}

function PostCard({ post }) {
  const fullText = `${post.caption}\n\n${post.hashtags}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Mock Facebook post */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: "hidden",
      }}>
        {/* FB post header */}
        <div style={{
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 10,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.green}, #0D3D1F)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>🌿</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "Georgia, serif" }}>Grassroots Sports Zimbabwe</div>
            <div style={{ fontSize: 11, color: C.muted }}>grassrootssports.live · Just now · 🌍</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div style={{
              padding: "3px 10px", borderRadius: 12,
              background: `${post.audienceColor}22`,
              border: `1px solid ${post.audienceColor}44`,
              fontSize: 10, color: post.audienceColor, fontWeight: 700,
              letterSpacing: 1,
            }}>{post.audience.toUpperCase()}</div>
          </div>
        </div>

        {/* Post body */}
        <div style={{ padding: "16px", borderBottom: `1px solid ${C.border}` }}>
          <pre style={{
            margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontSize: 13, color: C.text, lineHeight: 1.7,
            fontFamily: "Georgia, serif",
          }}>{post.caption}</pre>
          <div style={{ marginTop: 10, fontSize: 12, color: "#4FC3F7", lineHeight: 1.8 }}>
            {post.hashtags}
          </div>
        </div>

        {/* FB reactions bar */}
        <div style={{
          padding: "10px 16px", display: "flex", gap: 16,
          fontSize: 12, color: C.muted,
        }}>
          <span>👍 Like</span>
          <span>💬 Comment</span>
          <span>↗ Share</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <CopyBtn text={fullText} />
      </div>
      <TipBadge text={post.tip} />
    </div>
  );
}

function PageBioSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Mock page header */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: "hidden",
      }}>
        <div style={{
          height: 80,
          background: `linear-gradient(135deg, ${C.green} 0%, #0D3D1F 60%, ${C.gold}44 100%)`,
          backgroundImage: chevron,
          display: "flex", alignItems: "flex-end", padding: "0 16px 10px",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.green}, #0D3D1F)`,
            border: `3px solid ${C.dark}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, marginBottom: -20,
          }}>🌿</div>
        </div>
        <div style={{ padding: "28px 16px 16px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "Georgia, serif" }}>{PAGE_BIO.name}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{PAGE_BIO.handle} · {PAGE_BIO.category}</div>
          <pre style={{
            margin: "0 0 12px", whiteSpace: "pre-wrap",
            fontSize: 13, color: C.text, lineHeight: 1.7,
            fontFamily: "Georgia, serif",
          }}>{PAGE_BIO.bio}</pre>
          <div style={{ fontSize: 12, color: "#4FC3F7" }}>🌐 {PAGE_BIO.website}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <CopyBtn text={PAGE_BIO.bio} />
      </div>
      <TipBadge text={PAGE_BIO.tip} />

      {/* Setup checklist */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>
          Page setup checklist
        </div>
        {[
          "Create page as 'Sports Technology Company'",
          "Upload your chevron grass blade logo as profile photo",
          "Use a dark green banner with your logo and website URL",
          "Set CTA button to 'Sign Up' → grassrootssports.live",
          "Add website: grassrootssports.live",
          "Paste the bio above into the 'About' section",
          "Publish your launch post and pin it to the top",
          "Join 5 Zimbabwe sports Facebook groups and share your launch post",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `1px solid ${C.greenLight}`, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: C.greenLight, marginTop: 1,
            }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, fontFamily: "Georgia, serif" }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CanvaSection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: "16px 18px", marginBottom: 4,
      }}>
        <div style={{ fontSize: 13, color: C.text, fontFamily: "Georgia, serif", lineHeight: 1.7 }}>
          <span style={{ color: C.goldLight, fontWeight: 700 }}>Canva instructions: </span>
          Go to canva.com → Create design → select <strong style={{ color: C.text }}>"Facebook Video"</strong> (1080×1080) or <strong style={{ color: C.text }}>"Presentation"</strong>. Use the "Dark" theme. Add each slide below in order. Set each slide duration to 8–12 seconds. Export as MP4.
        </div>
      </div>

      {CANVA_SCRIPT.map((slide, i) => (
        <div key={i} style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "16px 18px",
          display: "flex", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8, flexShrink: 0,
            background: `${C.green}22`, border: `1px solid ${C.green}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: C.greenLight,
            fontFamily: "Georgia, serif",
          }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "Georgia, serif" }}>{slide.slide}</span>
              <span style={{
                fontSize: 10, color: C.gold, fontWeight: 700,
                background: `${C.gold}18`, padding: "2px 8px", borderRadius: 4,
              }}>{slide.time}</span>
            </div>
            <div style={{ fontSize: 14, color: C.goldLight, fontFamily: "Georgia, serif", marginBottom: 2, fontWeight: 700 }}>"{slide.text}"</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "Georgia, serif", marginBottom: 8 }}>{slide.sub}</div>
            <div style={{ fontSize: 11, color: C.muted }}>
              <span style={{ color: C.green }}>Background: </span>{slide.bg}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              <span style={{ color: C.goldLight }}>Canva tip: </span>{slide.tip}
            </div>
          </div>
        </div>
      ))}

      <TipBadge text="Use Canva's free music library — search 'inspirational Africa' or 'uplifting drums'. Keep it under 80 seconds total. End with the logo held still for 5 seconds." />
    </div>
  );
}

function AdCopySection() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Ad preview */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: "hidden",
      }}>
        <div style={{
          height: 120,
          background: `linear-gradient(135deg, ${C.green}, #0D3D1F)`,
          backgroundImage: chevron,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 32 }}>🌿</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.goldLight, fontFamily: "Georgia, serif", letterSpacing: 1 }}>
            GRASSROOTS SPORTS
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>grassrootssports.live</div>
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "Georgia, serif", marginBottom: 10 }}>
            {AD_COPY.headline}
          </div>
          <pre style={{
            margin: "0 0 14px", whiteSpace: "pre-wrap",
            fontSize: 12, color: C.muted, lineHeight: 1.7,
            fontFamily: "Georgia, serif",
          }}>{AD_COPY.primary}</pre>
          <button style={{
            width: "100%", padding: "10px",
            background: C.greenLight, border: "none", borderRadius: 6,
            color: C.white, fontWeight: 800, fontSize: 13, cursor: "pointer",
            fontFamily: "Georgia, serif",
          }}>Sign Up — It's Free</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <CopyBtn text={`${AD_COPY.headline}\n\n${AD_COPY.primary}`} />
      </div>

      {/* Targeting box */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.goldLight}`,
        borderRadius: 10, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 11, color: C.goldLight, letterSpacing: 2, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>
          Facebook boost targeting settings
        </div>
        <pre style={{
          margin: 0, whiteSpace: "pre-wrap",
          fontSize: 12, color: C.muted, lineHeight: 1.8,
          fontFamily: "Georgia, serif",
        }}>{AD_COPY.targeting}</pre>
      </div>

      {/* Free strategy */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 11, color: C.green, letterSpacing: 2, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
          Free reach strategy (before spending any money)
        </div>
        {[
          "Join these Facebook groups: Zimbabwe Football, Harare Football, Bulawayo Sports, Zimbabwe Netball, Zimbabwe Schools Sports, Zimbabwe Youth Development",
          "Post your launch caption in each group — do NOT just drop a link, write the full post",
          "Ask 10 friends to share your page launch post on their personal profiles",
          "Comment on posts in sports groups with helpful advice — build presence before promoting",
          "Only boost with money once you have at least 100 page likes organically",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{ color: C.greenLight, fontSize: 14, flexShrink: 0 }}>→</span>
            <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, fontFamily: "Georgia, serif" }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── APP ────────────────────────────────────────────────────────── */
export default function FacebookKit() {
  const [mainTab, setMainTab] = useState("page");
  const [postTab, setPostTab] = useState(0);

  const mainTabs = [
    { id: "page",   label: "📄 Page Setup",    color: C.greenLight },
    { id: "posts",  label: "✍️ 4 Posts",        color: C.goldLight  },
    { id: "canva",  label: "🎬 Canva Video",    color: "#4FC3F7"    },
    { id: "ads",    label: "📣 Ad Copy",         color: C.red        },
  ];

  return (
    <div style={{
      background: C.dark, minHeight: "100vh",
      fontFamily: "Georgia, serif", color: C.text,
      backgroundImage: chevron,
    }}>
      {/* Header */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
            Grassroots Sports
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
            Facebook Marketing Kit
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            All of Zimbabwe · 4 audiences · Launch ready
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            padding: "4px 12px", borderRadius: 20,
            background: `${C.greenLight}22`, border: `1px solid ${C.greenLight}55`,
            fontSize: 11, color: C.greenLight, fontWeight: 700, letterSpacing: 1,
          }}>GO TO MARKET</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>March 2026</div>
        </div>
      </div>

      {/* Main tabs */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        display: "flex", overflowX: "auto", padding: "0 8px",
      }}>
        {mainTabs.map(t => (
          <Tab key={t.id} label={t.label} active={mainTab === t.id}
            onClick={() => setMainTab(t.id)} color={t.color} />
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>

        {mainTab === "page" && <PageBioSection />}

        {mainTab === "posts" && (
          <div>
            {/* Post sub-tabs */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap",
            }}>
              {POSTS.map((p, i) => (
                <button key={i} onClick={() => setPostTab(i)} style={{
                  padding: "7px 14px",
                  background: postTab === i ? `${p.audienceColor}22` : C.card,
                  border: `1px solid ${postTab === i ? p.audienceColor : C.border}`,
                  borderRadius: 20, cursor: "pointer",
                  fontSize: 11, color: postTab === i ? p.audienceColor : C.muted,
                  fontFamily: "Georgia, serif", fontWeight: postTab === i ? 700 : 400,
                  transition: "all 0.15s",
                }}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
            <PostCard post={POSTS[postTab]} />
          </div>
        )}

        {mainTab === "canva" && <CanvaSection />}
        {mainTab === "ads" && <AdCopySection />}
      </div>
    </div>
  );
}
