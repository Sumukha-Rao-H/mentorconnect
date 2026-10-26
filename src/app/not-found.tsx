import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl font-black text-navy">404</p>
      <h1 className="mt-2 text-xl font-bold text-ink">Page not found</h1>
      <Link href="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
