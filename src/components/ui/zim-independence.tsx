"use client";

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────
// COMPONENT 1: Top dismissible banner
// Shows President's name + quote, dismissible with X
// Auto-hides after April 30 2026
// ─────────────────────────────────────────────
export const ZimPresidentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const now = new Date();
    // PREVIEW MODE: always show (remove this line and uncomment date check for production)
    const inWindow = true; // now >= new Date("2026-04-01") && now < new Date("2026-05-01");
    if (inWindow) {
      const wasDismissed = sessionStorage.getItem("zim_banner_dismissed");
      if (!wasDismissed) {
        setShouldRender(true);
        setTimeout(() => setVisible(true), 80);
      }
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("zim_banner_dismissed", "1");
    setTimeout(() => setDismissed(true), 500);
  };

  if (!shouldRender || dismissed) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:ital,wght@1,400&display=swap');

        .zpb-outer {
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 9999;
          transform: translateY(${visible ? "0" : "-100%"});
          opacity: ${visible ? "1" : "0"};
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease;
        }

        .zpb-flag { display: flex; width: 100%; height: 4px; }
        .zpb-flag span { flex: 1; display: block; }
        .zpb-flag .fg { background: #006400; }
        .zpb-flag .fy { background: #FFD700; }
        .zpb-flag .fr { background: #DC143C; }
        .zpb-flag .fb { background: #111111; }

        .zpb-body {
          background: linear-gradient(90deg, #071a0b 0%, #0d2610 40%, #071a0b 100%);
          border-bottom: 1px solid rgba(0,100,0,0.35);
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 56px;
          position: relative;
          gap: 16px;
          overflow: hidden;
        }

        .zpb-body::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,215,0,0.03), transparent);
          animation: zpb-shimmer 4s ease-in-out infinite;
        }
        @keyframes zpb-shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        .zpb-accent {
          display: flex;
          flex-direction: column;
          width: 3px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 2px;
          overflow: hidden;
        }
        .zpb-accent span { flex: 1; display: block; }

        .zpb-badge { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .zpb-portrait {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1.5px solid rgba(255,215,0,0.45);
          background: linear-gradient(135deg, #0d3014, #1a4a22);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 12px rgba(0,100,0,0.3);
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px; color: rgba(255,215,0,0.7); letter-spacing: 1px;
        }
        .zpb-title { display: flex; flex-direction: column; gap: 1px; }
        .zpb-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700; font-size: 13px; letter-spacing: 1px;
          color: rgba(255,215,0,0.9); white-space: nowrap;
        }
        .zpb-role {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 10px; letter-spacing: 2px;
          color: rgba(255,255,255,0.3); text-transform: uppercase; white-space: nowrap;
        }

        .zpb-pip { width: 4px; height: 4px; border-radius: 50%; background: rgba(0,100,0,0.6); flex-shrink: 0; }

        .zpb-quote {
          font-family: 'Barlow', sans-serif;
          font-size: 13px; font-style: italic;
          color: rgba(255,255,255,0.55); line-height: 1.4; max-width: 560px;
        }
        .zpb-quote strong { color: rgba(255,215,0,0.75); font-style: normal; }

        .zpb-tag {
          flex-shrink: 0;
          background: rgba(0,100,0,0.2);
          border: 1px solid rgba(0,100,0,0.4);
          border-radius: 3px; padding: 4px 10px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px; letter-spacing: 2px; color: #FFD700; white-space: nowrap;
        }

        .zpb-close {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50%; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: rgba(255,255,255,0.35);
          font-size: 14px; line-height: 1;
          transition: background 0.2s, color 0.2s; padding: 0;
        }
        .zpb-close:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }

        @media (max-width: 640px) { .zpb-quote { display: none; } .zpb-pip { display: none; } }
        @media (max-width: 480px) { .zpb-tag { display: none; } }
      `}</style>

      <div className="zpb-outer">
        <div className="zpb-flag">
          <span className="fg"/><span className="fy"/><span className="fr"/>
          <span className="fb"/><span className="fb"/>
          <span className="fr"/><span className="fy"/><span className="fg"/>
        </div>
        <div className="zpb-body">
          <div className="zpb-accent">
            <span style={{background:"#006400"}}/><span style={{background:"#FFD700"}}/>
            <span style={{background:"#DC143C"}}/><span style={{background:"#111"}}/>
          </div>

          <div className="zpb-badge">
            <div className="zpb-portrait">ED</div>
            <div className="zpb-title">
              <span className="zpb-name">H.E. Dr Emmerson Mnangagwa</span>
              <span className="zpb-role">President of the Republic of Zimbabwe</span>
            </div>
          </div>

          <div className="zpb-pip"/>

          <p className="zpb-quote">
            &ldquo;Talent must be <strong>identified early, nurtured systematically</strong> — afforded opportunity regardless of geography or background.&rdquo;
          </p>

          <div className="zpb-tag">ZIM @ 46 🇿🇼</div>

          <button className="zpb-close" onClick={dismiss} aria-label="Dismiss">✕</button>
        </div>
      </div>
    </>
  );
};


// ─────────────────────────────────────────────
// COMPONENT 2: Bottom independence wish section
// Coat of arms + Happy Independence message
// Auto-hides after April 30 2026
// ─────────────────────────────────────────────
export const ZimIndependenceSection = () => {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const now = new Date();
    if (now >= new Date("2026-04-01") && now < new Date("2026-05-01")) {
      setShouldRender(true);
      setTimeout(() => setVisible(true), 120);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let n = 0;
    const id = setInterval(() => {
      n += 46 / (2000 / 16);
      if (n >= 46) { setCount(46); clearInterval(id); }
      else setCount(Math.floor(n));
    }, 16);
    return () => clearInterval(id);
  }, [visible]);

  if (!shouldRender) return null;

  const fade = (d: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.7s ease ${d}s, transform 0.7s ease ${d}s`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,600;1,400&family=Barlow+Condensed:wght@400;600;700&display=swap');

        .zis-wrap { width: 100%; background: #04100A; position: relative; overflow: hidden; }
        .zis-wrap::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,80,0,0.25) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,60,0,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .zis-wrap::after {
          content: ''; position: absolute; inset: 0;
          background-image: repeating-linear-gradient(-55deg, transparent, transparent 24px,
            rgba(255,215,0,0.018) 24px, rgba(255,215,0,0.018) 48px);
          pointer-events: none;
        }

        .zis-flag { width: 100%; height: 6px; display: flex; }
        .zis-flag span { flex: 1; display: block; }

        .zis-inner {
          position: relative; z-index: 1;
          max-width: 820px; margin: 0 auto;
          padding: 64px 28px 56px;
          display: flex; flex-direction: column;
          align-items: center; gap: 32px;
          box-sizing: border-box; text-align: center;
        }

        .zis-coa { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .zis-coa-ring {
          width: 130px; height: 130px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,100,0,0.3) 0%, rgba(0,40,0,0.5) 60%, rgba(0,0,0,0.4) 100%);
          border: 2px solid rgba(255,215,0,0.4);
          display: flex; align-items: center; justify-content: center;
          position: relative;
          box-shadow: 0 0 40px rgba(0,100,0,0.25), 0 0 80px rgba(0,100,0,0.1), inset 0 0 24px rgba(0,0,0,0.4);
        }
        .zis-coa-ring::before {
          content: ''; position: absolute; inset: 7px;
          border-radius: 50%; border: 1px solid rgba(255,215,0,0.15);
        }
        .zis-coa-ring::after {
          content: ''; position: absolute; inset: 14px;
          border-radius: 50%; border: 1px dashed rgba(255,215,0,0.08);
        }

        .zis-bird {
          width: 70px; height: 70px;
          filter: drop-shadow(0 0 12px rgba(255,215,0,0.4));
          animation: zis-float 4s ease-in-out infinite;
        }
        @keyframes zis-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }

        .zis-coa-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600; font-size: 10px;
          letter-spacing: 4px; text-transform: uppercase; color: rgba(255,215,0,0.4);
        }

        .zis-headline { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .zis-happy {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-size: clamp(16px, 3vw, 22px);
          color: rgba(255,255,255,0.4); letter-spacing: 3px;
        }
        .zis-independence {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(42px, 9vw, 82px); line-height: 0.9; letter-spacing: 3px;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 40%, #FFD700 70%, #fff8dc 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          filter: drop-shadow(0 4px 20px rgba(255,165,0,0.3));
        }
        .zis-day {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(14px, 2.5vw, 18px);
          color: rgba(255,255,255,0.35); letter-spacing: 5px; text-transform: uppercase;
        }

        .zis-counter { display: flex; align-items: center; gap: 0; }
        .zis-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(56px, 10vw, 96px); line-height: 1;
          color: transparent;
          background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.5) 100%);
          -webkit-background-clip: text; background-clip: text;
        }
        .zis-num-label { display: flex; flex-direction: column; align-items: flex-start; padding-left: 10px; gap: 2px; }
        .zis-years {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(14px, 2.5vw, 20px); color: rgba(255,255,255,0.35);
          letter-spacing: 2px; line-height: 1;
        }
        .zis-of-independence {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(9px, 1.2vw, 11px); letter-spacing: 3px;
          color: rgba(255,255,255,0.2); text-transform: uppercase;
        }

        .zis-div { width: 100%; max-width: 420px; display: flex; align-items: center; gap: 12px; }
        .zis-div-line {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent);
        }
        .zis-div-star { font-size: 10px; color: rgba(255,215,0,0.3); }

        .zis-wish { max-width: 520px; }
        .zis-wish-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(15px, 2.2vw, 19px); font-style: italic;
          color: rgba(255,255,255,0.5); line-height: 1.8; margin: 0;
        }
        .zis-wish-text strong { color: rgba(255,215,0,0.8); font-style: normal; font-weight: 600; }

        .zis-date-pill {
          background: rgba(0,100,0,0.15); border: 1px solid rgba(0,100,0,0.35);
          border-radius: 20px; padding: 8px 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .zis-date-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #FFD700;
          animation: zis-pulse 2s ease-in-out infinite;
        }
        @keyframes zis-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        .zis-date-text {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 600; font-size: 12px;
          letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.4);
        }

        .zis-platform { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .zis-platform-line {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.18); text-transform: uppercase;
        }
        .zis-platform-tags { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .zis-ptag {
          background: rgba(0,80,0,0.12); border: 1px solid rgba(0,100,0,0.25);
          border-radius: 3px; padding: 5px 12px;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }
        .zis-ptag-sep { font-size: 10px; color: rgba(255,255,255,0.12); letter-spacing: 1px; font-family: 'Barlow Condensed', sans-serif; }

        .zis-flag-btm { width: 100%; height: 6px; display: flex; }
        .zis-flag-btm span { flex: 1; display: block; }

        @media (max-width: 480px) { .zis-inner { padding: 44px 18px 38px; gap: 24px; } }
      `}</style>

      <div className="zis-wrap">
        <div className="zis-flag">
          <span style={{background:"#006400"}}/><span style={{background:"#FFD700"}}/>
          <span style={{background:"#DC143C"}}/><span style={{background:"#111"}}/>
          <span style={{background:"#111"}}/>
          <span style={{background:"#DC143C"}}/><span style={{background:"#FFD700"}}/>
          <span style={{background:"#006400"}}/>
        </div>

        <div className="zis-inner">

          <div className="zis-coa" style={fade(0.2)}>
            <div className="zis-coa-ring">
              <svg className="zis-bird" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M52 22 L55 14 L60 18 L65 14 L68 22 Z" fill="#FFD700" opacity="0.95"/>
                <ellipse cx="60" cy="30" rx="10" ry="9" fill="#FFD700" opacity="0.9"/>
                <circle cx="63" cy="28" r="2" fill="#0a1a0f"/>
                <circle cx="63.5" cy="27.5" r="0.7" fill="#FFD700"/>
                <path d="M70 30 L76 32 L70 34 Z" fill="#FFD700" opacity="0.8"/>
                <path d="M55 38 C50 42 46 50 46 58 C46 68 48 76 52 82 L60 78 L68 82 C72 76 74 68 74 58 C74 50 70 42 65 38 Z" fill="#FFD700" opacity="0.85"/>
                <path d="M46 52 C38 50 30 52 26 58 C24 64 26 70 30 72 L46 66 Z" fill="#FFD700" opacity="0.75"/>
                <path d="M74 52 C82 50 90 52 94 58 C96 64 94 70 90 72 L74 66 Z" fill="#FFD700" opacity="0.75"/>
                <path d="M52 82 C50 92 46 100 44 108 C48 108 52 104 54 100 L60 90 L66 100 C68 104 72 108 76 108 C74 100 70 92 68 82 Z" fill="#FFD700" opacity="0.8"/>
                <path d="M54 108 L52 124 M54 108 L56 120 M66 108 L64 124 M66 108 L68 120" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                <rect x="44" y="124" width="32" height="6" rx="3" fill="#FFD700" opacity="0.5"/>
              </svg>
            </div>
            <span className="zis-coa-label">Zimbabwe · Coat of Arms</span>
          </div>

          <div className="zis-headline" style={fade(0.4)}>
            <span className="zis-happy">Wishing Zimbabwe a</span>
            <span className="zis-independence">HAPPY<br/>INDEPENDENCE</span>
            <span className="zis-day">Day</span>
          </div>

          <div className="zis-counter" style={fade(0.6)}>
            <span className="zis-num">{count}</span>
            <div className="zis-num-label">
              <span className="zis-years">Years</span>
              <span className="zis-of-independence">of independence</span>
            </div>
          </div>

          <div className="zis-div" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.7s ease 0.75s" }}>
            <div className="zis-div-line"/>
            <span className="zis-div-star">✦</span>
            <div className="zis-div-line"/>
          </div>

          <div className="zis-wish" style={fade(0.9)}>
            <p className="zis-wish-text">
              From all of us at <strong>Grassroots Sports</strong> — celebrating the talent, resilience, and spirit of <strong>Zimbabwe&apos;s youth</strong>. May the next 46 years unlock every dream on every pitch, in every community.
            </p>
          </div>

          <div className="zis-date-pill" style={fade(1.05)}>
            <div className="zis-date-dot"/>
            <span className="zis-date-text">April 18, 2026 · Zim @ 46 · Unity &amp; Development Towards Vision 2030</span>
          </div>

          <div className="zis-platform" style={fade(1.2)}>
            <span className="zis-platform-line">proudly supports</span>
            <div className="zis-platform-tags">
              <div className="zis-ptag">Grassroots Sports</div>
              <span className="zis-ptag-sep">×</span>
              <div className="zis-ptag">ZIFA Munhumutapa Challenge Cup</div>
            </div>
          </div>

        </div>

        <div className="zis-flag-btm">
          <span style={{background:"#006400"}}/><span style={{background:"#FFD700"}}/>
          <span style={{background:"#DC143C"}}/><span style={{background:"#111"}}/>
          <span style={{background:"#111"}}/>
          <span style={{background:"#DC143C"}}/><span style={{background:"#FFD700"}}/>
          <span style={{background:"#006400"}}/>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 3: Sidebar Independence Panel
// President photo + speech + coat of arms + animated flame
// Shows in every hub sidebar April 1–30 2026
// ─────────────────────────────────────────────────────────────────────────────
export const ZimSidebarPanel = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // PREVIEW MODE: always show
    const inWindow = true; // new Date() >= new Date("2026-04-01") && new Date() < new Date("2026-05-01");
    if (inWindow) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        /* ── Flame animation ── */
        @keyframes flicker1 {
          0%,100% { transform: scaleX(1) scaleY(1) translateY(0); opacity: 1; }
          25%      { transform: scaleX(0.92) scaleY(1.08) translateY(-2px); opacity: 0.95; }
          50%      { transform: scaleX(1.06) scaleY(0.96) translateY(1px); opacity: 1; }
          75%      { transform: scaleX(0.96) scaleY(1.04) translateY(-1px); opacity: 0.97; }
        }
        @keyframes flicker2 {
          0%,100% { transform: scaleX(1) scaleY(1); opacity: 0.85; }
          33%      { transform: scaleX(0.88) scaleY(1.12) translateY(-3px); opacity: 0.7; }
          66%      { transform: scaleX(1.08) scaleY(0.94); opacity: 0.9; }
        }
        @keyframes flicker3 {
          0%,100% { transform: scaleY(1) translateY(0); opacity: 0.6; }
          40%      { transform: scaleY(1.18) translateY(-4px); opacity: 0.5; }
          70%      { transform: scaleY(0.9) translateY(2px); opacity: 0.65; }
        }
        @keyframes torchGlow {
          0%,100% { box-shadow: 0 0 12px 4px rgba(255,140,0,0.5); }
          50%      { box-shadow: 0 0 22px 8px rgba(255,80,0,0.7); }
        }
        @keyframes shimmerGold {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .zsp-wrap {
          margin: 8px 4px 0;
          border-radius: 12px;
          border: 1px solid rgba(255,215,0,0.25);
          background: linear-gradient(180deg, #071a0b 0%, #0c2410 60%, #071a0b 100%);
          overflow: hidden;
          position: relative;
        }

        /* flag stripe top */
        .zsp-flag { display: flex; height: 3px; width: 100%; }
        .zsp-flag span { flex:1; display:block; }

        /* torch container */
        .zsp-torch-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0 4px;
          gap: 0;
        }
        .zsp-flame-stack {
          position: relative;
          width: 28px;
          height: 38px;
        }
        .zsp-flame {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 50% 50% 20% 20%;
          transform-origin: bottom center;
        }
        .zsp-f1 {
          width: 28px; height: 36px;
          background: radial-gradient(ellipse at 50% 80%, #ff4500, #ff8c00 40%, #ffd700 80%, transparent);
          animation: flicker1 1.4s ease-in-out infinite;
          animation-delay: 0s;
        }
        .zsp-f2 {
          width: 20px; height: 28px;
          background: radial-gradient(ellipse at 50% 75%, #ff2200, #ff6600 50%, #ffb300 85%, transparent);
          animation: flicker2 1.1s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .zsp-f3 {
          width: 12px; height: 18px;
          background: radial-gradient(ellipse at 50% 70%, #fff, #fffde0 40%, #ffe066 75%, transparent);
          animation: flicker3 0.9s ease-in-out infinite;
          animation-delay: 0.1s;
        }
        .zsp-handle {
          width: 10px; height: 18px;
          background: linear-gradient(180deg, #8B4513, #5c2d0a);
          border-radius: 2px 2px 4px 4px;
          margin-top: -1px;
          animation: torchGlow 1.6s ease-in-out infinite;
        }

        /* president section */
        .zsp-president {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 10px 4px;
          gap: 6px;
        }
        .zsp-photo-ring {
          width: 72px; height: 72px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(135deg, #FFD700, #ff8c00, #FFD700);
          animation: torchGlow 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .zsp-photo {
          width: 100%; height: 100%;
          border-radius: 50%;
          object-fit: cover;
          object-position: top center;
          border: 2px solid #071a0b;
        }
        .zsp-name {
          text-align: center;
          color: #FFD700;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          line-height: 1.3;
          text-transform: uppercase;
        }
        .zsp-title {
          text-align: center;
          color: rgba(255,215,0,0.55);
          font-size: 8px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* speech */
        .zsp-speech {
          margin: 4px 10px 8px;
          padding: 8px 10px;
          border-left: 2px solid #FFD700;
          background: rgba(255,215,0,0.04);
          border-radius: 0 6px 6px 0;
        }
        .zsp-speech p {
          color: rgba(255,255,255,0.78);
          font-size: 9px;
          line-height: 1.55;
          font-style: italic;
        }
        .zsp-speech-attr {
          margin-top: 4px;
          color: rgba(255,215,0,0.5);
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        /* coat of arms */
        .zsp-coa-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 6px 10px 4px;
        }
        .zsp-coa-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          flex: 1;
        }
        .zsp-coa-img {
          width: 44px; height: 44px;
          object-fit: contain;
          filter: drop-shadow(0 0 4px rgba(255,215,0,0.3));
        }
        .zsp-coa-label {
          color: rgba(255,215,0,0.45);
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          text-align: center;
          letter-spacing: 0.3px;
        }

        /* birthday message */
        .zsp-bday {
          margin: 4px 10px 10px;
          padding: 7px 10px;
          border-radius: 8px;
          background: linear-gradient(90deg, rgba(0,100,0,0.3), rgba(220,20,60,0.15), rgba(0,100,0,0.3));
          border: 1px solid rgba(255,215,0,0.2);
          text-align: center;
        }
        .zsp-bday-num {
          font-size: 22px;
          font-weight: 900;
          background: linear-gradient(90deg, #FFD700, #ff8c00, #FFD700);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerGold 2.5s linear infinite;
          line-height: 1;
        }
        .zsp-bday-text {
          color: rgba(255,255,255,0.8);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-top: 2px;
        }
        .zsp-bday-date {
          color: rgba(255,215,0,0.5);
          font-size: 8px;
          margin-top: 2px;
        }

        /* bottom flag */
        .zsp-flag-bottom { display: flex; height: 3px; width: 100%; }
        .zsp-flag-bottom span { flex:1; display:block; }
      `}</style>

      <div className="zsp-wrap">
        {/* Top flag stripe */}
        <div className="zsp-flag">
          <span style={{background:"#006400"}}/>
          <span style={{background:"#FFD700"}}/>
          <span style={{background:"#DC143C"}}/>
          <span style={{background:"#111"}}/>
          <span style={{background:"#DC143C"}}/>
          <span style={{background:"#FFD700"}}/>
          <span style={{background:"#006400"}}/>
        </div>

        {/* Animated torch */}
        <div className="zsp-torch-wrap">
          <div className="zsp-flame-stack">
            <div className="zsp-flame zsp-f1" />
            <div className="zsp-flame zsp-f2" />
            <div className="zsp-flame zsp-f3" />
          </div>
          <div className="zsp-handle" />
        </div>

        {/* President */}
        <div className="zsp-president">
          <div className="zsp-photo-ring">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/president-ed.jpg"
              alt="H.E. President E.D. Mnangagwa"
              className="zsp-photo"
            />
          </div>
          <div>
            <p className="zsp-name">H.E. Emmerson D. Mnangagwa</p>
            <p className="zsp-title">President of the Republic of Zimbabwe</p>
          </div>
        </div>

        {/* Presidential speech */}
        <div className="zsp-speech">
          <p>
            &ldquo;The name Munhumutapa evokes heritage, continuity, and authority,
            reminding us that progress is strongest when it is anchored in history,
            culture, and shared values. This Cup carries that symbolism forward,
            serving as both a tribute to our past and an investment in our future.&rdquo;
          </p>
          <p className="zsp-speech-attr">— Munhumutapa Cup Address</p>
        </div>

        {/* Coat of arms */}
        <div className="zsp-coa-row">
          <div className="zsp-coa-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/zim-coa.jpg" alt="Zimbabwe Coat of Arms" className="zsp-coa-img" />
            <span className="zsp-coa-label">Republic of Zimbabwe</span>
          </div>
          <div className="zsp-coa-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/munhumutapa-coa.jpg" alt="Munhumutapa" className="zsp-coa-img" />
            <span className="zsp-coa-label">Munhumutapa Cup</span>
          </div>
        </div>

        {/* Birthday message */}
        <div className="zsp-bday">
          <div className="zsp-bday-num">46</div>
          <div className="zsp-bday-text">🇿🇼 Years of Independence</div>
          <div className="zsp-bday-date">18 April 2026 · Pamberi neZimbabwe</div>
        </div>

        {/* Bottom flag stripe */}
        <div className="zsp-flag-bottom">
          <span style={{background:"#006400"}}/>
          <span style={{background:"#FFD700"}}/>
          <span style={{background:"#DC143C"}}/>
          <span style={{background:"#111"}}/>
          <span style={{background:"#DC143C"}}/>
          <span style={{background:"#FFD700"}}/>
          <span style={{background:"#006400"}}/>
        </div>
      </div>
    </>
  );
};
