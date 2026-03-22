"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SportKey } from "@/config/sports";
import { RegisterForm } from "@/app/register/_components/register-form";

function PlayerRegisterInner() {
  const sport = (useSearchParams().get("sport") ?? "football") as SportKey;
  return <RegisterForm role="player" sport={sport} accentColor="green" />;
}

export default function PlayerRegisterPage() {
  return <Suspense><PlayerRegisterInner /></Suspense>;
}
