"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScanTalentPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/player/weekly-session");
  }, [router]);
  return null;
}
