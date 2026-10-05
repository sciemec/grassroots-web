// src/app/passport/[id]/page.tsx
// Redirects to the canonical player public profile page.
// Accepts both user UUID and passport_token — the backend resolves both.

import { redirect } from 'next/navigation';

interface Props { params: Promise<{ id: string }> }

export default async function PassportPage({ params }: Props) {
  const { id } = await params;
  redirect(`/player/public/${id}`);
}
