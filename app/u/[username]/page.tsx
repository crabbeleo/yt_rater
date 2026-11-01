import Link from "next/link";
import { connection } from "next/server";
import LogLinkForm from "@/components/LogLinkForm";
import Feed from "@/components/Feed";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await connection();
  const { tab } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4 sm:p-8">
      {!signedIn && (
        <section className="flex flex-col gap-4 py-6">
          <p className="font-[family-name:var(--font-display-src)] text-5xl font-bold uppercase leading-none tracking-wide sm:text-6xl">
            Log what <span className="text-accent">you watch.</span>
          </p>
          <p className="max-w-md text-muted">
            Rate and review YouTube videos, follow people, and see what they
            are watching.
          </p>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-background"
            >
              Create account
            </Link>
            <Link
              href="/search"
              className="rounded-lg border border-line px-4 py-2 hover:border-accent"
            >
              Browse
            </Link>
          </div>
        </section>
      )}

      <LogLinkForm />
      <Feed
        tab={tab === "everyone" || tab === "following" ? tab : undefined}
      />
    </main>
  );
}