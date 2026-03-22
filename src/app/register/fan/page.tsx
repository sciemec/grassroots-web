"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SportKey } from "@/config/sports";
import { RegisterForm } from "@/app/register/_components/register-form";

function FanRegisterInner() {
  const sport = (useSearchParams().get("sport") ?? "football") as SportKey;
  return <RegisterForm role="fan" sport={sport} accentColor="amber" />;
}

export default function FanRegisterPage() {
  return <Suspense><FanRegisterInner /></Suspense>;
}
