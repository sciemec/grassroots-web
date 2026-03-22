"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SportKey } from "@/config/sports";
import { RegisterForm } from "@/app/register/_components/register-form";

function ScoutRegisterInner() {
  const sport = (useSearchParams().get("sport") ?? "football") as SportKey;
  return <RegisterForm role="scout" sport={sport} accentColor="purple" />;
}

export default function ScoutRegisterPage() {
  return <Suspense><ScoutRegisterInner /></Suspense>;
}
