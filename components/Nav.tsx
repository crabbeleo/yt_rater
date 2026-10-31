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
    <nav className="flex items-center gap-4 border-b border-gray-400 px-8 py-3">
      <Link href="/" className="font-bold">
        YT Log
      </Link>
      <Link href="/diary">Diary</Link>
      <Link href="/feed">Feed</Link>
      <div className="ml-auto flex items-center gap-3 text-sm">
        {email ? (
          <>
            <Link href="/settings" className="text-gray-500">
              {email}
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