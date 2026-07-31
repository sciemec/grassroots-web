"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CoachMessagesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/arena/messages"); }, [router]);
  return null;
}
