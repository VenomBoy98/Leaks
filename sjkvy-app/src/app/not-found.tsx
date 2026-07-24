import Link from "next/link";
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <h1 className="font-display-md text-display-md text-primary">Page not found</h1>
      <Link href="/" className="text-secondary underline">Return home</Link>
    </main>
  );
}
