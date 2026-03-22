"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SportKey } from "@/config/sports";
import { RegisterForm } from "@/app/register/_components/register-form";

function CoachRegisterInner() {
  const sport = (useSearchParams().get("sport") ?? "football") as SportKey;
  return <RegisterForm role="coach" sport={sport} accentColor="blue" />;
}

export default function CoachRegisterPage() {
  return <Suspense><CoachRegisterInner /></Suspense>;
}
