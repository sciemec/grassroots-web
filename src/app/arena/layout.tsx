"use client";

import dynamic from "next/dynamic";

const GrassrootsNewsTicker = dynamic(() => import("@/components/ui/GrassrootsNewsTicker"), { ssr: false });

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GrassrootsNewsTicker />
    </>
  );
}
