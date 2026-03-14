import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Big number */}
      <div className="mb-2 text-[8rem] font-black leading-none text-muted-foreground/10 select-none">
        404
      </div>

      {/* Ball icon */}
      <div className="mb-6 text-5xl">⚽</div>

      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Try heading back home.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to home
        </Link>
        <Link
          href="/login"
          className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Sign in
        </Link>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Grassroots Sport Pro &mdash; Zimbabwe&apos;s #1 grassroots football platform
      </p>
    </div>
  );
}
