"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import SettingsIcon from "./SettingsIcon";

export default function Nav() {
  const { userId, email, username } = useCurrentUser();
  const [unread, setUnread] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();

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
    router.push("/");
    router.refresh();
  }

  const shownName = username ?? "";
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
      {userId && (
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
        {userId ? (
          <>
            {username && <Link href={`/u/${encodeURIComponent(username)}`} className="hidden text-muted sm:inline">
              {shownName}
            </Link>}
            <Link
              href="/settings"
              aria-label="Settings"
              title="Settings"
              className="flex text-muted hover:text-foreground"
            >
              <SettingsIcon />
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