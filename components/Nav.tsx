"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    // Updates the nav whenever someone signs in or out
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user?.email ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 sm:px-8">
      <Link href="/" className="font-bold uppercase tracking-widest text-accent">
        YT Log
      </Link>
      <Link href="/diary">Diary</Link>
      <Link href="/feed">Feed</Link>
      <Link href="/search">Search</Link>
      <div className="ml-auto flex items-center gap-3 text-sm">
        {email ? (
          <>
            <Link href="/settings" className="hidden text-muted sm:inline">
              {email}
            </Link>
            <Link href="/settings" className="sm:hidden">
              Settings
            </Link>
            <button type="button" onClick={handleSignOut} className="underline">
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="underline">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}