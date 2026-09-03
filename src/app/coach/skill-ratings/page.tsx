"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconChevronLeft,
  IconChevronRight,
  IconStar,
  IconSearch,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;

type Registration = {
  id: string;
  first_name: string;
  surname: string;
  sport: string | null;
  position: string | null;
  match_status: string;
};

function avgColor(avg: number): string {
  if (avg >= 8) return "#c0dd97";
  if (avg >= 6) return "#fac775";
  if (avg >= 4) return "#fb923c";
  return "#f87171";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SkillRatingsOverviewPage() {
  const token = useAuthStore((s) => s.token);

  const [players,        setPlayers]        = useState<Registration[]>({} as never);
  const [ratingAvgs,     setRatingAvgs]     = useState<Record<string, number | null>>({});
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`${API}/coach/registered-players`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const list: Registration[] = Array.isArray(json.data) ? json.data : [];
        setPlayers(list as never);
        setLoading(false);

        // Fire all ratings fetches in parallel — update as each resolves
        Promise.allSettled(
          list.map((p) =>
            fetch(`${API}/coach/registered-players/${p.id}/skill-ratings`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .then((rJson) => {
                const vals: number[] = (rJson.data ?? [])
                  .map((r: { rating: number }) => r.rating)
                  .filter((v: number) => v > 0);
                const avg =
                  vals.length > 0
                    ? vals.reduce((s, v) => s + v, 0) / vals.length
                    : null;
                return { id: p.id, avg };
              })
              .catch(() => ({ id: p.id, avg: null }))
          )
        ).then((results) => {
          const map: Record<string, number | null> = {};
          results.forEach((r) => {
            if (r.status === "fulfilled") map[r.value.id] = r.value.avg;
          });
          setRatingAvgs(map);
        });
      })
      .catch(() => setLoading(false));
  }, [token]);

  const playerList = Array.isArray(players) ? players : [];

  const filtered = playerList.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${p.first_name} ${p.surname}`.toLowerCase().includes(q) ||
      (p.sport ?? "").toLowerCase().includes(q)
    );
  });

  const totalRated = Object.values(ratingAvgs).filter(
    (v) => v !== null && v !== undefined
  ).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: 48 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 16px 0",
          maxWidth: 520,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          href="/coach"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "#1a1a1a",
            color: "#999",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <IconChevronLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
            Skill Ratings
          </div>
          <div style={{ color: "#777", fontSize: 11, marginTop: 1 }}>
            Rate your squad&apos;s technical skills
          </div>
        </div>
        <IconStar size={18} color="#c8962a" />
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Summary strip */}
        {!loading && playerList.length > 0 && (
          <div
            style={{
              background: "#151515",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 20,
              display: "flex",
              gap: 0,
            }}
          >
            {[
              { value: playerList.length, label: "Players",  color: "#c0dd97" },
              { value: totalRated,        label: "Rated",    color: "#c8962a" },
              { value: playerList.length - totalRated, label: "Pending", color: "#555" },
            ].map((item, idx) => (
              <div key={idx} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                {idx > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "10%",
                      height: "80%",
                      width: 1,
                      background: "#1e1e1e",
                    }}
                  />
                )}
                <div style={{ color: item.color, fontSize: 24, fontWeight: 800 }}>
                  {item.value}
                </div>
                <div
                  style={{
                    color: "#555",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginTop: 2,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {playerList.length > 4 && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <IconSearch
              size={13}
              color="#555"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 32px",
                background: "#151515",
                border: "1px solid #1e1e1e",
                borderRadius: 10,
                color: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* List */}
        {loading ? (
          <div
            style={{ color: "#555", fontSize: 13, textAlign: "center", paddingTop: 48 }}
          >
            Loading squad…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: "#151515",
              borderRadius: 14,
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
            <div
              style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 6 }}
            >
              {search ? "No players match your search" : "No players registered yet"}
            </div>
            <div style={{ color: "#555", fontSize: 12, marginBottom: 18 }}>
              {search
                ? "Try a different name or sport"
                : "Add players in the Player Registry first"}
            </div>
            {!search && (
              <Link
                href="/coach/registered-players"
                style={{
                  display: "inline-block",
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: "#1a5c2a",
                  color: "#c0dd97",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Open Player Registry
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Column header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 52,
                paddingRight: 60,
                marginBottom: 2,
              }}
            >
              <div style={{ flex: 1, color: "#555", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Player
              </div>
              <div style={{ color: "#555", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Avg
              </div>
            </div>

            {filtered.map((player) => {
              const avg = ratingAvgs[player.id];
              const hasRating = avg !== null && avg !== undefined;
              const col = hasRating ? avgColor(avg!) : "#333";

              return (
                <Link
                  key={player.id}
                  href={`/coach/skill-ratings/${player.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#151515",
                    borderRadius: 12,
                    padding: "11px 14px",
                    textDecoration: "none",
                  }}
                >
                  {/* Avatar ring */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "#1a1a1a",
                      border: `2px solid ${hasRating ? col : "#222"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: hasRating ? col : "#444",
                      }}
                    >
                      {player.first_name[0]}
                      {player.surname[0]}
                    </span>
                  </div>

                  {/* Name + sport */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {player.first_name} {player.surname}
                    </div>
                    <div style={{ color: "#666", fontSize: 10.5, marginTop: 2 }}>
                      {[player.sport, player.position]
                        .filter(Boolean)
                        .join(" · ") || "No sport set"}
                    </div>
                  </div>

                  {/* Score badge + arrow */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    {hasRating ? (
                      <div
                        style={{
                          background: "#111",
                          borderRadius: 8,
                          padding: "3px 10px",
                          color: col,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {avg!.toFixed(1)}
                        <span style={{ fontSize: 9, color: "#444", marginLeft: 2 }}>
                          /10
                        </span>
                      </div>
                    ) : (
                      <div style={{ color: "#444", fontSize: 11 }}>Rate</div>
                    )}
                    <IconChevronRight size={14} color="#333" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
