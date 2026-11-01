"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    });

    // Updates the nav whenever someone signs in or out
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user?.email ?? null);
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Refresh the unread count when you sign in or move to another page
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    createClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("read", false)
      .then(({ count }) => {
        if (!cancelled) setUnread(count ?? 0);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, pathname]);

  // The notifications page tells us when everything has been read
  useEffect(() => {
    const clear = () => setUnread(0);
    window.addEventListener("notifications-read", clear);
    return () => window.removeEventListener("notifications-read", clear);
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    setUnread(0);
    router.push("/");
    router.refresh();
  }

  const shownUnread = userId ? unread : 0;

  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 sm:px-8">
      <Link
        href="/"
        className="font-bold uppercase tracking-widest text-accent"
      >
        YT Log
      </Link>
      <Link href="/diary">Diary</Link>
      <Link href="/search">Search</Link>
      {email && (
        <Link href="/notifications" className="inline-flex items-center gap-1">
          Notifications
          {shownUnread > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-background">
              {shownUnread > 9 ? "9+" : shownUnread}
            </span>
          )}
        </Link>
      )}
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