"use client";

import Link from "next/link";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-black text-ink">Something went wrong</h1>
      <p className="mt-3 text-sm text-ink/60">
        {process.env.NODE_ENV === "development" || !error.digest ? error.message : "The action couldn't be completed."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => retry()} className="btn-primary">Try again</button>
        <Link href="/dashboard" className="btn-outline">Go home</Link>
      </div>
    </div>
  );
}
